import { defineConfig } from "drizzle-kit";
import path from "path";

// Carrega o .env da raiz do projeto (compatível com local e Replit)
try {
  // @ts-ignore
  process.loadEnvFile?.(path.resolve(process.cwd(), "../../.env"));
} catch (e) {}
// Fallback: tenta o diretório atual (quando chamado da raiz)
try {
  // @ts-ignore
  process.loadEnvFile?.();
} catch (e) {}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não encontrada. No Replit, conecte o banco de dados PostgreSQL nas Secrets. Localmente, configure o arquivo .env na raiz do projeto."
  );
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
