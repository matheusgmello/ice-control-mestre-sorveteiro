# IceControl v2.0 — Guia de Instalação (Windows)

Este guia descreve como instalar e executar o sistema IceControl no Windows, seja utilizando Docker (recomendado) ou instalando o banco de dados PostgreSQL manualmente.

---

## Pré-requisitos Comuns

Instale os programas abaixo antes de qualquer configuração:

### 1. Node.js (versão 20 ou superior)
- [Download do Node.js](https://nodejs.org/) (baixe a versão **LTS**)

### 2. pnpm (Gerenciador de Pacotes)
Abra o terminal e instale globalmente:
```cmd
npm install -g pnpm
```

---

## Escolha Sua Forma de Instalação do Banco de Dados

### Opção A: Docker (Recomendado)
*Mais rápido e automatizado.*

1. Instale o **Docker Desktop** em: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Inicie o Docker Desktop.
3. No arquivo `.env` (instruções abaixo), utilize a URL de banco padrão:
   `DATABASE_URL=postgresql://icecontrol:icecontrol123@localhost:5432/icecontrol`

---

### Opção B: PostgreSQL Local (pgAdmin)
*Se você prefere gerenciar o banco manualmente.*

1. Instale o **PostgreSQL** em: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Durante a instalação, anote a senha do usuário `postgres`.
3. Abra o **pgAdmin** e crie um novo banco de dados chamado `icecontrol`.
4. No arquivo `.env` (instruções abaixo), utilize esta URL, substituindo `SUA_SENHA`:
   `DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/icecontrol`

---

## Configuração do Sistema

### 1. Preparar o Arquivo .env
- Na pasta raiz do projeto, copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
- Ajuste a variável `DATABASE_URL` conforme a opção escolhida acima (A ou B).

### 2. Instalar Dependências
No terminal, na pasta raiz:
```cmd
pnpm install
```

### 3. Sincronizar o Banco de Dados
Este comando criará todas as tabelas e estruturas necessárias:
```cmd
pnpm db:push
```

---

## Como Iniciar o Sistema

### Automatizado (Recomendado)
Execute o arquivo **`iniciar.bat`**. 
- Se usar Docker, o script tentará subir o banco automaticamente.
- Se usar PostgreSQL Local, certifique-se de que o serviço do Postgres esteja ativo no Windows.

### Manualmente
Se desejar rodar os serviços em terminais separados:

**API:**
```cmd
pnpm --filter @workspace/api-server dev
```

**Interface Web:**
```cmd
pnpm --filter @workspace/icecontrol dev
```

---

## Primeiro Acesso
- O sistema estará disponível em: `http://localhost:3000`
- No primeiro acesso, cadastre o seu usuário administrador.

---

## Testes de Integridade
Para garantir que o sistema está funcionando perfeitamente em sua máquina, você pode rodar a bateria de testes automáticos:
```cmd
pnpm --filter @workspace/api-server run test
```

---

*IceControl v2.0 — Sistema de Gestão para Sorveteria*
