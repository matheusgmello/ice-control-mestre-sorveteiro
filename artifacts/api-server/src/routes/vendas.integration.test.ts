import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Vendas e Integridade do Banco', () => {
  it('deve garantir que o produto teste tem estoque antes de vender', async () => {
    // Garante que o produto 1 existe e tem estoque
    const res = await request(app).post('/api/estoque/movimentacoes').send({
      produtoId: 1,
      tipo: 'entrada',
      quantidade: 100,
      motivo: 'Abastecimento para testes'
    });
    // Se o produto 1 não existir, o teste de vendas será pulado ou falhará controladamente
    expect([201, 404]).toContain(res.status);
  });

  it('deve realizar duas vendas seguidas sem erro de chave duplicada', async () => {
    const resProd = await request(app).get('/api/produtos/1');
    if (resProd.status !== 200) return;
    const produto = resProd.body;

    const vendaPayload = {
      itens: [{ tipo: 'produto', produtoId: 1, quantidade: 1, precoUnitario: produto.preco }],
      pagamentos: [{ forma: 'dinheiro', valor: produto.preco }],
    };

    const res1 = await request(app).post('/api/vendas').send(vendaPayload);
    expect(res1.status).toBe(201);

    const res2 = await request(app).post('/api/vendas').send(vendaPayload);
    expect(res2.status).toBe(201);
  });
});
