# CRUD API (Fastify + TypeScript)

This repository contains a Product Catalog API implemented with Fastify and TypeScript.

Current status: **Phase 7 complete (single + multi mode, tests, scoring audit)**.

## Node.js version

- Required: **Node.js 24.10.0+**
- Recommended: npm 10+

## Installation

```bash
npm install
```

## Environment variables

1. Create a local `.env` file in the project root.
2. Copy required values from `.env.example`.

Required:

```env
PORT=4000
```

Optional:

```env
HOST=127.0.0.1
WORKERS=3
```

Notes:
- `.env` must stay local and is ignored by Git.
- `.env.example` is committed as the template.

## Available scripts

```bash
npm run start:dev
npm run build
npm run start:prod
npm run start:multi
npm test
```

- `start:dev` - runs app in development mode with watch.
- `build` - compiles TypeScript to `dist/`.
- `start:prod` - builds and starts compiled app.
- `start:multi` - starts cluster master + workers + load balancer.
- `test` - runs single-mode and multi-mode API tests.

## API endpoints

### Health check

- `GET /api/health` -> `200 OK`

### Products CRUD

- `GET /api/products` -> `200 OK`
- `GET /api/products/:productId` -> `200 | 400 | 404`
- `POST /api/products` -> `201 | 400`
- `PUT /api/products/:productId` -> `200 | 400 | 404`
- `DELETE /api/products/:productId` -> `204 | 400 | 404`

Validation and behavior:
- `productId` must be UUID (`400` on invalid ID)
- request body must contain required fields (`400`)
- `price` must be greater than 0 (`400`)
- `404` when product does not exist
- unknown routes return `404`
- unhandled server errors return `500`

## Multi mode behavior

When `npm run start:multi` is used:
- load balancer listens on base `PORT`
- workers listen on `PORT + 1`, `PORT + 2`, ...
- requests are distributed round-robin
- product state remains consistent between workers via IPC and master-owned store
- `x-worker-port` response header helps observe worker rotation

## Quick checks

```bash
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:4000/api/products
```

## Project stack

- [Fastify](https://fastify.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [dotenv](https://github.com/motdotla/dotenv)

## Assignment compliance

Implemented:
- TypeScript solution
- all CRUD routes
- global `404` and `500` handling
- `.env`-based configuration (`PORT` required)
- `start:dev`, `start:prod`, `start:multi`
- API tests (single + multi scenarios)
- horizontal scaling with load balancer and consistent state across workers
