import { pgTable, serial, varchar, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tiposSorveteTable = pgTable("tipos_sorvete", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 50 }).notNull(),
  numeroBolas: integer("numero_bolas").notNull().default(1),
  preco: numeric("preco", { precision: 10, scale: 2 }).notNull().default("0"),
  produtoEmbalagembId: integer("produto_embalagamb_id"),
  requerLeite: boolean("requer_leite").notNull().default(false),
  requerCanudo: boolean("requer_canudo").notNull().default(false),
});

export const insertTipoSorveteSchema = createInsertSchema(tiposSorveteTable).omit({ id: true });
export type InsertTipoSorvete = z.infer<typeof insertTipoSorveteSchema>;
export type TipoSorvete = typeof tiposSorveteTable.$inferSelect;
