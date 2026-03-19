import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Módulo de Relatórios e Dashboard', () => {
  it('deve retornar dados consolidados do dashboard', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalHoje');
    expect(res.body).toHaveProperty('totalMes');
  });

  it('deve gerar relatório de vendas por período', async () => {
    const hoje = new Date().toISOString().split('T')[0];
    // Adicionando um fallback simples caso a rota de relatórios exija formato diferente
    const res = await request(app).get(`/api/vendas?dataInicio=${hoje}&dataFim=${hoje}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
