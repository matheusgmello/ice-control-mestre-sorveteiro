import { Router } from "express";
import { db } from "@workspace/db";
import { metasTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/metas", async (_req, res) => {
  try {
    const metas = await db.select().from(metasTable).orderBy(metasTable.mes);
    res.json(metas.map(m => ({ ...m, valor: Number(m.valor) })));
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar metas" });
  }
});

router.post("/metas", async (req, res) => {
  try {
    const { mes, valor, observacoes } = req.body;
    if (!mes || !valor) return res.status(400).json({ error: "Mês e valor são obrigatórios" });

    const existing = await db.select().from(metasTable).where(eq(metasTable.mes, mes));
    let meta;
    if (existing.length > 0) {
      [meta] = await db.update(metasTable).set({ valor: String(valor), observacoes, updatedAt: new Date() }).where(eq(metasTable.mes, mes)).returning();
    } else {
      [meta] = await db.insert(metasTable).values({ mes, valor: String(valor), observacoes }).returning();
    }
    res.json({ ...meta, valor: Number(meta.valor) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar meta" });
  }
});

export default router;
