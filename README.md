# CRUD API (Fastify + TypeScript)

This repository contains a Product Catalog API implemented with Fastify and TypeScript.

Current status: **Phase 1 (project bootstrap) is implemented**.

## Node.js version

- Required: **Node.js 24.10.0+**
- Recommended: npm 10+

## Installation

```bash
npm install
```

## Environment variables

1. Create a local `.env` file in the project root.
2. Copy values from `.env.example`.

Example:

```env
PORT=4000
HOST=127.0.0.1
```

Notes:
- `.env` must stay local and is ignored by Git.
- `.env.example` is committed as the template.

## Available scripts

```bash
npm run start:dev
npm run build
npm run start:prod
```

- `start:dev` — runs the app in development mode with watch.
- `build` — compiles TypeScript to `dist/`.
- `start:prod` — builds and starts the compiled app.

## Current API (Phase 1)

### Health check

- `GET /api/health`
- Response: `200 OK`

Example request:

```bash
curl http://127.0.0.1:4000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "crud_app"
}
```

### Global error handlers already enabled

- Unknown routes -> `404 Not Found`
- Unhandled server errors -> `500 Internal Server Error`

## Planned API endpoints (next phase)

- `GET /api/products`
- `GET /api/products/:productId`
- `POST /api/products`
- `PUT /api/products/:productId`
- `DELETE /api/products/:productId`

## Project stack

- [Fastify](https://fastify.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [dotenv](https://github.com/motdotla/dotenv)

## Assignment compliance (current phase)

Implemented now:
- TypeScript project bootstrap
- `.env`-based configuration
- `start:dev` and `start:prod` scripts
- Base Fastify app and health route

Not implemented yet:
- Full Product CRUD routes
- API tests
- `start:multi` horizontal scaling mode
