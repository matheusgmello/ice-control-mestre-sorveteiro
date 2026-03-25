# IceControl 

Este guia descreve como instalar e executar o sistema, seja utilizando Docker (recomendado) ou instalando o banco de dados PostgreSQL manualmente.
---

## Pré-requisitos

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

1. Instale o **PostgreSQL 16** em: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
1. Instala o PostgreSQL na versao 16
2. Durante a instalação, anote a senha do usuário `postgres`.
3. Abra o **pgAdmin** e crie um novo banco de dados chamado `icecontrol`.
4. No arquivo `.env` (instruções abaixo), utilize esta URL, substituindo `SUA_SENHA`:
   `DATABASE_URL=postgresql://postgres:1234@localhost:5432/icecontrol`

Caso tu opte por instalar o Docker e tenha instalado PGAdmin pode dar conflito e nao rodar o projeto, ai tu tem trocar a porta do banco

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

### Manualmente

Abra dois terminais, um para rodar cada comando, ou seja para API e outro para WEB

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