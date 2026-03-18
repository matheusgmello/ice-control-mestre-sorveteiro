import { pgTable, serial, integer, numeric, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientesTable } from "./clientes";

export const fiadosTable = pgTable("fiados", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientesTable.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  valorPago: numeric("valor_pago", { precision: 10, scale: 2 }).notNull().default("0"),
  saldo: numeric("saldo", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("ABERTO"),
  observacoes: text("observacoes"),
  data: timestamp("data").notNull().defaultNow(),
  dataPagamento: timestamp("data_pagamento"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fiadoItensTable = pgTable("fiado_itens", {
  id: serial("id").primaryKey(),
  fiadoId: integer("fiado_id").notNull().references(() => fiadosTable.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id"),
  produto: varchar("produto", { length: 150 }).notNull(),
  quantidade: integer("quantidade").notNull().default(1),
  preco: numeric("preco", { precision: 10, scale: 2 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pagamentosFiadoTable = pgTable("pagamentos_fiado", {
  id: serial("id").primaryKey(),
  fiadoId: integer("fiado_id").notNull().references(() => fiadosTable.id, { onDelete: "cascade" }),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 30 }).notNull().default("Dinheiro"),
  observacoes: text("observacoes"),
  dataPagamento: timestamp("data_pagamento").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFiadoSchema = createInsertSchema(fiadosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFiado = z.infer<typeof insertFiadoSchema>;
export type Fiado = typeof fiadosTable.$inferSelect;
