import { Router } from "express";
import { db } from "@workspace/db";
import { clientesTable, fiadosTable } from "@workspace/db/schema";
import { eq, ilike, or, and, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/clientes", async (req, res) => {
  try {
    const conditions: any[] = [];
    if (req.query.busca) {
      const busca = `%${req.query.busca}%`;
      conditions.push(or(ilike(clientesTable.nome, busca), ilike(clientesTable.telefone, busca)));
    }
    if (req.query.ativo !== undefined) {
      conditions.push(eq(clientesTable.ativo, req.query.ativo === "true"));
    }

    const clientes = await db
      .select({
        id: clientesTable.id,
        nome: clientesTable.nome,
        telefone: clientesTable.telefone,
        endereco: clientesTable.endereco,
        observacoes: clientesTable.observacoes,
        ativo: clientesTable.ativo,
        createdAt: clientesTable.createdAt,
        saldoFiado: sql<number>`COALESCE(SUM(CASE WHEN ${fiadosTable.status} = 'ABERTO' THEN ${fiadosTable.saldo} ELSE 0 END), 0)`,
      })
      .from(clientesTable)
      .leftJoin(fiadosTable, eq(fiadosTable.clienteId, clientesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(clientesTable.id)
      .orderBy(clientesTable.nome);

    res.json(clientes.map(c => ({ ...c, saldoFiado: Number(c.saldoFiado) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

router.post("/clientes", async (req, res) => {
  try {
    const { nome, telefone, endereco, observacoes } = req.body;
    if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
    const [cliente] = await db.insert(clientesTable).values({ nome, telefone, endereco, observacoes }).returning();
    res.status(201).json({ ...cliente, saldoFiado: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

router.get("/clientes/:id", async (req, res) => {
  try {
    const [cliente] = await db
      .select({
        id: clientesTable.id,
        nome: clientesTable.nome,
        telefone: clientesTable.telefone,
        endereco: clientesTable.endereco,
        observacoes: clientesTable.observacoes,
        ativo: clientesTable.ativo,
        createdAt: clientesTable.createdAt,
        saldoFiado: sql<number>`COALESCE(SUM(CASE WHEN ${fiadosTable.status} = 'ABERTO' THEN ${fiadosTable.saldo} ELSE 0 END), 0)`,
      })
      .from(clientesTable)
      .leftJoin(fiadosTable, eq(fiadosTable.clienteId, clientesTable.id))
      .where(eq(clientesTable.id, Number(req.params.id)))
      .groupBy(clientesTable.id);

    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json({ ...cliente, saldoFiado: Number(cliente.saldoFiado) });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

router.put("/clientes/:id", async (req, res) => {
  try {
    const { nome, telefone, endereco, observacoes, ativo } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (nome !== undefined) updates.nome = nome;
    if (telefone !== undefined) updates.telefone = telefone;
    if (endereco !== undefined) updates.endereco = endereco;
    if (observacoes !== undefined) updates.observacoes = observacoes;
    if (ativo !== undefined) updates.ativo = ativo;
    const [cliente] = await db.update(clientesTable).set(updates).where(eq(clientesTable.id, Number(req.params.id))).returning();
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado" });
    res.json({ ...cliente, saldoFiado: 0 });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

export default router;
