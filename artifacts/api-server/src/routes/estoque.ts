import { Router } from "express";
import { db } from "@workspace/db";
import { movimentacoesEstoqueTable, produtosTable, saboresSorveteTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/estoque/movimentacoes", async (req, res) => {
  try {
    const conditions: any[] = [];
    if (req.query.produtoId) conditions.push(eq(movimentacoesEstoqueTable.produtoId, Number(req.query.produtoId)));
    if (req.query.tipo) conditions.push(eq(movimentacoesEstoqueTable.tipo, req.query.tipo as string));
    if (req.query.dataInicio) conditions.push(gte(movimentacoesEstoqueTable.dataMovimentacao, new Date(req.query.dataInicio as string)));
    if (req.query.dataFim) {
      const fim = new Date(req.query.dataFim as string);
      fim.setDate(fim.getDate() + 1);
      conditions.push(lte(movimentacoesEstoqueTable.dataMovimentacao, fim));
    }

    const movimentacoes = await db
      .select({
        id: movimentacoesEstoqueTable.id,
        produtoId: movimentacoesEstoqueTable.produtoId,
        produtoNome: produtosTable.nome,
        tipo: movimentacoesEstoqueTable.tipo,
        quantidade: movimentacoesEstoqueTable.quantidade,
        estoqueAntes: movimentacoesEstoqueTable.estoqueAntes,
        estoqueDepois: movimentacoesEstoqueTable.estoqueDepois,
        motivo: movimentacoesEstoqueTable.motivo,
        observacoes: movimentacoesEstoqueTable.observacoes,
        dataMovimentacao: movimentacoesEstoqueTable.dataMovimentacao,
        precoCusto: movimentacoesEstoqueTable.precoCusto,
        valorTotalNota: movimentacoesEstoqueTable.valorTotalNota,
      })
      .from(movimentacoesEstoqueTable)
      .leftJoin(produtosTable, eq(movimentacoesEstoqueTable.produtoId, produtosTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(movimentacoesEstoqueTable.dataMovimentacao))
      .limit(200);

    res.json(movimentacoes.map(m => ({
      ...m,
      produtoNome: m.produtoNome ?? "Produto removido",
      precoCusto: m.precoCusto ? Number(m.precoCusto) : null,
      valorTotalNota: m.valorTotalNota ? Number(m.valorTotalNota) : null,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar movimentações" });
  }
});

router.post("/estoque/movimentacoes", async (req, res) => {
  try {
    const { produtoId, tipo, quantidade, motivo, observacoes, precoCusto, valorTotalNota } = req.body;
    if (!produtoId || !tipo || !quantidade) {
      return res.status(400).json({ error: "produtoId, tipo e quantidade são obrigatórios" });
    }

    const [produto] = await db.select().from(produtosTable).where(eq(produtosTable.id, produtoId));
    if (!produto) return res.status(404).json({ error: "Produto não encontrado" });

    const estoqueAntes = produto.estoque;
    const delta = tipo === "entrada" ? quantidade : -quantidade;
    const estoqueDepois = estoqueAntes + delta;

    if (estoqueDepois < 0) {
      return res.status(400).json({ error: "Estoque insuficiente" });
    }

    let novoPrecoCusto = produto.precoCusto;
    if (tipo === "entrada" && valorTotalNota && quantidade > 0) {
      const custoUnitario = Number(valorTotalNota) / quantidade;
      const estoqueAtual = estoqueAntes;
      if (estoqueAtual <= 0) {
        novoPrecoCusto = String(custoUnitario.toFixed(2));
      } else {
        const custoAnterior = Number(produto.precoCusto || 0);
        const custoMedio = (custoAnterior * estoqueAtual + Number(valorTotalNota)) / (estoqueAtual + quantidade);
        novoPrecoCusto = String(custoMedio.toFixed(2));
      }
    }

    await db.update(produtosTable).set({
      estoque: estoqueDepois,
      precoCusto: novoPrecoCusto ?? undefined,
      updatedAt: new Date(),
    }).where(eq(produtosTable.id, produtoId));

    const [mov] = await db.insert(movimentacoesEstoqueTable).values({
      produtoId,
      tipo,
      quantidade,
      estoqueAntes,
      estoqueDepois,
      motivo,
      observacoes,
      precoCusto: precoCusto != null ? String(precoCusto) : undefined,
      valorTotalNota: valorTotalNota != null ? String(valorTotalNota) : undefined,
    }).returning();

    res.status(201).json({
      ...mov,
      produtoNome: produto.nome,
      precoCusto: mov.precoCusto ? Number(mov.precoCusto) : null,
      valorTotalNota: mov.valorTotalNota ? Number(mov.valorTotalNota) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar movimentação" });
  }
});

router.post("/estoque/sabores/movimentacoes", async (req, res) => {
  try {
    const { saborId, tipo, quantidade, motivo } = req.body;
    if (!saborId || !tipo || !quantidade) {
      return res.status(400).json({ error: "saborId, tipo e quantidade são obrigatórios" });
    }

    const [sabor] = await db.select().from(saboresSorveteTable).where(eq(saboresSorveteTable.id, saborId));
    if (!sabor) return res.status(404).json({ error: "Sabor não encontrado" });

    const delta = tipo === "entrada" ? quantidade : -quantidade;
    const novoEstoque = sabor.estoqueBolas + delta;

    if (novoEstoque < 0) {
      return res.status(400).json({ error: "Estoque de bolas insuficiente" });
    }

    const [updated] = await db.update(saboresSorveteTable).set({ estoqueBolas: novoEstoque }).where(eq(saboresSorveteTable.id, saborId)).returning();
    res.status(201).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao movimentar estoque de sabor" });
  }
});

export default router;
