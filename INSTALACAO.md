# IceControl v2.0 — Guia de Instalação Local (Windows)

Este guia descreve como instalar e executar o sistema IceControl no Windows de forma local.

---

## Pré-requisitos

Instale os programas abaixo **na ordem indicada**:

### 1. Node.js (versão 20 ou superior)
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador e aceite todas as opções padrão
4. Ao final, abra o **Prompt de Comando** e verifique:
   ```
   node --version
   ```
   Deve aparecer algo como `v20.x.x`

### 2. pnpm (gerenciador de pacotes)
No Prompt de Comando, execute:
```
npm install -g pnpm
```
Verifique:
```
pnpm --version
```

### 3. PostgreSQL (banco de dados)
1. Acesse: https://www.postgresql.org/download/windows/
2. Baixe o instalador para Windows
3. Execute e anote as informações durante a instalação:
   - **Usuário**: `postgres`
   - **Senha**: escolha uma senha (ex: `icecontrol123`) — **anote bem esta senha!**
   - **Porta**: `5432` (padrão, não altere)
4. Conclua a instalação com as opções padrão

---

## Configurar o Banco de Dados

1. Abra o **pgAdmin** (instalado junto com o PostgreSQL) ou o **SQL Shell (psql)**
2. Crie um banco de dados chamado `icecontrol`:

   **Via pgAdmin:**
   - Expanda `Servers → PostgreSQL → Databases`
   - Clique com botão direito em `Databases` → `Create → Database`
   - Nome: `icecontrol` → clique em `Save`

   **Via psql (linha de comando):**
   ```sql
   CREATE DATABASE icecontrol;
   ```

---

## Instalar o IceControl

### 1. Obter os arquivos do sistema
- Copie a pasta do sistema (fornecida pelo desenvolvedor) para um local fácil, ex: `C:\IceControl`

### 2. Criar o arquivo de configuração
Dentro da pasta `C:\IceControl`, crie um arquivo chamado `.env` com o seguinte conteúdo:

```env
# Banco de dados (ajuste a senha que você definiu no PostgreSQL)
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/icecontrol

# Segredo JWT (pode ser qualquer texto longo — não altere depois de criar o primeiro admin)
JWT_SECRET=icecontrol-segredo-local-2025

# Portas dos serviços
PORT_API=3001
PORT_WEB=3000
```

> **Importante:** substitua `SUA_SENHA_AQUI` pela senha que você definiu no PostgreSQL.

### 3. Instalar as dependências
Abra o **Prompt de Comando** dentro da pasta `C:\IceControl`:
```
cd C:\IceControl
pnpm install
```
Aguarde o download dos pacotes (pode levar alguns minutos na primeira vez).

### 4. Criar as tabelas no banco
```
pnpm --filter @workspace/db push
```
Isso cria automaticamente todas as tabelas necessárias no banco `icecontrol`.

---

## Iniciar o Sistema

### Opção A — Modo Desenvolvimento (recomendado para uso diário)

Abra **dois** Prompts de Comando separados:

**Terminal 1 — Servidor da API:**
```
cd C:\IceControl
pnpm --filter @workspace/api-server dev
```

**Terminal 2 — Interface Web:**
```
cd C:\IceControl
pnpm --filter @workspace/icecontrol dev
```

Após alguns segundos, o sistema estará disponível em:
```
http://localhost:3000
```
Abra este endereço no navegador (Chrome ou Edge recomendados).

### Opção B — Script de Inicialização Automática
Crie um arquivo `iniciar.bat` em `C:\IceControl` com o conteúdo:

```bat
@echo off
title IceControl - Servidor
echo Iniciando IceControl v2.0...
start "API Server" cmd /k "pnpm --filter @workspace/api-server dev"
timeout /t 3
start "Web" cmd /k "pnpm --filter @workspace/icecontrol dev"
timeout /t 4
start "" "http://localhost:3000"
echo Sistema iniciado! Acesse http://localhost:3000
```

Basta dar dois cliques em `iniciar.bat` para subir tudo automaticamente.

---

## Primeiro Acesso

1. Acesse `http://localhost:3000` no navegador
2. Você verá a tela de **login**
3. O primeiro administrador precisa ser cadastrado. Há duas formas:

   **Via sistema (se já houver um admin cadastrado):**
   - Faça login → Configurações → Administradores → Novo Admin

   **Via linha de comando (para criar o primeiro admin):**
   ```
   curl -X POST http://localhost:3001/api/auth/register ^
     -H "Content-Type: application/json" ^
     -d "{\"nome\":\"Admin\",\"email\":\"admin@sorveteria.com\",\"senha\":\"senha123\"}"
   ```
   > Ou use o Postman / Insomnia para fazer esta requisição POST.

---

## Backup e Restauração

O próprio sistema possui botões de **Exportar Banco** e **Importar Banco** em:

**Configurações → Backup e Restauração**

- **Exportar**: salva todos os dados em um arquivo `.json` no seu computador
- **Importar**: restaura os dados a partir de um arquivo `.json` exportado anteriormente

> **Recomendação:** faça backup ao menos uma vez por semana, salvando o arquivo em um pendrive ou nuvem (Google Drive, OneDrive).

---

## Encerrar o Sistema

Feche as duas janelas de terminal (API Server e Web) ou pressione `Ctrl+C` em cada uma.

---

## Problemas Comuns

| Problema | Solução |
|----------|---------|
| "Erro ao conectar ao banco" | Verifique se o PostgreSQL está rodando: `Serviços do Windows → postgresql-x64-xx → Iniciar` |
| "Porta 3000 em uso" | Feche outros programas que usam a porta 3000 ou altere a porta no `.env` |
| "pnpm não reconhecido" | Feche e reabra o Prompt de Comando após instalar o pnpm |
| Tela em branco no navegador | Aguarde 10 segundos e recarregue a página (F5) |

---

## Requisitos Mínimos de Hardware

| Item | Mínimo |
|------|--------|
| Sistema Operacional | Windows 10 ou superior |
| Processador | Intel Core i3 / AMD Ryzen 3 (2 núcleos) |
| Memória RAM | 4 GB |
| Espaço em disco | 2 GB livres |
| Navegador | Chrome 90+, Edge 90+, Firefox 90+ |

---

*IceControl v2.0 — Sistema de Gestão para Sorveteria*
