import { pgTable, serial, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metasTable = pgTable("metas", {
  id: serial("id").primaryKey(),
  mes: varchar("mes", { length: 7 }).notNull().unique(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull().default("0"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMetaSchema = createInsertSchema(metasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMeta = z.infer<typeof insertMetaSchema>;
export type Meta = typeof metasTable.$inferSelect;
