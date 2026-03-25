import { db } from "../../../lib/db/src/index";
import { usuariosTable } from "../../../lib/db/src/schema/index";

async function main() {
  console.log("⚠️ ATENÇÃO: Excluindo TODOS os usuários do sistema...");

  try {
    // 1. Deleta todos os usuários da tabela
    const result = await db.delete(usuariosTable);

    console.log("✅ Todos os usuários foram removidos com sucesso.");
    console.log("⚠️ Aviso: Você não conseguirá entrar no sistema até criar um novo usuário!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao excluir usuários:", error);
    process.exit(1);
  }
}

main();
