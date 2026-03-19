import path from "path";
import fs from "fs";

// Load env vars
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  // @ts-ignore
  process.loadEnvFile?.(envPath);
}

const API_URL = `http://localhost:${process.env.PORT_API || 3001}/api`;

async function testSalesFlow() {
  console.log("🚀 Iniciando teste de fluxo de venda...");

  try {
    // 1. Buscar produto e estoque inicial
    console.log("📦 Passo 1: Verificando estoque inicial do produto ID 1...");
    const resProd = await fetch(`${API_URL}/produtos/1`);
    if (!resProd.ok) throw new Error(`Erro ao buscar produto: ${resProd.statusText}`);
    const produto = await resProd.json();
    const estoqueInicial = Number(produto.estoque);
    console.log(`   Estoque inicial: ${estoqueInicial}`);

    // 2. Realizar uma venda
    console.log("💰 Passo 2: Realizando uma venda de teste...");
    const vendaPayload = {
      itens: [
        {
          tipo: "produto",
          produtoId: 1,
          quantidade: 1,
          precoUnitario: Number(produto.preco)
        }
      ],
      pagamentos: [
        {
          forma: "dinheiro",
          valor: Number(produto.preco)
        }
      ],
      desconto: 0,
      acrescimo: 0
    };

    const resVenda = await fetch(`${API_URL}/vendas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendaPayload)
    });

    if (!resVenda.ok) {
      const errorText = await resVenda.text();
      throw new Error(`Erro ao realizar venda: ${resVenda.status} ${errorText}`);
    }
    const vendaRealizada = await resVenda.json();
    console.log(`   Venda realizada com sucesso! ID: ${vendaRealizada.id}`);

    // 3. Verificar estoque final
    console.log("📦 Passo 3: Verificando estoque final...");
    const resProdFinal = await fetch(`${API_URL}/produtos/1`);
    const produtoFinal = await resProdFinal.json();
    const estoqueFinal = Number(produtoFinal.estoque);
    console.log(`   Estoque final: ${estoqueFinal}`);

    // 4. Validar resultado
    if (estoqueFinal === estoqueInicial - 1) {
      console.log("✅ TESTE PASSOU: O estoque foi baixado corretamente!");
    } else {
      console.error(`❌ TESTE FALHOU: O estoque não foi baixado corretamente. Esperado: ${estoqueInicial - 1}, Recebido: ${estoqueFinal}`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error(`❌ ERRO DURANTE O TESTE: ${error.message}`);
    process.exit(1);
  }
}

testSalesFlow();
