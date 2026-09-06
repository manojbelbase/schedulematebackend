# ScheduleGPT Backend

The ScheduleGPT backend is an Express 5 and TypeORM API for authentication, calendar integrations, AI chat, access requests, and backoffice administration. It uses PostgreSQL for persistence and exposes an OpenAPI 3 specification consumed by the ScheduleGPT frontend.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [API and authentication](#api-and-authentication)
- [OpenAPI and frontend code generation](#openapi-and-frontend-code-generation)
- [Database and migrations](#database-and-migrations)
- [Available scripts](#available-scripts)
- [Production notes](#production-notes)

## Features

- Email/password authentication with access and refresh tokens
- Google OAuth sign-in and calendar account connections
- AI chat conversations and memory management
- Access-request workflows for Google Calendar permissions
- Backoffice authentication and LLM configuration management
- Request validation with Zod and consistent JSON responses
- Security middleware with Helmet, CORS, HTTP-only cookies, and rate limiting
- Structured logging with Pino
- Swagger UI and an OpenAPI JSON endpoint

## Architecture

The application starts in `src/server.ts`, connects to PostgreSQL, runs pending TypeORM migrations, and then creates the Express application from `src/app.ts`.

Feature code is organized by module:

```text
src/
  app.ts                         Express middleware and route mounting
  server.ts                      Database initialization and HTTP server bootstrap
  config/                        Environment, database, OpenAPI, OAuth, and LLM setup
  common/                        Shared middleware, errors, entities, and utilities
  modules/
	 auth/                        User authentication and password reset
	 calendarConnection/          Google Calendar connections
	 chat/                        AI conversations and memories
	 accessRequest/               Calendar access requests
	 backoffice/                  Backoffice authentication and administration
	 health/                      Health check endpoint
  database/migrations/           Database schema migrations
```

The OpenAPI document in `src/config/swagger.ts` is the API contract. Any route or response change must be reflected there so frontend clients remain in sync.

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer
- Docker and Docker Compose for the local PostgreSQL database

## Local setup

1. Install dependencies:

	```sh
	pnpm install
	```

2. Create a `.env` file in the project root. At minimum, configure:

	```dotenv
	DATABASE_URL=postgresql://postgres:postgres@localhost:5434/schedulegpt
	JWT_SECRET=replace-with-a-long-random-secret
	```

3. Start PostgreSQL:

	```sh
	pnpm docker:up
	```

4. Run database migrations:

	```sh
	pnpm db:migrate
	```

5. Start the development server:

	```sh
	pnpm dev
	```

The API is available at `http://localhost:8000`. The server connects to the database and runs pending migrations during startup, so migrations can also be run explicitly before starting the server for clearer deployment logs.

To stop the local database:

```sh
pnpm docker:down
```

## Environment variables

### Required

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_SECRET` | Secret used to sign access and refresh JWTs. Use a strong, unique value. |

### Server and security

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8000` | HTTP server port. |
| `NODE_ENV` | `development` | Set to `production` for production cookie behavior. |
| `LOG_LEVEL` | `info` | Pino log level. |
| `CORS_ORIGINS` | empty | Comma-separated list of allowed frontend origins. |
| `FRONTEND_URL` | first CORS origin | Frontend URL used by redirect flows. |
| `DOCS_AUTH_TOKEN` | empty | Protects `/api-docs` and `/docs-json`. Leave empty for open local docs. |
| `JWT_ACCESS_EXPIRES_IN` | `7d` | Access token lifetime, for example `15m`, `1h`, or `7d`. |
| `JWT_REFRESH_EXPIRES_IN` | `14d` | Refresh token lifetime. |
| `JWT_STATE_SECRET` | empty | Secret used for OAuth state signing when configured. |

### Google OAuth and email

| Variable | Default | Description |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | empty | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | empty | Google sign-in callback URL. |
| `GOOGLE_CONNECT_REDIRECT_URI` | empty | Google Calendar connection callback URL. |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname. |
| `SMTP_PORT` | `587` | SMTP server port. |
| `SMTP_USER` | empty | SMTP username. |
| `SMTP_PASS` | empty | SMTP password or provider token. |
| `SMTP_FROM` | `SMTP_USER` | Sender address. |
| `SMTP_SECURE` | `false` | Use secure SMTP transport when `true`. |
| `OTP_TTL_MINUTES` | `5` | Password-reset OTP lifetime. |

### Backoffice and AI

| Variable | Default | Description |
| --- | --- | --- |
| `ADMIN_EMAIL` | empty | Application administrator email when used by the relevant workflows. |
| `BACKOFFICE_EMAIL` | empty | Email used by the production backoffice seed script. |
| `BACKOFFICE_PASSWORD` | empty | Password used by the production backoffice seed script. |
| `BACKOFFICE_NAME` | `Backoffice Admin` | Name used by the production backoffice seed script. |
| `MEMORY_EXTRACTION_ENABLED` | `true` | Enables automatic chat-memory extraction when `true`. |

Do not commit `.env` files or production credentials. Use your hosting provider's secret manager or environment configuration for deployed environments.

## API and authentication

### Route groups

| Base path | Purpose |
| --- | --- |
| `/api/health` | Service health checks. |
| `/api/auth` | Registration, login, logout, refresh, current user, Google OAuth, and password reset. |
| `/api/calendar-connection` | Google Calendar connection management. |
| `/api/access-request` | Google Calendar access-request workflows. |
| `/api/chat` | AI chat conversations and memories. |
| `/api/backoffice/auth` | Backoffice login and authentication. |
| `/api/backoffice/llm-config` | Backoffice LLM configuration. |
| `/api/backoffice` | Backoffice administration endpoints. |

Protected endpoints use a Bearer access token:

```http
Authorization: Bearer <access-token>
```

The API also uses HTTP-only cookies for browser authentication. Refresh tokens are stored in the `schedulegpt_refresh` cookie under `/api/auth`; access tokens use the `schedulegpt-token` cookie. In production, cookies require HTTPS and use cross-site `SameSite=None` behavior.

Successful responses follow this shape:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Errors use the same `success` and `message` fields with an appropriate HTTP status. List endpoints may additionally return a top-level `pagination` object.

## OpenAPI and frontend code generation

When the server is running:

- Swagger UI: `http://localhost:8000/api-docs`
- Raw OpenAPI JSON: `http://localhost:8000/docs-json`

If `DOCS_AUTH_TOKEN` is configured, both endpoints require this header:

```http
Authorization: Basic <DOCS_AUTH_TOKEN>
```

The frontend generates typed clients from the raw specification:

```sh
cd ../schedulegptfrontend
pnpm generate-types
```

Keep the backend `DOCS_AUTH_TOKEN` and the frontend code-generation configuration in sync. When adding or changing an endpoint, update both the route implementation and `src/config/swagger.ts`.

## Database and migrations

The local Docker database uses:

- Host: `localhost`
- Port: `5434`
- Database: `schedulegpt`
- User: `postgres`
- Password: `postgres`

Create a new migration for every schema change. Do not edit migrations that may already have been applied:

```sh
pnpm db:migrate
pnpm db:revert
```

The local database can be inspected with:

```sh
docker compose exec -T postgres psql -U postgres -d schedulegpt
```

`docker compose down` preserves the database volume. To remove local database data as well, use `docker compose down -v` deliberately.

## Available scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the API with `tsx` watch mode. |
| `pnpm build` | Compile TypeScript into `dist/`. |
| `pnpm type-check` | Run TypeScript checks without emitting files. |
| `pnpm start` | Start the compiled application. |
| `pnpm docker:up` | Start the local PostgreSQL container. |
| `pnpm docker:down` | Stop local containers. |
| `pnpm db:migrate` | Apply pending migrations. |
| `pnpm db:revert` | Revert the latest migration. |
| `pnpm db:seed:backoffice` | Seed a backoffice account from environment variables. |
| `pnpm db:seed:admin` | Run the interactive admin creation script. |

## Production notes

- Set `NODE_ENV=production` and use a managed PostgreSQL instance or a production database service.
- Configure `CORS_ORIGINS` with explicit frontend origins; do not use broad origins for credentialed requests.
- Set a long, randomly generated `JWT_SECRET` and keep it out of source control.
- Set `DOCS_AUTH_TOKEN` before exposing API documentation outside a private network.
- Run `pnpm build` during deployment and start with `pnpm start`.
- Run migrations as a controlled deployment step and back up the database before destructive or high-risk schema changes.
- Seed the initial backoffice account with `BACKOFFICE_EMAIL`, `BACKOFFICE_PASSWORD`, and `BACKOFFICE_NAME`, then remove or rotate those deployment secrets as appropriate.

## License

This project is currently distributed under the repository's existing `ISC` package license declaration.