# ApeGym (Web)

Frontend web do ApeGym (Vite + React + TypeScript), seguindo o conceito do app de treinos com **área do aluno** e **painel do administrador** (MVP: treinos, desafios/checklist, pontos e ranking).

## Requisitos

- Node.js + npm

## Rodando local

```bash
npm ci
npm run dev
```

Abra a URL mostrada no terminal.

## Backend (API)

O backend fica em `backend/` (Node + Express + TypeScript + SQLite + JWT).

```bash
cd backend
npm i
cp .env.example .env
npm run dev
```

Endpoints principais:
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /app/me` (Bearer token)
- `GET /app/workouts`
- `GET /app/challenges`
- `POST /app/challenges/:id/complete`
- `GET /app/leaderboard`
- `GET /admin/users` (admin)
- `POST /admin/workouts` (admin)
- `POST /admin/challenges` (admin)

Para o frontend usar o backend no login, defina `VITE_API_URL` (ex.: `http://localhost:4000`) num `.env` na raiz do front.

## Rotas

- **Auth**
  - `/` (tela de login)
- **Aluno (protegido)**
  - `/app` (Dashboard)
  - `/app/treinos`
  - `/app/progresso`
  - `/app/ranking`
- **Admin (protegido, role = admin)**
  - `/admin` (Visão geral)
  - `/admin/alunos`
  - `/admin/treinos`
  - `/admin/desafios`
  - `/admin/ranking`

## Autenticação (MVP / mock)

A autenticação atual é **mock** (sem backend), apenas para viabilizar o fluxo e as rotas protegidas:

- Qualquer **email + senha** não vazios “logam”.
- Se o email **contiver `admin`**, o usuário entra como **admin** e é redirecionado para `/admin`.
- Caso contrário, entra como **aluno** e vai para `/app`.

Implementação em `src/auth/AuthContext.tsx`.

## Deploy (GitHub Pages)

O app usa `HashRouter` para evitar problemas de refresh/deep link no GitHub Pages.

```bash
npm run build
npm run deploy
```

Configurações importantes:
- `package.json` contém `homepage`
- `vite.config.ts` contém `base: '/gymApeWebResponse/'`

## Estrutura de pastas (resumo)

- `src/auth/`: auth provider + rotas protegidas
- `src/layouts/`: layouts base (`AppLayout`, `AdminLayout`)
- `src/pages/app/`: páginas do aluno
- `src/pages/admin/`: páginas do admin
- `src/components/`: componentes reutilizáveis (botões, input, menu)
