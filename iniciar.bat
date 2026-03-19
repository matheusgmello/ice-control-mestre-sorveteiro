@echo off
chcp 65001 >nul
title IceControl v2.0

echo.
echo  ========================================
echo   IceControl v2.0 - Iniciando sistema...
echo  ========================================
echo.

:: Copia .env.example para .env se .env nao existir
if not exist ".env" (
    echo  [1/5] Criando arquivo .env a partir do modelo...
    copy ".env.example" ".env" >nul
    echo        .env criado com configuracoes padrao.
    echo        IMPORTANTE: Edite o arquivo .env se necessario.
    echo.
) else (
    echo  [1/5] Arquivo .env ja existe. Pulando criacao.
)

:: Verifica se o Docker esta rodando
echo  [2/5] Iniciando banco de dados (Docker)...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERRO: Docker nao esta rodando!
    echo  Abra o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

docker compose up -d >nul 2>&1
if errorlevel 1 (
    echo  ERRO ao iniciar o banco de dados.
    pause
    exit /b 1
)
echo        Banco de dados rodando.

:: Aguarda o PostgreSQL ficar disponivel
echo  [3/5] Aguardando PostgreSQL inicializar...
timeout /t 3 /nobreak >nul

:: Instala dependencias se necessario
if not exist "node_modules" (
    echo  [4/5] Instalando dependencias (primeira vez)...
    call pnpm install
) else (
    echo  [4/5] Dependencias ja instaladas.
)

:: Sincroniza o banco de dados
echo  [5/5] Sincronizando banco de dados...
call pnpm db:push
if errorlevel 1 (
    echo  AVISO: Erro ao sincronizar banco. Verifique a DATABASE_URL no .env
)

echo.
echo  ========================================
echo   Sistema pronto! Abrindo servidores...
echo  ========================================
echo.
echo  Frontend: http://localhost:3000
echo  API:      http://localhost:3001
echo.
echo  Pressione Ctrl+C em qualquer janela para parar.
echo.

:: Inicia API e Frontend em janelas separadas
start "IceControl - API" cmd /k "pnpm --filter @workspace/api-server run dev"
timeout /t 2 /nobreak >nul
start "IceControl - Frontend" cmd /k "pnpm --filter @workspace/icecontrol run dev"

echo  Servidores iniciados! Acesse: http://localhost:3000
echo.
pause
