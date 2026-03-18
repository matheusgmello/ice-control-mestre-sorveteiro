import { pgTable, serial, varchar, numeric, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientesTable } from "./clientes";

export const vendasTable = pgTable("vendas", {
  id: serial("id").primaryKey(),
  codigoVenda: varchar("codigo_venda", { length: 40 }),
  clienteId: integer("cliente_id").references(() => clientesTable.id),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  desconto: numeric("desconto", { precision: 10, scale: 2 }).notNull().default("0"),
  acrescimo: numeric("acrescimo", { precision: 10, scale: 2 }).notNull().default("0"),
  valorPago: numeric("valor_pago", { precision: 10, scale: 2 }).notNull().default("0"),
  troco: numeric("troco", { precision: 10, scale: 2 }).notNull().default("0"),
  formasPagamento: varchar("formas_pagamento", { length: 100 }).notNull().default("Dinheiro"),
  status: varchar("status", { length: 20 }).notNull().default("FINALIZADA"),
  observacoes: text("observacoes"),
  motivoCancelamento: text("motivo_cancelamento"),
  criadoPorId: integer("criado_por_id"),
  criadoPorNome: varchar("criado_por_nome", { length: 100 }),
  dataVenda: timestamp("data_venda").notNull().defaultNow(),
  dataCancelamento: timestamp("data_cancelamento"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const itensVendaTable = pgTable("itens_venda", {
  id: serial("id").primaryKey(),
  vendaId: integer("venda_id").notNull().references(() => vendasTable.id, { onDelete: "cascade" }),
  tipo: varchar("tipo", { length: 20 }).notNull().default("produto"),
  produtoId: integer("produto_id"),
  produtoNome: varchar("produto_nome", { length: 150 }).notNull(),
  quantidade: integer("quantidade").notNull().default(1),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull().default("0"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
  tipoSorveteId: integer("tipo_sorvete_id"),
  tipoSorveteNome: varchar("tipo_sorvete_nome", { length: 50 }),
  cobertura: varchar("cobertura", { length: 100 }),
  adicionais: text("adicionais"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const itensSorveteSaboresTable = pgTable("itens_sorvete_sabores", {
  id: serial("id").primaryKey(),
  itemVendaId: integer("item_venda_id").notNull().references(() => itensVendaTable.id, { onDelete: "cascade" }),
  saborId: integer("sabor_id").notNull(),
  saborNome: varchar("sabor_nome", { length: 100 }).notNull(),
});

export const pagamentosVendaTable = pgTable("pagamentos_venda", {
  id: serial("id").primaryKey(),
  vendaId: integer("venda_id").notNull().references(() => vendasTable.id, { onDelete: "cascade" }),
  forma: varchar("forma", { length: 30 }).notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
});

export const insertVendaSchema = createInsertSchema(vendasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVenda = z.infer<typeof insertVendaSchema>;
export type Venda = typeof vendasTable.$inferSelect;
