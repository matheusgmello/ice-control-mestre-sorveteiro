import { pgTable, serial, integer, numeric, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movimentacoesEstoqueTable = pgTable("movimentacoes_estoque", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id").notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  quantidade: integer("quantidade").notNull(),
  estoqueAntes: integer("estoque_antes").notNull().default(0),
  estoqueDepois: integer("estoque_depois").notNull().default(0),
  motivo: varchar("motivo", { length: 100 }),
  observacoes: text("observacoes"),
  dataMovimentacao: timestamp("data_movimentacao").notNull().defaultNow(),
  precoCusto: numeric("preco_custo", { precision: 10, scale: 2 }),
  valorTotalNota: numeric("valor_total_nota", { precision: 10, scale: 2 }),
});

export const insertMovimentacaoSchema = createInsertSchema(movimentacoesEstoqueTable).omit({ id: true });
export type InsertMovimentacao = z.infer<typeof insertMovimentacaoSchema>;
export type MovimentacaoEstoque = typeof movimentacoesEstoqueTable.$inferSelect;
