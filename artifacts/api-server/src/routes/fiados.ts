import { Router } from "express";
import { db } from "@workspace/db";
import { fiadosTable, fiadoItensTable, pagamentosFiadoTable, clientesTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/fiados", async (req, res) => {
  try {
    const conditions: any[] = [];
    if (req.query.clienteId) conditions.push(eq(fiadosTable.clienteId, Number(req.query.clienteId)));
    if (req.query.status) conditions.push(eq(fiadosTable.status, req.query.status as string));

    const fiados = await db
      .select({
        id: fiadosTable.id,
        clienteId: fiadosTable.clienteId,
        clienteNome: clientesTable.nome,
        total: fiadosTable.total,
        valorPago: fiadosTable.valorPago,
        saldo: fiadosTable.saldo,
        status: fiadosTable.status,
        observacoes: fiadosTable.observacoes,
        data: fiadosTable.data,
        dataPagamento: fiadosTable.dataPagamento,
      })
      .from(fiadosTable)
      .leftJoin(clientesTable, eq(fiadosTable.clienteId, clientesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(fiadosTable.data);

    res.json(fiados.map(f => ({
      ...f,
      clienteNome: f.clienteNome ?? "Cliente",
      total: Number(f.total),
      valorPago: Number(f.valorPago),
      saldo: Number(f.saldo),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar fiados" });
  }
});

router.get("/fiados/:id", async (req, res) => {
  try {
    const fiadoId = Number(req.params.id);
    const [fiado] = await db
      .select({
        id: fiadosTable.id,
        clienteId: fiadosTable.clienteId,
        clienteNome: clientesTable.nome,
        total: fiadosTable.total,
        valorPago: fiadosTable.valorPago,
        saldo: fiadosTable.saldo,
        status: fiadosTable.status,
        observacoes: fiadosTable.observacoes,
        data: fiadosTable.data,
        dataPagamento: fiadosTable.dataPagamento,
      })
      .from(fiadosTable)
      .leftJoin(clientesTable, eq(fiadosTable.clienteId, clientesTable.id))
      .where(eq(fiadosTable.id, fiadoId));

    if (!fiado) return res.status(404).json({ error: "Fiado não encontrado" });

    const itens = await db.select().from(fiadoItensTable).where(eq(fiadoItensTable.fiadoId, fiadoId));
    const pagamentos = await db.select().from(pagamentosFiadoTable).where(eq(pagamentosFiadoTable.fiadoId, fiadoId)).orderBy(pagamentosFiadoTable.dataPagamento);

    res.json({
      ...fiado,
      clienteNome: fiado.clienteNome ?? "Cliente",
      total: Number(fiado.total),
      valorPago: Number(fiado.valorPago),
      saldo: Number(fiado.saldo),
      itens: itens.map(i => ({ ...i, preco: Number(i.preco), subtotal: Number(i.subtotal) })),
      pagamentos: pagamentos.map(p => ({ ...p, valor: Number(p.valor) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar fiado" });
  }
});

router.post("/fiados/:id/pagamento", async (req, res) => {
  try {
    const fiadoId = Number(req.params.id);
    const { valor, formaPagamento, observacoes } = req.body;
    if (!valor || !formaPagamento) return res.status(400).json({ error: "Valor e forma de pagamento são obrigatórios" });

    const [fiado] = await db.select().from(fiadosTable).where(eq(fiadosTable.id, fiadoId));
    if (!fiado) return res.status(404).json({ error: "Fiado não encontrado" });
    if (fiado.status === "PAGO") return res.status(400).json({ error: "Fiado já está pago" });

    const novoSaldo = Math.max(0, Number(fiado.saldo) - Number(valor));
    const novoValorPago = Number(fiado.valorPago) + Number(valor);
    const novoStatus = novoSaldo <= 0 ? "PAGO" : "ABERTO";

    await db.transaction(async (tx) => {
      await tx.insert(pagamentosFiadoTable).values({
        fiadoId,
        valor: String(Number(valor).toFixed(2)),
        formaPagamento,
        observacoes,
      });
      await tx.update(fiadosTable).set({
        valorPago: String(novoValorPago.toFixed(2)),
        saldo: String(novoSaldo.toFixed(2)),
        status: novoStatus,
        dataPagamento: novoStatus === "PAGO" ? new Date() : undefined,
        updatedAt: new Date(),
      }).where(eq(fiadosTable.id, fiadoId));
    });

    // Return updated
    const [updated] = await db
      .select({
        id: fiadosTable.id,
        clienteId: fiadosTable.clienteId,
        clienteNome: clientesTable.nome,
        total: fiadosTable.total,
        valorPago: fiadosTable.valorPago,
        saldo: fiadosTable.saldo,
        status: fiadosTable.status,
        observacoes: fiadosTable.observacoes,
        data: fiadosTable.data,
        dataPagamento: fiadosTable.dataPagamento,
      })
      .from(fiadosTable)
      .leftJoin(clientesTable, eq(fiadosTable.clienteId, clientesTable.id))
      .where(eq(fiadosTable.id, fiadoId));

    const itens = await db.select().from(fiadoItensTable).where(eq(fiadoItensTable.fiadoId, fiadoId));
    const pagamentos = await db.select().from(pagamentosFiadoTable).where(eq(pagamentosFiadoTable.fiadoId, fiadoId));

    res.json({
      ...updated,
      clienteNome: updated?.clienteNome ?? "Cliente",
      total: Number(updated?.total),
      valorPago: Number(updated?.valorPago),
      saldo: Number(updated?.saldo),
      itens: itens.map(i => ({ ...i, preco: Number(i.preco), subtotal: Number(i.subtotal) })),
      pagamentos: pagamentos.map(p => ({ ...p, valor: Number(p.valor) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar pagamento" });
  }
});

export default router;
