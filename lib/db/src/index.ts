import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Helper para encontrar e carregar o .env
const loadEnv = () => {
  if (process.env.DATABASE_URL) return;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Lista de possíveis locais para o .env
  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", "..", ".env"),
    path.resolve(__dirname, "..", "..", "..", ".env"), // Raiz a partir de lib/db/src
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        // Tenta usar a função nativa do Node
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        } else {
          // Fallback: parsing manual se loadEnvFile não estiver disponível ou falhar
          const content = fs.readFileSync(envPath, 'utf8');
          const matches = content.match(/^DATABASE_URL=(.+)$/m);
          if (matches && matches[1]) {
            process.env.DATABASE_URL = matches[1].trim();
          }
        }

        if (process.env.DATABASE_URL) return;
      } catch (e) {
        // Ignora erro
      }
    }
  }
};

loadEnv();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Verifique se o arquivo .env existe na raiz do projeto e contém a variável DATABASE_URL.",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
