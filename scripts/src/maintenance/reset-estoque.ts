import { db } from "../../../lib/db/src/index";
import { produtosTable } from "../../../lib/db/src/schema/index";

async function main() {
  console.log("🔄 Resetando quantidades do estoque para zero...");

  try {
    // 1. Zera o estoque na tabela de produtos
    const result = await db.update(produtosTable)
      .set({ estoque: 0 });

    console.log("✅ Quantidades de estoque resetadas para 0 com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao resetar o estoque:", error);
    process.exit(1);
  }
}

main();
