# Barbearia Prime

Sistema MERN para agendamento online e painel administrativo da Barbearia Prime.

## Stack

- Frontend: React, TypeScript, Vite e Tailwind CSS
- Backend: Node.js, Express.js e Mongoose
- Banco de dados: MongoDB

## Estrutura

```text
barbearia-prime/
├── src/
│   ├── api/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── .env.example
│   │   └── package.json
│   ├── frontend/
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── styles/
│   │   │   └── types/
│   │   ├── .env.example
│   │   └── package.json
│   ├── package.json
│   └── vercel.json
├── DEPLOY.md
└── README.md
```

## Configuração

Requer Node.js 24 LTS.

Entre no diretório da aplicação:

```bash
cd src
```

Instale as dependências:

```bash
npm run install:all
```

Já dentro de `src`, configure o backend criando `backend/.env` a partir de
`backend/.env.example`:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/barbearia-prime
MONGO_DB=barbearia-prime
FRONTEND_URL=http://localhost:3000
ADMIN_PASSWORD=teste123
JWT_SECRET=troque-este-segredo-em-producao
```

O frontend usa `/api` por padrão. Em desenvolvimento, o Vite encaminha `/api` para `http://localhost:3001`.

## Execução

Rodar backend e frontend:

```bash
npm run dev
```

Ou em terminais separados:

```bash
npm run dev:backend
npm run dev:frontend
```

URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/api`
- Proxy local: `http://localhost:3000/api`
- Health check: `http://localhost:3001/api/health`

## Rotas principais

- `POST /api/auth/login`
- `GET /api/services`
- `GET /api/barbers`
- `GET /api/clients`
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`
- `GET /api/appointments/public`
- `GET /api/appointments/available-slots?date=YYYY-MM-DD`

As rotas administrativas usam o token Bearer retornado por `/api/auth/login`. Isso inclui as rotas
de escrita e também `GET /api/clients` e `GET /api/appointments`.

O contrato completo da API está documentado em
[`src/backend/openapi.yaml`](src/backend/openapi.yaml).

## Build

```bash
npm run build
```

O build do frontend é gerado em `frontend/dist` — ou `src/frontend/dist`, considerando a raiz do
repositório.

## Deploy

O deploy de produção usa Vercel para o frontend e para a API Express, com MongoDB Atlas como banco.

Consulte [DEPLOY.md](DEPLOY.md). Na Vercel, configure `src` como **Root Directory**.
