import { pgTable, serial, varchar, numeric, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const produtosTable = pgTable("produtos", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 30 }).notNull().unique(),
  nome: varchar("nome", { length: 150 }).notNull(),
  categoria: varchar("categoria", { length: 50 }).notNull(),
  subcategoria: varchar("subcategoria", { length: 50 }),
  unidadeMedida: varchar("unidade_medida", { length: 20 }).notNull().default("un"),
  preco: numeric("preco", { precision: 10, scale: 2 }).notNull().default("0"),
  precoCusto: numeric("preco_custo", { precision: 10, scale: 2 }),
  estoque: integer("estoque").notNull().default(0),
  estoqueMinimo: integer("estoque_minimo").notNull().default(5),
  ativo: boolean("ativo").notNull().default(true),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProdutoSchema = createInsertSchema(produtosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtosTable.$inferSelect;
