import { pgTable, serial, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const usuariosTable = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  senhaHash: varchar("senha_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
