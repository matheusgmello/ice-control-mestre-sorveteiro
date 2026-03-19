import { Router } from "express";
import { db } from "@workspace/db";
import { tiposSorveteTable, adicionaisTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/tipos-sorvete", async (_req, res) => {
  try {
    const tipos = await db.select().from(tiposSorveteTable).orderBy(tiposSorveteTable.id);
    res.json(tipos.map(t => ({
      ...t,
      preco: Number(t.preco),
    })));
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar tipos de sorvete" });
  }
});

router.get("/adicionais", async (req, res) => {
  try {
    let query = db.select().from(adicionaisTable).$dynamic();
    if (req.query.tipo) {
      query = query.where(eq(adicionaisTable.tipo, req.query.tipo as string));
    }
    const adicionais = await query.orderBy(adicionaisTable.nome);
    res.json(adicionais.map(a => ({
      ...a,
      precoExtra: Number(a.precoExtra),
    })));
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar adicionais" });
  }
});

export default router;
