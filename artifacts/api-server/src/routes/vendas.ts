import { Router } from "express";
import { db } from "@workspace/db";
import {
  vendasTable, itensVendaTable, itensSorveteSaboresTable, pagamentosVendaTable,
  produtosTable, saboresSorveteTable, adicionaisTable, tiposSorveteTable,
  fiadosTable, fiadoItensTable, clientesTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { extractUser } from "../middleware/auth";

const router = Router();

function formatCodigo(id: number): string {
  return `VC${String(id).padStart(6, "0")}`;
}

router.get("/vendas", async (req, res) => {
  try {
    const conditions: any[] = [];
    if (req.query.dataInicio) conditions.push(gte(vendasTable.dataVenda, new Date(req.query.dataInicio as string)));
    if (req.query.dataFim) {
      const fim = new Date(req.query.dataFim as string);
      fim.setDate(fim.getDate() + 1);
      conditions.push(lte(vendasTable.dataVenda, fim));
    }
    if (req.query.status) conditions.push(eq(vendasTable.status, req.query.status as string));
    if (req.query.formaPagamento) conditions.push(eq(vendasTable.formasPagamento, req.query.formaPagamento as string));

    const limit = Math.min(Number(req.query.limit || 100), 500);
    const offset = Number(req.query.offset || 0);

    const vendas = await db
      .select({
        id: vendasTable.id,
        codigoVenda: vendasTable.codigoVenda,
        clienteId: vendasTable.clienteId,
        clienteNome: clientesTable.nome,
        total: vendasTable.total,
        desconto: vendasTable.desconto,
        acrescimo: vendasTable.acrescimo,
        valorPago: vendasTable.valorPago,
        troco: vendasTable.troco,
        formasPagamento: vendasTable.formasPagamento,
        status: vendasTable.status,
        observacoes: vendasTable.observacoes,
        motivoCancelamento: vendasTable.motivoCancelamento,
        dataVenda: vendasTable.dataVenda,
        dataCancelamento: vendasTable.dataCancelamento,
      })
      .from(vendasTable)
      .leftJoin(clientesTable, eq(vendasTable.clienteId, clientesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vendasTable.dataVenda))
      .limit(limit)
      .offset(offset);

    res.json(vendas.map(v => ({
      ...v,
      total: Number(v.total),
      desconto: Number(v.desconto),
      acrescimo: Number(v.acrescimo),
      valorPago: Number(v.valorPago),
      troco: Number(v.troco),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar vendas" });
  }
});

router.post("/vendas", async (req, res) => {
  try {
    const admin = extractUser(req);
    const { itens, pagamentos, desconto = 0, acrescimo = 0, clienteId, observacoes } = req.body;
    if (!itens || !itens.length) return res.status(400).json({ error: "Itens são obrigatórios" });
    if (!pagamentos || !pagamentos.length) return res.status(400).json({ error: "Pagamentos são obrigatórios" });

    // Normalize payment field: support both 'forma' and 'metodo'
    const pagamentosNorm = pagamentos.map((p: any) => ({ ...p, forma: p.forma ?? p.metodo }));

    // Pre-fill missing prices from DB (before transaction for total calculation)
    for (const item of itens) {
      if (item.produtoId && !item.precoUnitario) {
        const [p] = await db.select({ preco: produtosTable.preco, nome: produtosTable.nome }).from(produtosTable).where(eq(produtosTable.id, item.produtoId));
        if (p) {
          item.precoUnitario = Number(p.preco);
          if (!item.produtoNome) item.produtoNome = p.nome;
        }
      }
      if (item.tipo === "sorvete" && item.tipoSorveteId && !item.precoUnitario) {
        const [tipo] = await db.select({ preco: tiposSorveteTable.preco, nome: tiposSorveteTable.nome }).from(tiposSorveteTable).where(eq(tiposSorveteTable.id, item.tipoSorveteId));
        if (tipo) {
          item.precoUnitario = Number(tipo.preco);
          if (!item.tipoSorveteNome) item.tipoSorveteNome = tipo.nome;
        }
      }
    }

    const subtotal = itens.reduce((sum: number, item: any) => sum + (Number(item.precoUnitario) || 0) * item.quantidade, 0);
    const total = Math.max(0, subtotal - Number(desconto) + Number(acrescimo));
    const valorPago = pagamentosNorm.reduce((sum: number, p: any) => sum + Number(p.valor), 0);
    const dinheiro = pagamentosNorm.find((p: any) => p.forma === "dinheiro");
    const troco = dinheiro ? Math.max(0, Number(dinheiro.valor) - total) : 0;
    const formasPagamento = [...new Set(pagamentosNorm.map((p: any) => p.forma))].join(", ");
    const hasFiado = pagamentosNorm.some((p: any) => p.forma === "fiado");

    await db.transaction(async (tx) => {
      // Validate and deduct stock
      for (const item of itens) {
        if (item.tipo === "produto" && item.produtoId) {
          const [prod] = await tx.select().from(produtosTable).where(eq(produtosTable.id, item.produtoId)).for("update");
          if (!prod) throw new Error(`Produto ${item.produtoId} não encontrado`);
          if (prod.estoque < item.quantidade) throw new Error(`Estoque insuficiente: ${prod.nome}`);
          await tx.update(produtosTable).set({ estoque: prod.estoque - item.quantidade, updatedAt: new Date() }).where(eq(produtosTable.id, item.produtoId));
        } else if (item.tipo === "sorvete") {
          // Deduct flavor balls
          if (item.saboresIds?.length) {
            const saborCounts: Record<number, number> = {};
            for (const sid of item.saboresIds) saborCounts[sid] = (saborCounts[sid] || 0) + 1;
            for (const [saborId, count] of Object.entries(saborCounts)) {
              const [sabor] = await tx.select().from(saboresSorveteTable).where(eq(saboresSorveteTable.id, Number(saborId))).for("update");
              if (!sabor) throw new Error(`Sabor ${saborId} não encontrado`);
              if (sabor.estoqueBolas < count * item.quantidade) throw new Error(`Estoque de bolas insuficiente: ${sabor.nome}`);
              await tx.update(saboresSorveteTable).set({ estoqueBolas: sabor.estoqueBolas - count * item.quantidade }).where(eq(saboresSorveteTable.id, Number(saborId)));
            }
          }
          // Deduct tipo embalagem
          if (item.tipoSorveteId) {
            const [tipo] = await tx.select().from(tiposSorveteTable).where(eq(tiposSorveteTable.id, item.tipoSorveteId));
            if (tipo?.produtoEmbalagembId) {
              const [emb] = await tx.select().from(produtosTable).where(eq(produtosTable.id, tipo.produtoEmbalagembId)).for("update");
              if (emb && emb.estoque > 0) {
                await tx.update(produtosTable).set({ estoque: emb.estoque - item.quantidade, updatedAt: new Date() }).where(eq(produtosTable.id, tipo.produtoEmbalagembId));
              }
            }
          }
        }
      }

      // Create venda
      const [venda] = await tx.insert(vendasTable).values({
        clienteId: clienteId || null,
        total: String(total.toFixed(2)),
        desconto: String(Number(desconto).toFixed(2)),
        acrescimo: String(Number(acrescimo).toFixed(2)),
        valorPago: String(valorPago.toFixed(2)),
        troco: String(troco.toFixed(2)),
        formasPagamento,
        status: "FINALIZADA",
        observacoes,
        criadoPorId: admin?.id ?? null,
        criadoPorNome: admin?.nome ?? null,
      }).returning();

      // Update codigo_venda
      await tx.update(vendasTable).set({ codigoVenda: formatCodigo(venda.id) }).where(eq(vendasTable.id, venda.id));

      // Insert items
      for (const item of itens) {
        let prodNome = item.produtoNome || "Produto";
        // Resolve product name and price from DB if not provided
        if (item.produtoId && (!item.produtoNome || !item.precoUnitario)) {
          const [p] = await tx.select({ nome: produtosTable.nome, preco: produtosTable.preco }).from(produtosTable).where(eq(produtosTable.id, item.produtoId));
          if (p) {
            if (!item.produtoNome) { prodNome = p.nome; item.produtoNome = p.nome; }
            if (!item.precoUnitario) item.precoUnitario = Number(p.preco);
          }
        }
        if (item.tipo === "sorvete" && item.tipoSorveteId) {
          const [tipo] = await tx.select({ nome: tiposSorveteTable.nome }).from(tiposSorveteTable).where(eq(tiposSorveteTable.id, item.tipoSorveteId));
          if (tipo) prodNome = tipo.nome;
        }

        // Get cobertura name
        let coberturaName: string | undefined;
        if (item.coberturaId) {
          const [cob] = await tx.select({ nome: adicionaisTable.nome }).from(adicionaisTable).where(eq(adicionaisTable.id, item.coberturaId));
          if (cob) coberturaName = cob.nome;
        }

        // Get adicionais names
        const allAdicionaisIds = [...(item.adicionaisIds || []), ...(item.adicionaisPagosIds || [])];
        let adicionaisStr: string | undefined;
        if (allAdicionaisIds.length > 0) {
          const ads = await tx.select({ nome: adicionaisTable.nome }).from(adicionaisTable);
          const names = allAdicionaisIds.map((aid: number) => ads.find(a => a.nome)?.nome).filter(Boolean);
          adicionaisStr = names.join(", ") || undefined;
        }

        const [itemVenda] = await tx.insert(itensVendaTable).values({
          vendaId: venda.id,
          tipo: item.tipo,
          produtoId: item.produtoId || null,
          produtoNome: prodNome,
          quantidade: item.quantidade,
          precoUnitario: String(item.precoUnitario),
          subtotal: String((item.precoUnitario * item.quantidade).toFixed(2)),
          tipoSorveteId: item.tipoSorveteId || null,
          tipoSorveteNome: item.tipoSorveteNome || null,
          cobertura: coberturaName || null,
          adicionais: adicionaisStr || null,
          observacoes: item.observacoes || null,
        }).returning();

        // Insert sabores
        if (item.tipo === "sorvete" && item.saboresIds?.length) {
          const saboresData = await tx.select().from(saboresSorveteTable);
          const saborRows = item.saboresIds.map((sid: number) => {
            const s = saboresData.find(s => s.id === sid);
            return { itemVendaId: itemVenda.id, saborId: sid, saborNome: s?.nome || "Sabor" };
          });
          await tx.insert(itensSorveteSaboresTable).values(saborRows);
        }
      }

      // Insert pagamentos
      for (const pag of pagamentosNorm) {
        await tx.insert(pagamentosVendaTable).values({ vendaId: venda.id, forma: pag.forma, valor: String(pag.valor) });
      }

      // Create fiado if needed
      if (hasFiado && clienteId) {
        const fiadoValor = pagamentosNorm.filter((p: any) => p.forma === "fiado").reduce((s: number, p: any) => s + Number(p.valor), 0);
        const [fiado] = await tx.insert(fiadosTable).values({
          clienteId,
          total: String(fiadoValor.toFixed(2)),
          valorPago: "0",
          saldo: String(fiadoValor.toFixed(2)),
          status: "ABERTO",
        }).returning();

        // Insert fiado items
        for (const item of itens) {
          await tx.insert(fiadoItensTable).values({
            fiadoId: fiado.id,
            produtoId: item.produtoId || null,
            produto: item.produtoNome || item.tipoSorveteNome || "Item",
            quantidade: item.quantidade,
            preco: String(item.precoUnitario),
            subtotal: String((item.precoUnitario * item.quantidade).toFixed(2)),
          });
        }
      }

      const updatedVenda = { ...venda, codigoVenda: formatCodigo(venda.id) };
      res.status(201).json({
        ...updatedVenda,
        total: Number(updatedVenda.total),
        desconto: Number(updatedVenda.desconto),
        acrescimo: Number(updatedVenda.acrescimo),
        valorPago: Number(updatedVenda.valorPago),
        troco: Number(updatedVenda.troco),
      });
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro ao criar venda" });
  }
});

router.get("/vendas/:id", async (req, res) => {
  try {
    const vendaId = Number(req.params.id);

    const [venda] = await db
      .select({
        id: vendasTable.id,
        codigoVenda: vendasTable.codigoVenda,
        clienteId: vendasTable.clienteId,
        clienteNome: clientesTable.nome,
        total: vendasTable.total,
        desconto: vendasTable.desconto,
        acrescimo: vendasTable.acrescimo,
        valorPago: vendasTable.valorPago,
        troco: vendasTable.troco,
        formasPagamento: vendasTable.formasPagamento,
        status: vendasTable.status,
        observacoes: vendasTable.observacoes,
        motivoCancelamento: vendasTable.motivoCancelamento,
        dataVenda: vendasTable.dataVenda,
        dataCancelamento: vendasTable.dataCancelamento,
      })
      .from(vendasTable)
      .leftJoin(clientesTable, eq(vendasTable.clienteId, clientesTable.id))
      .where(eq(vendasTable.id, vendaId));

    if (!venda) return res.status(404).json({ error: "Venda não encontrada" });

    const itens = await db.select().from(itensVendaTable).where(eq(itensVendaTable.vendaId, vendaId));
    const pagamentos = await db.select().from(pagamentosVendaTable).where(eq(pagamentosVendaTable.vendaId, vendaId));

    // Fetch sabores for each sorvete item
    const itensComSabores = await Promise.all(itens.map(async item => {
      let sabores: any[] = [];
      if (item.tipo === "sorvete") {
        sabores = await db.select().from(itensSorveteSaboresTable).where(eq(itensSorveteSaboresTable.itemVendaId, item.id));
      }
      return {
        ...item,
        precoUnitario: Number(item.precoUnitario),
        subtotal: Number(item.subtotal),
        sabores: sabores.map(s => ({ id: s.saborId, nome: s.saborNome })),
      };
    }));

    res.json({
      ...venda,
      total: Number(venda.total),
      desconto: Number(venda.desconto),
      acrescimo: Number(venda.acrescimo),
      valorPago: Number(venda.valorPago),
      troco: Number(venda.troco),
      itens: itensComSabores,
      pagamentos: pagamentos.map(p => ({ ...p, valor: Number(p.valor) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar venda" });
  }
});

router.post("/vendas/:id/cancelar", async (req, res) => {
  try {
    const vendaId = Number(req.params.id);
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: "Motivo de cancelamento é obrigatório" });

    const [venda] = await db.select().from(vendasTable).where(eq(vendasTable.id, vendaId));
    if (!venda) return res.status(404).json({ error: "Venda não encontrada" });
    if (venda.status === "CANCELADA") return res.status(400).json({ error: "Venda já cancelada" });

    await db.transaction(async (tx) => {
      const itens = await tx.select().from(itensVendaTable).where(eq(itensVendaTable.vendaId, vendaId));

      for (const item of itens) {
        if (item.tipo === "produto" && item.produtoId) {
          const [prod] = await tx.select().from(produtosTable).where(eq(produtosTable.id, item.produtoId));
          if (prod) {
            await tx.update(produtosTable).set({ estoque: prod.estoque + item.quantidade, updatedAt: new Date() }).where(eq(produtosTable.id, item.produtoId));
          }
        } else if (item.tipo === "sorvete") {
          const sabores = await tx.select().from(itensSorveteSaboresTable).where(eq(itensSorveteSaboresTable.itemVendaId, item.id));
          const saborCounts: Record<number, number> = {};
          for (const s of sabores) saborCounts[s.saborId] = (saborCounts[s.saborId] || 0) + 1;
          for (const [saborId, count] of Object.entries(saborCounts)) {
            const [sabor] = await tx.select().from(saboresSorveteTable).where(eq(saboresSorveteTable.id, Number(saborId)));
            if (sabor) {
              await tx.update(saboresSorveteTable).set({ estoqueBolas: sabor.estoqueBolas + count * item.quantidade }).where(eq(saboresSorveteTable.id, Number(saborId)));
            }
          }
        }
      }

      await tx.update(vendasTable).set({
        status: "CANCELADA",
        motivoCancelamento: motivo,
        dataCancelamento: new Date(),
        updatedAt: new Date(),
      }).where(eq(vendasTable.id, vendaId));
    });

    const [updated] = await db.select().from(vendasTable).where(eq(vendasTable.id, vendaId));
    res.json({
      ...updated,
      total: Number(updated.total),
      desconto: Number(updated.desconto),
      acrescimo: Number(updated.acrescimo),
      valorPago: Number(updated.valorPago),
      troco: Number(updated.troco),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cancelar venda" });
  }
});

export default router;
