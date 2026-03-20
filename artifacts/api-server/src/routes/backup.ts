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

const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

function parseDates<T extends Record<string, any>>(rows: T[]): T[] {
  return rows.map((row) => {
    const parsed: any = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "string" && ISO_RE.test(v)) {
        const d = new Date(v);
        parsed[k] = isNaN(d.getTime()) ? v : d;
      } else {
        parsed[k] = v;
      }
    }
    return parsed as T;
  });
}

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
      // ── DELETE em ordem: filhos antes dos pais (respeitar FK) ───────────
      await tx.delete(pagamentosVendaTable);
      await tx.delete(itensSorveteSaboresTable);
      await tx.delete(itensVendaTable);
      await tx.delete(vendasTable);
      await tx.delete(pagamentosFiadoTable);
      await tx.delete(fiadoItensTable);
      await tx.delete(fiadosTable);
      await tx.delete(movimentacoesEstoqueTable);
      await tx.delete(clientesTable);
      await tx.delete(produtosTable);
      await tx.delete(adicionaisTable);
      await tx.delete(saboresSorveteTable);
      await tx.delete(tiposSorveteTable);
      await tx.delete(metasTable);

      // ── INSERT em ordem: pais antes dos filhos ───────────────────────────
      if (tabelas.metas?.length) {
        await tx.insert(metasTable).values(parseDates(tabelas.metas));
        results.metas = tabelas.metas.length;
      }

      if (tabelas.tipos?.length) {
        await tx.insert(tiposSorveteTable).values(parseDates(tabelas.tipos));
        results.tipos = tabelas.tipos.length;
      }

      if (tabelas.sabores?.length) {
        await tx.insert(saboresSorveteTable).values(parseDates(tabelas.sabores));
        results.sabores = tabelas.sabores.length;
      }

      if (tabelas.adicionais?.length) {
        await tx.insert(adicionaisTable).values(parseDates(tabelas.adicionais));
        results.adicionais = tabelas.adicionais.length;
      }

      if (tabelas.produtos?.length) {
        await tx.insert(produtosTable).values(parseDates(tabelas.produtos));
        results.produtos = tabelas.produtos.length;
      }

      if (tabelas.clientes?.length) {
        await tx.insert(clientesTable).values(parseDates(tabelas.clientes));
        results.clientes = tabelas.clientes.length;
      }

      if (tabelas.movimentacoes?.length) {
        await tx.insert(movimentacoesEstoqueTable).values(parseDates(tabelas.movimentacoes));
        results.movimentacoes = tabelas.movimentacoes.length;
      }

      if (tabelas.vendas?.length) {
        await tx.insert(vendasTable).values(parseDates(tabelas.vendas));
        results.vendas = tabelas.vendas.length;
      }
      if (tabelas.itensVenda?.length) {
        await tx.insert(itensVendaTable).values(parseDates(tabelas.itensVenda));
        results.itensVenda = tabelas.itensVenda.length;
      }
      if (tabelas.itensSabores?.length) {
        await tx.insert(itensSorveteSaboresTable).values(parseDates(tabelas.itensSabores));
        results.itensSabores = tabelas.itensSabores.length;
      }
      if (tabelas.pagamentosVenda?.length) {
        await tx.insert(pagamentosVendaTable).values(parseDates(tabelas.pagamentosVenda));
        results.pagamentosVenda = tabelas.pagamentosVenda.length;
      }

      if (tabelas.fiados?.length) {
        await tx.insert(fiadosTable).values(parseDates(tabelas.fiados));
        results.fiados = tabelas.fiados.length;
      }
      if (tabelas.fiadoItens?.length) {
        await tx.insert(fiadoItensTable).values(parseDates(tabelas.fiadoItens));
        results.fiadoItens = tabelas.fiadoItens.length;
      }
      if (tabelas.pagamentosFiado?.length) {
        await tx.insert(pagamentosFiadoTable).values(parseDates(tabelas.pagamentosFiado));
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
