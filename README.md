# Projeto RH CIAPI - Sistema de Gestão de Frequências

Este projeto consiste em um frontend React (Vite) e um backend Node.js (Express) para gestão de servidores e geração de relatórios de frequência em DOCX.

## Estrutura do Projeto

- `/src`: Frontend React com Vite e Tailwind CSS.
- `/backend`: Servidor Express para geração de documentos DOCX e ZIP.
- `/backend/templates`: Onde deve ficar o arquivo `modelo_frequencia.docx`.
- `/backend/exports`: Pasta temporária para arquivos gerados.

## Pré-requisitos

- **Node.js LTS** instalado (v18 ou superior recomendado).
- **Supabase**: Uma conta configurada com as tabelas `servidores`, `frequencia` e `eventos`.

## Como Rodar Localmente (Windows)

### 1. Preparar o Backend

1. Abra o terminal (PowerShell ou CMD) na pasta raiz do projeto.
2. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     copy .env.example .env
     ```
   - Abra o arquivo `.env` e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_KEY` com suas chaves do Supabase.
5. Inicie o servidor:
   ```bash
   npm start
   ```
   O backend estará rodando em `http://localhost:5000`.

### 2. Preparar o Frontend

1. Abra um **novo terminal** na pasta raiz do projeto.
2. Instale as dependências do frontend:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     copy .env.example .env
     ```
   - Preencha as variáveis do Supabase e a `VITE_API_BACKEND_URL` (geralmente `http://localhost:5000`).
4. Inicie o frontend:
   ```bash
   npm run dev
   ```
   O frontend estará rodando em `http://localhost:3000` (ou a porta indicada no terminal).

## Geração de Documentos

Para que a geração de DOCX funcione, você deve colocar o seu arquivo `modelo_frequencia.docx` na pasta `backend/templates/`. O arquivo deve conter os placeholders como `{{NOME}}`, `{{MATRICULA}}`, etc.

## Deploy em Produção

- **Frontend**: Pode ser hospedado no Vercel, Netlify ou Render (Static Site).
- **Backend**: Recomendado usar Render.com ou Railway.
- **CORS**: O backend no Render precisa permitir as seguintes origens no campo `CORS_ORIGINS`:
  - `https://aistudio.google.com` (para o Preview do AI Studio funcionar)
  - `https://www.rhciapi.com.br` (seu domínio de produção)
  - `http://localhost:3000` (desenvolvimento local)
- Lembre-se de configurar as variáveis de ambiente em produção e apontar o domínio `api.rhciapi.com.br` para o seu backend.
