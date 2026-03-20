import { defineConfig } from "drizzle-kit";
import path from "path";

// Carrega o .env da raiz do projeto (dois níveis acima do lib/db)
try {
  // @ts-ignore
  process.loadEnvFile?.(path.resolve(process.cwd(), "../../.env"));
} catch (e) {
  // Ignora se o arquivo não existir ou o Node não suportar loadEnvFile
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned. Verifique o arquivo .env na raiz do projeto.");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
