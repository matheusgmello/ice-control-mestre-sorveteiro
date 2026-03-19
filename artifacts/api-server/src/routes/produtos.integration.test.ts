import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo de Produtos e Estoque', () => {
  let produtoId: number;

  it('deve criar um novo produto com sucesso', async () => {
    const novoProduto = {
      sku: `PIC-${Date.now()}`,
      nome: 'Picolé de Teste',
      categoria: 'Picolés',
      unidadeMedida: 'un',
      preco: 5.50,
      estoque: 10,
      ativo: true
    };

    const res = await request(app).post('/api/produtos').send(novoProduto);
    expect(res.status).toBe(201);
    produtoId = res.body.id;
  });

  it('deve permitir atualizar o preço do produto via PUT', async () => {
    const res = await request(app).put(`/api/produtos/${produtoId}`).send({
      preco: 6.00
    });
    expect(res.status).toBe(200);
    expect(Number(res.body.preco)).toBe(6.00);
  });

  it('deve registrar uma movimentação de estoque manual via rota correta', async () => {
    const movimentacao = {
      produtoId: produtoId,
      tipo: 'entrada',
      quantidade: 5,
      motivo: 'Ajuste de Teste'
    };

    const res = await request(app).post('/api/estoque/movimentacoes').send(movimentacao);
    expect(res.status).toBe(201);
  });
});
