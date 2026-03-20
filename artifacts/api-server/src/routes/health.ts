import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/fix-sequences", async (_req, res) => {
  try {
    const tables = [
      "vendas",
      "itens_venda",
      "itens_sorvete_sabores",
      "pagamentos_venda",
      "clientes",
      "produtos",
      "estoque",
      "fiados",
      "metas",
      "tipos_sorvete",
      "sabores",
      "usuarios"
    ];

    const results = [];
    for (const table of tables) {
      // Tenta resetar a sequence para o valor máximo do ID + 1
      try {
        await db.execute(sql`
          SELECT setval(
            pg_get_serial_sequence(${table}, 'id'),
            COALESCE((SELECT MAX(id) FROM ${sql.raw(table)}), 0) + 1,
            false
          )
        `);
        results.push({ table, status: "success" });
      } catch (err: any) {
        results.push({ table, status: "error", message: err.message });
      }
    }

    res.json({ status: "ok", results });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
