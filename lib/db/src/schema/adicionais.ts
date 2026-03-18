import { pgTable, serial, varchar, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adicionaisTable = pgTable("adicionais", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull().default("adicional"),
  estoque: integer("estoque").notNull().default(0),
  precoExtra: numeric("preco_extra", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const insertAdicionalSchema = createInsertSchema(adicionaisTable).omit({ id: true });
export type InsertAdicional = z.infer<typeof insertAdicionalSchema>;
export type Adicional = typeof adicionaisTable.$inferSelect;
