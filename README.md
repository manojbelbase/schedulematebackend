# ScheduledMate Backend

Express 5 + TypeORM API for ScheduledMate. It feeds `scheduledmatefrontend` via OpenAPI codegen: every route in `src/config/swagger.ts` becomes a typed React Query client in the frontend automatically.

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- Docker (for local Postgres)

## Getting started

```sh
pnpm install
pnpm docker:up      # start Postgres on :5434
pnpm db:migrate     # run migrations
pnpm dev            # API on :8000
```

## Docs / Frontend codegen

- Swagger UI: http://localhost:8000/api-docs
- Raw OpenAPI JSON: http://localhost:8000/docs-json
- The frontend regenerates its typed clients with:

```sh
cd ../scheduledmatefrontend
pnpm generate-types
```

`DOCS_AUTH_TOKEN` must match between backend `.env` and frontend `.env` (leave empty on both for open dev access).

## Scripts

See `AGENTS.md` for the full convention guide and folder structure.