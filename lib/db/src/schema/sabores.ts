import { pgTable, serial, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const saboresSorveteTable = pgTable("sabores_sorvete", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  estoqueBolas: integer("estoque_bolas").notNull().default(0),
  estoqueMinimo: integer("estoque_minimo").notNull().default(20),
  ativo: boolean("ativo").notNull().default(true),
});

export const insertSaborSchema = createInsertSchema(saboresSorveteTable).omit({ id: true });
export type InsertSabor = z.infer<typeof insertSaborSchema>;
export type Sabor = typeof saboresSorveteTable.$inferSelect;
