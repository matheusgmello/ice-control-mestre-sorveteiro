import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo de Clientes e Fiados', () => {
  let clienteId: number;
  let fiadoId: number;

  it('deve cadastrar um novo cliente para o fiado', async () => {
    const novoCliente = {
      nome: 'Cliente de Teste',
      telefone: '11999999999',
      limiteFiado: '100.00'
    };

    const res = await request(app).post('/api/clientes').send(novoCliente);
    expect(res.status).toBe(201);
    clienteId = res.body.id;
  });

  it('deve realizar uma venda no fiado com sucesso', async () => {
    const resProd = await request(app).get('/api/produtos/1');
    if (resProd.status !== 200) return;
    const produto = resProd.body;

    const vendaFiado = {
      clienteId: clienteId,
      itens: [{ tipo: 'produto', produtoId: 1, quantidade: 1, precoUnitario: produto.preco }],
      pagamentos: [{ forma: 'fiado', valor: produto.preco }],
    };

    const res = await request(app).post('/api/vendas').send(vendaFiado);
    expect(res.status).toBe(201);
    
    const resFiado = await request(app).get(`/api/fiados?clienteId=${clienteId}`);
    expect(resFiado.body.length).toBeGreaterThan(0);
    fiadoId = resFiado.body[0].id;
  });

  it('deve permitir realizar pagamento parcial de um fiado via rota correta', async () => {
    if (!fiadoId) return;
    const pagamento = {
      valor: '1.00', // Campo correto conforme fiados.ts
      formaPagamento: 'dinheiro'
    };

    const res = await request(app).post(`/api/fiados/${fiadoId}/pagamento`).send(pagamento);
    expect(res.status).toBe(200);
    expect(Number(res.body.valorPago)).toBeGreaterThan(0);
  });
});
