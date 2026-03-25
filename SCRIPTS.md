## Testes de Integridade
Para garantir que o sistema está funcionando perfeitamente em sua máquina, você pode rodar a bateria de testes automáticos:
```cmd
pnpm --filter @workspace/api-server run test
```
## Teste End to end
  Diferente dos testes unitários/integração do Vitest que rodam em isolamento, este script realiza um fluxo completo:
   1. Conecta-se à API real (que deve estar rodando em localhost:3001).
   2. Consulta o estoque de um produto.
   3. Realiza uma venda via POST.
   4. Valida se o estoque foi baixado corretamente no banco de dados.

   ``` shell
   pnpm tsx scripts/test-sales-api.ts
   ```

  (Nota: Certifique-se de que o servidor da API esteja rodando antes de executar este comando).


## Scripts do banco

 Para executar os scripts, use o terminal na raiz do projeto:

   - Resetar Estoque (Zerar quantidades):
    pnpm --filter @workspace/scripts maintenance:reset-estoque

   - Excluir Todos os Usuários:
    pnpm --filter @workspace/scripts maintenance:reset-usuarios