import { Router } from "express";
import { db } from "@workspace/db";
import { vendasTable, itensVendaTable, itensSorveteSaboresTable, clientesTable, pagamentosVendaTable } from "@workspace/db/schema";
import { and, gte, lte, eq, desc, sql, isNotNull } from "drizzle-orm";

const router = Router();

function getDateRange(req: any) {
  const dataInicio = new Date(req.query.dataInicio as string);
  const dataFim = new Date(req.query.dataFim as string);
  dataFim.setDate(dataFim.getDate() + 1);
  return { dataInicio, dataFim };
}

router.get("/relatorios/vendas", async (req, res) => {
  try {
    const { dataInicio, dataFim } = getDateRange(req);
    const conditions = [
      gte(vendasTable.dataVenda, dataInicio),
      lte(vendasTable.dataVenda, dataFim),
      eq(vendasTable.status, "FINALIZADA"),
    ];

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
        criadoPorId: vendasTable.criadoPorId,
        criadoPorNome: vendasTable.criadoPorNome,
      })
      .from(vendasTable)
      .leftJoin(clientesTable, eq(vendasTable.clienteId, clientesTable.id))
      .where(and(...conditions))
      .orderBy(desc(vendasTable.dataVenda));

    const total = vendas.reduce((s, v) => s + Number(v.total), 0);
    const totalDesconto = vendas.reduce((s, v) => s + Number(v.desconto), 0);
    const totalAcrescimo = vendas.reduce((s, v) => s + Number(v.acrescimo), 0);
    const ticketMedio = vendas.length > 0 ? total / vendas.length : 0;

    // Admin breakdown
    const vendasPorAdmin = Object.values(
      vendas.reduce((acc: Record<string, any>, v: any) => {
        const nome = (v as any).criadoPorNome ?? "Sem registro";
        if (!acc[nome]) acc[nome] = { admin: nome, totalVendas: 0, totalFaturado: 0 };
        acc[nome].totalVendas++;
        acc[nome].totalFaturado += Number(v.total);
        return acc;
      }, {})
    );

    // Formas de pagamento breakdown
    const formasPagamento = await db
      .select({
        forma: pagamentosVendaTable.forma,
        total: sql<number>`SUM(${pagamentosVendaTable.valor})`,
        quantidade: sql<number>`COUNT(*)`,
      })
      .from(pagamentosVendaTable)
      .innerJoin(vendasTable, eq(pagamentosVendaTable.vendaId, vendasTable.id))
      .where(and(gte(vendasTable.dataVenda, dataInicio), lte(vendasTable.dataVenda, dataFim), eq(vendasTable.status, "FINALIZADA")))
      .groupBy(pagamentosVendaTable.forma);

    res.json({
      total: Number(total.toFixed(2)),
      totalDesconto: Number(totalDesconto.toFixed(2)),
      totalAcrescimo: Number(totalAcrescimo.toFixed(2)),
      totalVendas: vendas.length,
      ticketMedio: Number(ticketMedio.toFixed(2)),
      vendasPorAdmin: vendasPorAdmin.map((a: any) => ({ ...a, totalFaturado: Number(a.totalFaturado.toFixed(2)) })),
      vendas: vendas.map(v => ({
        ...v,
        total: Number(v.total),
        desconto: Number(v.desconto),
        acrescimo: Number(v.acrescimo),
        valorPago: Number(v.valorPago),
        troco: Number(v.troco),
      })),
      formasPagamento: formasPagamento.map(f => ({
        ...f,
        total: Number(f.total),
        quantidade: Number(f.quantidade),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar relatório de vendas" });
  }
});

router.get("/relatorios/produtos-mais-vendidos", async (req, res) => {
  try {
    const { dataInicio, dataFim } = getDateRange(req);
    const limit = Math.min(Number(req.query.limit || 20), 100);

    const resultado = await db
      .select({
        produtoId: itensVendaTable.produtoId,
        nome: itensVendaTable.produtoNome,
        categoria: sql<string>`'Produto'`,
        quantidade: sql<number>`SUM(${itensVendaTable.quantidade})`,
        totalFaturado: sql<number>`SUM(${itensVendaTable.subtotal})`,
      })
      .from(itensVendaTable)
      .innerJoin(vendasTable, eq(itensVendaTable.vendaId, vendasTable.id))
      .where(and(
        gte(vendasTable.dataVenda, dataInicio),
        lte(vendasTable.dataVenda, dataFim),
        eq(vendasTable.status, "FINALIZADA"),
        eq(itensVendaTable.tipo, "produto"),
      ))
      .groupBy(itensVendaTable.produtoId, itensVendaTable.produtoNome)
      .orderBy(sql`SUM(${itensVendaTable.quantidade}) DESC`)
      .limit(limit);

    res.json(resultado.map(r => ({
      ...r,
      produtoId: r.produtoId ?? 0,
      quantidade: Number(r.quantidade),
      totalFaturado: Number(r.totalFaturado),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar ranking de produtos" });
  }
});

router.get("/relatorios/sabores-mais-vendidos", async (req, res) => {
  try {
    const { dataInicio, dataFim } = getDateRange(req);

    const resultado = await db
      .select({
        saborId: itensSorveteSaboresTable.saborId,
        nome: itensSorveteSaboresTable.saborNome,
        quantidade: sql<number>`COUNT(*)`,
      })
      .from(itensSorveteSaboresTable)
      .innerJoin(itensVendaTable, eq(itensSorveteSaboresTable.itemVendaId, itensVendaTable.id))
      .innerJoin(vendasTable, eq(itensVendaTable.vendaId, vendasTable.id))
      .where(and(
        gte(vendasTable.dataVenda, dataInicio),
        lte(vendasTable.dataVenda, dataFim),
        eq(vendasTable.status, "FINALIZADA"),
      ))
      .groupBy(itensSorveteSaboresTable.saborId, itensSorveteSaboresTable.saborNome)
      .orderBy(sql`COUNT(*) DESC`);

    res.json(resultado.map(r => ({ ...r, quantidade: Number(r.quantidade) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar ranking de sabores" });
  }
});

router.get("/relatorios/formas-pagamento", async (req, res) => {
  try {
    const { dataInicio, dataFim } = getDateRange(req);

    const resultado = await db
      .select({
        forma: pagamentosVendaTable.forma,
        total: sql<number>`SUM(${pagamentosVendaTable.valor})`,
        quantidade: sql<number>`COUNT(DISTINCT ${pagamentosVendaTable.vendaId})`,
      })
      .from(pagamentosVendaTable)
      .innerJoin(vendasTable, eq(pagamentosVendaTable.vendaId, vendasTable.id))
      .where(and(
        gte(vendasTable.dataVenda, dataInicio),
        lte(vendasTable.dataVenda, dataFim),
        eq(vendasTable.status, "FINALIZADA"),
      ))
      .groupBy(pagamentosVendaTable.forma)
      .orderBy(sql`SUM(${pagamentosVendaTable.valor}) DESC`);

    res.json(resultado.map(r => ({
      ...r,
      total: Number(r.total),
      quantidade: Number(r.quantidade),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar relatório de formas de pagamento" });
  }
});

export default router;
