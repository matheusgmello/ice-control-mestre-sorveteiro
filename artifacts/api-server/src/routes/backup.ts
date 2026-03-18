import { Router } from "express";
import { db } from "@workspace/db";
import {
  produtosTable, saboresSorveteTable, tiposSorveteTable, adicionaisTable,
  clientesTable, vendasTable, itensVendaTable, itensSorveteSaboresTable,
  pagamentosVendaTable, fiadosTable, fiadoItensTable, pagamentosFiadoTable,
  movimentacoesEstoqueTable, metasTable, usuariosTable,
} from "@workspace/db/schema";
import { extractUser } from "../middleware/auth";

const router = Router();

router.get("/backup/export", async (req, res) => {
  try {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado" });

    const [
      produtos, sabores, tipos, adicionais, clientes,
      vendas, itensVenda, itensSabores, pagamentosVenda,
      fiados, fiadoItens, pagamentosFiado,
      movimentacoes, metas,
    ] = await Promise.all([
      db.select().from(produtosTable),
      db.select().from(saboresSorveteTable),
      db.select().from(tiposSorveteTable),
      db.select().from(adicionaisTable),
      db.select().from(clientesTable),
      db.select().from(vendasTable),
      db.select().from(itensVendaTable),
      db.select().from(itensSorveteSaboresTable),
      db.select().from(pagamentosVendaTable),
      db.select().from(fiadosTable),
      db.select().from(fiadoItensTable),
      db.select().from(pagamentosFiadoTable),
      db.select().from(movimentacoesEstoqueTable),
      db.select().from(metasTable),
    ]);

    const backup = {
      versao: "2.0",
      exportadoEm: new Date().toISOString(),
      exportadoPor: user.nome,
      tabelas: {
        produtos, sabores, tipos, adicionais, clientes,
        vendas, itensVenda, itensSabores, pagamentosVenda,
        fiados, fiadoItens, pagamentosFiado,
        movimentacoes, metas,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const data = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="backup-icecontrol-${data}.json"`);
    res.send(json);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao exportar backup" });
  }
});

router.post("/backup/import", async (req, res) => {
  try {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado" });

    const { tabelas, versao } = req.body;
    if (!tabelas || !versao) return res.status(400).json({ error: "Formato de backup inválido" });

    const results: Record<string, number> = {};

    await db.transaction(async (tx) => {
      // Restore in dependency order — clear then insert
      // Non-FK tables first
      if (tabelas.metas?.length) {
        await tx.delete(metasTable);
        await tx.insert(metasTable).values(tabelas.metas);
        results.metas = tabelas.metas.length;
      }

      if (tabelas.adicionais?.length) {
        await tx.delete(adicionaisTable);
        await tx.insert(adicionaisTable).values(tabelas.adicionais);
        results.adicionais = tabelas.adicionais.length;
      }

      if (tabelas.sabores?.length) {
        await tx.delete(saboresSorveteTable);
        await tx.insert(saboresSorveteTable).values(tabelas.sabores);
        results.sabores = tabelas.sabores.length;
      }

      if (tabelas.tipos?.length) {
        await tx.delete(tiposSorveteTable);
        await tx.insert(tiposSorveteTable).values(tabelas.tipos);
        results.tipos = tabelas.tipos.length;
      }

      if (tabelas.produtos?.length) {
        await tx.delete(produtosTable);
        await tx.insert(produtosTable).values(tabelas.produtos);
        results.produtos = tabelas.produtos.length;
      }

      if (tabelas.clientes?.length) {
        await tx.delete(clientesTable);
        await tx.insert(clientesTable).values(tabelas.clientes);
        results.clientes = tabelas.clientes.length;
      }

      if (tabelas.movimentacoes?.length) {
        await tx.delete(movimentacoesEstoqueTable);
        await tx.insert(movimentacoesEstoqueTable).values(tabelas.movimentacoes);
        results.movimentacoes = tabelas.movimentacoes.length;
      }

      // Vendas and dependents
      if (tabelas.vendas?.length) {
        await tx.delete(pagamentosVendaTable);
        await tx.delete(itensSorveteSaboresTable);
        await tx.delete(itensVendaTable);
        await tx.delete(vendasTable);
        await tx.insert(vendasTable).values(tabelas.vendas);
        results.vendas = tabelas.vendas.length;
      }
      if (tabelas.itensVenda?.length) {
        await tx.insert(itensVendaTable).values(tabelas.itensVenda);
        results.itensVenda = tabelas.itensVenda.length;
      }
      if (tabelas.itensSabores?.length) {
        await tx.insert(itensSorveteSaboresTable).values(tabelas.itensSabores);
        results.itensSabores = tabelas.itensSabores.length;
      }
      if (tabelas.pagamentosVenda?.length) {
        await tx.insert(pagamentosVendaTable).values(tabelas.pagamentosVenda);
        results.pagamentosVenda = tabelas.pagamentosVenda.length;
      }

      // Fiados and dependents
      if (tabelas.fiados?.length) {
        await tx.delete(pagamentosFiadoTable);
        await tx.delete(fiadoItensTable);
        await tx.delete(fiadosTable);
        await tx.insert(fiadosTable).values(tabelas.fiados);
        results.fiados = tabelas.fiados.length;
      }
      if (tabelas.fiadoItens?.length) {
        await tx.insert(fiadoItensTable).values(tabelas.fiadoItens);
        results.fiadoItens = tabelas.fiadoItens.length;
      }
      if (tabelas.pagamentosFiado?.length) {
        await tx.insert(pagamentosFiadoTable).values(tabelas.pagamentosFiado);
        results.pagamentosFiado = tabelas.pagamentosFiado.length;
      }

      // Sync sequences so new inserts don't conflict with restored IDs
      const tables = [
        { name: "produtos", seq: "produtos_id_seq" },
        { name: "sabores_sorvete", seq: "sabores_sorvete_id_seq" },
        { name: "tipos_sorvete", seq: "tipos_sorvete_id_seq" },
        { name: "adicionais", seq: "adicionais_id_seq" },
        { name: "clientes", seq: "clientes_id_seq" },
        { name: "vendas", seq: "vendas_id_seq" },
        { name: "itens_venda", seq: "itens_venda_id_seq" },
        { name: "fiados", seq: "fiados_id_seq" },
        { name: "metas", seq: "metas_id_seq" },
      ];
      for (const t of tables) {
        try {
          await tx.execute(`SELECT setval('${t.seq}', COALESCE((SELECT MAX(id) FROM ${t.name}), 1))` as any);
        } catch { /* ignore if seq doesn't exist */ }
      }
    });

    res.json({ ok: true, restaurado: results });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Erro ao importar backup" });
  }
});

export default router;
