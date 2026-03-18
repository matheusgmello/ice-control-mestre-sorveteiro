# IceControl v2.0

## Overview

Full-stack ice cream shop management system (sorveteria) built from scratch. Brazilian Portuguese UI with "Chocolate e Creme" color palette.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/icecontrol) at `/`
- **API framework**: Express 5 (artifacts/api-server) at `/api`
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date**: date-fns (pt-BR)
- **Animations**: Framer Motion

## Color Palette — Chocolate e Creme

- Marrom Escuro (Primária): `#5a3a1b` — header, buttons, sidebar
- Bege Claro (Fundo): `#f2e6d8` — background
- Marrom Café (Textos): `#3a2414` — text
- Creme Suave (Cards): `#fcf7f2` — card backgrounds
- Marrom Médio (Secundária): `#8a5a2b` — secondary buttons, focus

## Modules

1. **Dashboard** — Sales KPIs, monthly goal progress, daily chart, low-stock alerts
2. **Caixa (PDV)** — Fast POS with product search, ice cream builder wizard, cart, multiple payment methods
3. **Produtos & Sabores** — Product catalog management with inline editing, flavor management
4. **Estoque** — Stock movements (entrada/saída) for products and ice cream scoops (bolas)
5. **Fiados** — Customer credit accounts, payment history, partial payments
6. **Relatórios** — Sales reports, best sellers (products & flavors), payment breakdown
7. **Configurações** — Monthly goal setting

## Database Schema

- `produtos` — products (beverages, popsicles, supplies)
- `sabores_sorvete` — ice cream flavors (tracked in bolas/scoops)
- `tipos_sorvete` — ice cream base types (casquinha, copo 300ml, milk-shake 500ml, etc.)
- `adicionais` — toppings/sauces (cobertura) and extras (adicional)
- `clientes` — customers
- `vendas` — sales transactions
- `itens_venda` — sale line items (produto or sorvete)
- `itens_sorvete_sabores` — flavor details per sorvete item (normalized for rankings)
- `pagamentos_venda` — payment lines per sale (supports multiple payment methods)
- `fiados` — credit accounts
- `fiado_itens` — items per credit account
- `pagamentos_fiado` — payments against credit accounts
- `movimentacoes_estoque` — stock movement history
- `metas` — monthly sales goals

## Business Rules

- Ice cream sales deduct flavor balls (bolas) from stock atomically
- Sale failures roll back all stock changes (transactions)
- Cancelled sales restore all inventory
- Low-stock alert threshold: <20 bolas for flavors, ≤ estoqueMinimo for products
- Multiple payment methods per sale supported
- Fiado (credit) automatically creates a fiados record linked to the customer

## Structure

```text
artifacts/
  icecontrol/         # React+Vite frontend (previewPath: /)
  api-server/         # Express API server (previewPath: /api)
lib/
  api-spec/           # OpenAPI spec + Orval codegen config
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
  db/                 # Drizzle ORM schema + DB connection
    src/schema/
      produtos.ts
      sabores.ts
      tipos-sorvete.ts
      adicionais.ts
      clientes.ts
      vendas.ts
      fiados.ts
      estoque.ts
      metas.ts
```
