import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper robusto para encontrar e carregar o .env em qualquer ambiente
const loadEnv = () => {
  if (process.env.DATABASE_URL) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
    path.resolve(__dirname, "..", "..", "..", ".env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(envPath);
        }

        // Fallback manual: leitura direta do arquivo se loadEnvFile não injetar a variável
        if (!process.env.DATABASE_URL) {
          const content = fs.readFileSync(envPath, "utf8");
          const matches = content.match(/^DATABASE_URL=(.+)$/m);
          if (matches && matches[1]) {
            process.env.DATABASE_URL = matches[1].trim().replace(/['"]/g, "");
          }
        }

        if (process.env.DATABASE_URL) return;
      } catch (e) {}
    }
  }
};

loadEnv();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não configurada. No Replit, conecte o banco PostgreSQL nas Secrets. Localmente, configure o arquivo .env na raiz do projeto."
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
