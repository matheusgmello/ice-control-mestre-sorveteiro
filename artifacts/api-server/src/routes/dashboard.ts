import { Router } from "express";
import { db } from "@workspace/db";
import { vendasTable, saboresSorveteTable, produtosTable, fiadosTable, metasTable } from "@workspace/db/schema";
import { and, gte, lte, lt, eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (_req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [{ totalHoje }] = await db
      .select({ totalHoje: sql<number>`COALESCE(SUM(${vendasTable.total}), 0)` })
      .from(vendasTable)
      .where(and(gte(vendasTable.dataVenda, startOfToday), eq(vendasTable.status, "FINALIZADA")));

    const [{ totalVendasHoje }] = await db
      .select({ totalVendasHoje: sql<number>`COUNT(*)` })
      .from(vendasTable)
      .where(and(gte(vendasTable.dataVenda, startOfToday), eq(vendasTable.status, "FINALIZADA")));

    const [{ totalMes }] = await db
      .select({ totalMes: sql<number>`COALESCE(SUM(${vendasTable.total}), 0)` })
      .from(vendasTable)
      .where(and(gte(vendasTable.dataVenda, startOfMonth), eq(vendasTable.status, "FINALIZADA")));

    const [{ totalVendasMes }] = await db
      .select({ totalVendasMes: sql<number>`COUNT(*)` })
      .from(vendasTable)
      .where(and(gte(vendasTable.dataVenda, startOfMonth), eq(vendasTable.status, "FINALIZADA")));

    const ticketMedio = Number(totalVendasMes) > 0 ? Number(totalMes) / Number(totalVendasMes) : 0;

    const [{ saldoFiadosAbertos, totalFiadosAbertos }] = await db
      .select({
        saldoFiadosAbertos: sql<number>`COALESCE(SUM(${fiadosTable.saldo}), 0)`,
        totalFiadosAbertos: sql<number>`COUNT(*)`,
      })
      .from(fiadosTable)
      .where(eq(fiadosTable.status, "ABERTO"));

    // Meta do mes
    const [meta] = await db.select().from(metasTable).where(eq(metasTable.mes, mesAtual));

    // Vendas diarias (last 30 days)
    const startOf30 = new Date(now);
    startOf30.setDate(startOf30.getDate() - 29);
    startOf30.setHours(0, 0, 0, 0);

    const vendasDiariasRaw = await db
      .select({
        data: sql<string>`DATE(${vendasTable.dataVenda})`,
        total: sql<number>`COALESCE(SUM(${vendasTable.total}), 0)`,
        quantidade: sql<number>`COUNT(*)`,
      })
      .from(vendasTable)
      .where(and(gte(vendasTable.dataVenda, startOf30), eq(vendasTable.status, "FINALIZADA")))
      .groupBy(sql`DATE(${vendasTable.dataVenda})`)
      .orderBy(sql`DATE(${vendasTable.dataVenda})`);

    // Sabores com baixo estoque
    const saboresBaixos = await db
      .select()
      .from(saboresSorveteTable)
      .where(and(eq(saboresSorveteTable.ativo, true), lt(saboresSorveteTable.estoqueBolas, saboresSorveteTable.estoqueMinimo)));

    // Produtos com baixo estoque
    const produtosBaixos = await db
      .select()
      .from(produtosTable)
      .where(and(eq(produtosTable.ativo, true), sql`${produtosTable.estoque} <= ${produtosTable.estoqueMinimo}`));

    res.json({
      totalHoje: Number(totalHoje),
      totalMes: Number(totalMes),
      ticketMedio: Number(ticketMedio.toFixed(2)),
      totalVendasHoje: Number(totalVendasHoje),
      saldoFiadosAbertos: Number(saldoFiadosAbertos),
      totalFiadosAbertos: Number(totalFiadosAbertos),
      metaMes: meta ? Number(meta.valor) : null,
      progressoMeta: meta ? Math.min(100, (Number(totalMes) / Number(meta.valor)) * 100) : 0,
      vendasDiarias: vendasDiariasRaw.map(v => ({
        data: v.data,
        total: Number(v.total),
        quantidade: Number(v.quantidade),
      })),
      saboresBaixoEstoque: saboresBaixos,
      produtosBaixoEstoque: produtosBaixos.map(p => ({
        ...p,
        preco: Number(p.preco),
        precoCusto: p.precoCusto ? Number(p.precoCusto) : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dashboard" });
  }
});

export default router;
