# AGENTS.md — ScheduledMate API Project Conventions

This file describes the architecture, folder structure, and coding conventions of this Express + TypeORM API. Follow these patterns when adding or modifying code.

The single most important contract in this repo: **the OpenAPI spec served at `GET /docs-json` is the source of truth for the frontend.** The `scheduledmatefrontend` monorepo runs `openapi-codegen` against this endpoint to auto-generate typed API clients (`packages/services/src/{web,backoffice,website}`). When you add/change a route, you MUST update `src/config/swagger.ts` so the frontend can regenerate types with `pnpm generate-types`.

## Tech Stack

- Node.js 22 + TypeScript (ES modules, `"type": "module"`)
- Express 5
- TypeORM + pg (PostgreSQL)
- jsonwebtoken (JWT auth)
- zod (request body validation)
- pino (logging, with pino-pretty in dev)
- swagger-ui-express (OpenAPI docs)
- tsx (dev runner / watcher) — runs `.ts` directly, and runs compiled `dist/**/*.js`

## Scripts (package.json)

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "type-check": "tsc --noEmit",
  "start": "tsx dist/server.js",
  "docker:up": "docker compose up -d",
  "docker:down": "docker compose down",
  "db:migrate": "tsx src/config/run-migration.ts",
  "db:revert": "tsx src/config/revert-migration.ts"
}
```

- Dev: `pnpm dev` (hot-reload via tsx watch)
- Production-style: `pnpm build` then `pnpm start`
- Type checking: `pnpm type-check` (note: it is `type-check`, not `typecheck`)

## Folder Structure

Mirrors the capstone reference project at `P:\web\capstone`.

```
src/
  server.ts             # bootstrap: init DB, createApp, listen, graceful shutdown
  app.ts                # express app: middleware + mount routers + /docs-json + /api-docs
  config/
    env.ts              # camelCase env object (checkRequiredEnvVariable), refreshCookieName
    data-source.ts      # TypeORM DataSource (explicit entities + migrations glob)
    swagger.ts          # OpenAPI JsonObject (drive the frontend codegen!) — swaggerConfig
    run-migration.ts    # db:migrate
    revert-migration.ts # db:revert
  constants/httpStatus.ts              # status code constants (no magic numbers)
  common/
    entities/base.entity.ts            # abstract BaseEntity (id, createdAt, updatedAt)
    middleware/auth.ts                 # authenticate() only (no role/permission checks)
    middleware/docsAuth.ts             # Basic auth guard for /api-docs + /docs-json
    middleware/asyncHandler.ts         # wrap async route handlers
    middleware/errorHandler.ts         # global error handler
    middleware/notFound.ts
    middleware/validateBody.ts         # zod validation middleware
    errors/AppError.ts                 # custom error class
    utils/jwt.ts                       # sign/verify access + refresh tokens (single JWT_SECRET)
    utils/refreshCookie.ts             # HttpOnly refresh cookie helpers
    utils/password.ts                  # scrypt hash/verify
    utils/pagination.ts                # parseListQuery + buildPagination
  lib/
    logger.ts                          # pino (pino-pretty in dev)
    response.ts                        # sendSuccess (shapes ApiResponse)
  modules/
    users/                             # user.entity.ts + user.repository.ts (data access)
    auth/                              # auth.service/controller/routes + dto/*.dto.ts
    health/                            # health.routes.ts
    docs/                              # docs.routes.ts (swagger UI)
  database/migrations/*.ts             # one migration per schema change
  types/express.d.ts                   # augments Express.Request (user?)
```

Scope is intentionally small: only `health` + `auth` (+ `docs`). No roles, banners, members or permission/RBAC code.

## OpenAPI / Frontend Codegen — CRITICAL

- The frontend fetches `${API_BASE_URL}/docs-json` with `Authorization: Basic ${DOCS_AUTH_TOKEN}` (see `scheduledmatefrontend/openapi-codegen.config.ts`). Three apps (web, backoffice, website) point at this backend, so `pnpm generate-types` regenerates each app's typed client from this one spec.
- `app.ts` mounts:
  - `GET /docs-json` — raw OpenAPI JSON (behind `docsAuth`)
  - `GET /api-docs` — swagger UI (behind `docsAuth`)
- `docsAuth` (src/common/middleware/docsAuth.ts) compares `Authorization: Basic <token>` to `env.DOCS_AUTH_TOKEN`. If `DOCS_AUTH_TOKEN` is empty, docs are open (dev default). Set it and keep it in sync with the frontend `.env` for protected docs.
- Every route you add MUST be reflected in `src/config/swagger.ts` (path + responses + schemas). Otherwise the frontend cannot generate types for it. `components/schemas` becomes the frontend's TypeScript types, and `paths` become its React Query hooks.
- Keep the spec valid OpenAPI 3.0. `@openapi-codegen/typescript` parses `#/components/schemas` (types) and `#/paths` (queries). Reference schemas from responses, don't inline everything.
- Swagger paths must match the real mounted backend routes (`/api/health`, `/api/auth/*`) — the frontend fetcher calls `baseUrl + path`, not the swagger `servers` entry.

## Module Pattern (per feature, e.g. auth)

Each module has: entity → repository → service → controller → routes → DTOs.

Routes mount under a base path in app.ts (e.g. `/api/auth`).
Naming: `findX`, `getX`, `listX`, `createX/addX`, `updateX/editX`, `deleteX/removeX`.

The `auth` module is the reference implementation — copy its layout when adding a new resource.

## List Queries / Pagination (shared utility)

List endpoints take a consistent set of query params parsed by `parseListQuery(query)` in `src/common/utils/pagination.ts`. Reuse it instead of hand-rolling query parsing.

Supported params (all optional unless noted): `page` (0-indexed, default 0), `take` (default 10, max 100), `query` (free-text search, case-insensitive), `dateFrom`/`dateTo` (createdAt range), `sortBy`/`sortOrder` (default createdAt/desc).

Paginated response shape (pagination is a top-level sibling of data):

```json
{
  "success": true,
  "message": "Banners fetched successfully",
  "data": [ { ...items... } ],
  "pagination": {
    "previousPage": null,
    "nextPage": 1,
    "total": 2140,
    "count": 100
  }
}
```

Wire-up pattern:

- Controller: `parseListQuery(req.query)` → pass to `listX(query)` → `sendSuccess(res, httpStatus.OK, "...", result.items, result.pagination)`.
- Service: `const { items, total } = await findAllX(query); return { items, pagination: buildPagination(total, query.page, query.take, items.length) };`
- Repository: filter on `query.query` via `ILike`, date range via `Between(query.dateFrom ?? new Date(0), query.dateTo ?? new Date())`, paginate with `skip: query.page * query.take` and `take: query.take`.
- `paginationQueryParams` (in `src/config/swagger.ts`) documents these params for every list operation.

## Authentication / Tokens

- Access token: `Authorization: Bearer <token>` header, short-lived (`JWT_ACCESS_EXPIRES_IN`, default 15m).
- Refresh token: HttpOnly cookie (`JWT_REFRESH_EXPIRES_IN`, default 7d), `SameSite=Strict`, path `/api/auth`.
- Token payload: `{ sub: user.id, email: user.email, role: "", jti, tokenType: "access" | "refresh" }`. (No roles in this project — `role` is always an empty string.)
- Endpoints: `/api/auth/register`, `/login`, `/refresh`, `/logout`, `/me`.
- `authenticate()` (src/common/middleware/auth.ts) requires a Bearer access token, sets `req.user`, and rejects a refresh token used as access and vice-versa.

## Security Rules

- Never serialize a TypeORM entity directly into a response. The `User` entity has a `toJSON()` that strips password and googleId (safety net), but always prefer an explicit public shape (`toPublicUser`).
- Passwords hashed (scrypt) in `users.password`.

## Migrations — CRITICAL (data preservation)

- Never edit an already-applied migration. Always create a new timestamped file.
- Prefer additive/renaming migrations: `ALTER TABLE ... ADD COLUMN`, `RENAME COLUMN`. Never drop columns/tables with data.
- File name: `<epochmillis>-<Name>.ts`; class `Name<epochs>`. Timestamp must be newer than existing ones.
- On prod: `pg_dump` backup first, run via `pnpm db:migrate`, verify with `\d <table>`.

## TypeScript / tsconfig notes

- `exactOptionalPropertyTypes: true` → when an option `x?: T` must not be passed `undefined`; build options objects conditionally instead of `x: undefined`.
- `verbatimModuleSyntax: true` → use `import type { X }` for type-only imports; relative imports are extensionless (fine with tsx, do NOT rewrite to `.js`).
- `strict: true`, `noUncheckedIndexedAccess: true`.
- Entities use definite assignment (`id!: string`); no `strictPropertyInitialization: false`.
- Routers must be annotated `export const xRouter: Router = Router();` (fixes TS2742 inferred-type errors).
- Build emits to `dist/` (outDir) — do not commit generated files; `dist/` is gitignored.

## Response / Error handling

- Success: `sendSuccess(res, status, message, data, pagination?)` → `{ success: true, message, data?, pagination? }`.
- Errors: `throw new AppError(message, httpStatus.X)`; wrapped by `asyncHandler` and handled in `errorHandler`.
- Use `httpStatus` constants, not raw numbers.
- `validateBody(zodSchema)` returns 400 "Invalid request body" on validation failure.

## Database

- Postgres via Docker: container `schedulemate-postgres`, db `schedulemate`, host-port 5434.
- `DATABASE_URL="postgresql://postgres:postgres@localhost:5434/schedulemate"`.
- Inspect data: `docker compose exec -T postgres psql -U postgres -d schedulemate -c "<sql>"`.
- Migrate: `pnpm db:migrate`. If a DB column doesn't match the entity, add a new migration to align (never drop user data on prod).

## Boot flow

`initializeDatabase()` (connect + run pending migrations) → `createApp()` (middleware + routes + swagger + `/docs-json`) → `app.listen(env.port)`. If Postgres is down, the server exits rather than serving with a dead DB.
