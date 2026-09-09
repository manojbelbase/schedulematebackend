# ScheduleGPT Backend

An **AI-powered calendar assistant** that lets users manage Google Calendar through natural language conversations. Built with **Express 5 + TypeORM + PostgreSQL + pgvector**, it features an LLM agent with tool-calling, long-term vector memory, and a multi-app frontend architecture.

---

## Table of Contents

- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Key Technical Decisions](#key-technical-decisions)
  - [AI Agent with Tool Calling](#ai-agent-with-tool-calling)
  - [Long-Term Memory with pgvector](#long-term-memory-with-pgvector)
  - [JWT Authentication Flow](#jwt-authentication-flow)
  - [Provider-Driven LLM Configuration](#provider-driven-llm-configuration)
  - [API Quota System](#api-quota-system)
- [API Routes](#api-routes)
- [OpenAPI & Frontend Codegen](#openapi--frontend-codegen)
- [Database & Migrations](#database--migrations)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Production Notes](#production-notes)

---

## What It Does

ScheduleGPT is a full-stack AI scheduling assistant:

1. **Conversational AI** — Users chat naturally ("Schedule a meeting with John tomorrow at 3pm") and the AI agent understands intent, checks for conflicts, and manages calendar events via Google Calendar API.
2. **Long-Term Memory** — The system remembers user preferences and past conversations using vector embeddings stored in PostgreSQL, so it learns over time.
3. **Multi-Provider Support** — Admins can switch between LLM providers (DeepSeek, OpenAI, Anthropic, Google, Grok) and embedding models without code changes.
4. **Backoffice Admin** — Admin dashboard for user management, API quota control, LLM configuration, and access request workflows.
5. **OpenAPI-First Design** — The frontend (React) auto-generates typed API clients from the backend's OpenAPI spec, ensuring type safety across the full stack.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 22 + TypeScript (ESM) | Modern async/await, strict typing |
| Framework | Express 5 | Mature, flexible, ecosystem |
| ORM | TypeORM | Schema-first with migrations |
| Database | PostgreSQL 15 + pgvector | Relational + vector similarity search |
| Auth | JWT (access + refresh tokens) | Stateless, scalable, cookie-based |
| Validation | Zod | Runtime type safety at API boundary |
| AI | OpenAI-compatible API (tool calling) | Multi-provider support |
| Embeddings | pgvector (vector 1536) | No separate vector DB needed |
| Logging | Pino | Structured, high-performance |
| Docs | Swagger UI + OpenAPI 3 | Auto-generated frontend clients |
| Dev | tsx watch | Hot-reload without build step |

---

## System Architecture

```
                          ┌─────────────────────┐
                          │   3 Frontend Apps    │
                          │  (React + TypeScript)│
                          └──────────┬──────────┘
                                     │
                    OpenAPI Codegen ◄─┤  Auto-generates typed clients
                                     │
                          ┌──────────▼──────────┐
                          │    Express 5 API     │
                          │    (TypeScript)      │
                          └──────────┬──────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
    ┌─────────▼─────────┐  ┌────────▼────────┐  ┌─────────▼─────────┐
    │    PostgreSQL      │  │   OpenAI API    │  │  Google Calendar   │
    │  + pgvector        │  │  (Tool Calling) │  │  API (OAuth2)      │
    │                    │  │                 │  │                    │
    │  ┌──────────────┐  │  │  - Chat complet │  │  - Get events      │
    │  │ users        │  │  │  - Tool routing │  │  - Create events   │
    │  │ chat_*       │  │  │  - Embeddings   │  │  - Update events   │
    │  │ memories     │  │  │                 │  │  - Delete events   │
    │  │ llm_config   │  │  └─────────────────┘  └────────────────────┘
    │  │ embedding_*  │  │
    │  │ calendar_*   │  │
    │  └──────────────┘  │
    └────────────────────┘
```

### Module Structure

```
src/
├── server.ts                    # Bootstrap: DB init → createApp → listen → graceful shutdown
├── app.ts                       # Express middleware + route mounting + /docs-json
├── config/
│   ├── env.ts                   # Typed env (checkRequiredEnvVariable)
│   ├── data-source.ts           # TypeORM DataSource (entities + migrations)
│   ├── swagger.ts               # OpenAPI 3 spec (2200+ lines, source of truth)
│   ├── llm.ts                   # OpenAI-compatible client factory
│   ├── llmProviders.ts          # Provider registry (deepseek, openai, anthropic, etc.)
│   ├── embedding.ts             # Embedding generation
│   ├── embeddingProviders.ts    # Embedding provider registry
│   └── googleOAuth.ts           # OAuth2Client + scope builders
├── common/
│   ├── entities/base.entity.ts  # Abstract BaseEntity (id, createdAt, updatedAt)
│   ├── middleware/
│   │   ├── auth.ts              # authenticate() + requireAdmin()
│   │   ├── asyncHandler.ts      # Async error wrapper
│   │   ├── errorHandler.ts      # Global error handler
│   │   ├── validateBody.ts      # Zod validation middleware
│   │   ├── rateLimit.ts         # Express-rate-limit configs
│   │   └── docsAuth.ts          # Basic auth for /api-docs
│   ├── errors/AppError.ts       # Custom error class with statusCode
│   └── utils/
│       ├── jwt.ts               # Sign/verify access + refresh tokens
│       ├── refreshCookie.ts     # HttpOnly cookie helpers
│       ├── password.ts          # scrypt hash/verify
│       └── pagination.ts        # parseListQuery + buildPagination
├── modules/
│   ├── auth/                    # Register, login, logout, refresh, OAuth, password reset
│   ├── users/                   # User entity + repository
│   ├── chat/
│   │   ├── entities/            # ChatConversation, ChatMessage, ChatMemory
│   │   ├── tools/               # Calendar tool definitions + executor
│   │   ├── agent.service.ts     # AI agent loop (tool calling)
│   │   ├── chat.service.ts      # Message processing + quota enforcement
│   │   └── memory.service.ts    # pgvector memory extraction + retrieval
│   ├── calendarConnection/      # Google Calendar OAuth + CRUD
│   ├── accessRequest/           # Waitlist/approval workflow
│   ├── backoffice/              # Admin dashboard, users, LLM/embedding config
│   ├── passwordReset/           # OTP-based password reset
│   └── health/                  # Health check endpoint
├── database/migrations/         # 19 timestamped TypeORM migrations
├── lib/
│   ├── logger.ts                # Pino (pino-pretty in dev)
│   ├── response.ts              # sendSuccess() response helper
│   └── mailer.ts                # Nodemailer for OTP emails
└── types/express.d.ts           # Request augmentation (req.user)
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────┐
│           users             │
├─────────────────────────────┤
│ id (uuid, PK)              │
│ email (varchar, unique)     │
│ name (varchar)              │
│ password (text, nullable)   │ ← scrypt hashed (null for OAuth users)
│ username (varchar, unique)  │
│ google_id (varchar, unique) │
│ role (varchar)              │ ← "user" | "admin"
│ api_request_limit (int)     │ ← default: 10
│ api_requests_used (int)     │ ← default: 0
│ created_at (timestamp)      │
│ updated_at (timestamp)      │
└──────────┬──────────────────┘
           │
           ├──────────────────────────┐
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────────┐
│  calendar_connections│   │     access_requests       │
├──────────────────────┤   ├──────────────────────────┤
│ id (uuid, PK)        │   │ id (uuid, PK)            │
│ user_id (uuid, FK)   │──▶│ user_id (uuid, FK)       │
│ google_email         │   │ requester_email           │
│ access_token (text)  │   │ requester_name            │
│ refresh_token (text) │   │ message (text)            │
│ expires_at           │   │ status                    │ ← pending|approved|rejected
│ connected (bool)     │   │ created_at / updated_at   │
└──────────────────────┘   └──────────────────────────┘
           │
           │ (via user_id)
           ▼
┌──────────────────────────────┐
│      chat_conversations      │
├──────────────────────────────┤
│ id (uuid, PK)               │
│ user_id (uuid, indexed)     │
│ title (varchar)             │
│ created_at (timestamp)      │
└──────────┬───────────────────┘
           │
           ├──────────────────────────┐
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────────┐
│   chat_messages      │   │     chat_memories         │
├──────────────────────┤   ├──────────────────────────┤
│ id (uuid, PK)        │   │ id (uuid, PK)            │
│ conversation_id      │──▶│ user_id (uuid, indexed)   │
│   (uuid, FK)         │   │ conversation_id (indexed) │
│ role                 │   │ content (text)            │
│   ("user"|"assistant")│  │ embedding (vector 1536)   │ ← pgvector!
│ content (text)       │   │ created_at (timestamp)    │
│ created_at (timestamp)│   └──────────────────────────┘
└──────────────────────┘
                                         │
                              ivfflat cosine index
                              (fast similarity search)

┌──────────────────────────┐   ┌──────────────────────────┐
│      llm_config          │   │    embedding_config       │
├──────────────────────────┤   ├──────────────────────────┤
│ id (uuid, PK)            │   │ id (uuid, PK)            │
│ name (varchar, unique)   │   │ name (varchar, unique)   │
│ is_active (boolean)      │   │ is_active (boolean)      │
│ active_provider (varchar)│   │ active_provider (varchar)│
│ api_key (varchar 500)    │   │ api_key (varchar 500)    │
│ model (varchar 200)      │   │ model (varchar 200)      │
│ base_url (varchar 500)   │   │ base_url (varchar 500)   │
└──────────────────────────┘   │ dimension (int, 1536)     │
                               └──────────────────────────┘

┌──────────────────────────┐
│    password_resets        │
├──────────────────────────┤
│ id (uuid, PK)            │
│ user_id (uuid, indexed)  │
│ hashed_otp (text)        │ ← scrypt "salt:hash"
│ expires_at (timestamp)   │
│ used (boolean)           │
└──────────────────────────┘
```

### Migration Strategy

The project uses **19 incremental migrations** following data-preservation principles:

- **Never** drop columns/tables with user data
- **Always** use additive changes (`ALTER TABLE ... ADD COLUMN`) or renames (`ALTER TABLE ... RENAME TO`)
- **Idempotent** guards (`IF NOT EXISTS`) for safety
- Example: `google_accounts` → `google_calendar_connections` → `calendar_connections` (3 renames, zero data loss)

---

## Key Technical Decisions

### AI Agent with Tool Calling

The AI agent (`agent.service.ts`) uses **OpenAI-compatible tool calling** to manage Google Calendar events:

```
User: "Schedule a meeting with John tomorrow at 3pm"
                │
                ▼
┌─────────────────────────────────────────┐
│           Agent Service Loop            │
│        (max 4 iterations)               │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ System Prompt                   │    │
│  │ + Chat History                  │    │
│  │ + Relevant Memories (pgvector)  │    │
│  │ + Calendar Tools                │    │
│  └─────────────┬───────────────────┘    │
│                │                        │
│                ▼                        │
│  ┌─────────────────────────────────┐    │
│  │ LLM decides: Call tool?         │    │
│  │                                 │    │
│  │  YES → Execute tool             │    │
│  │        ├─ get_calendar_events   │    │
│  │        ├─ create_calendar_event │    │
│  │        ├─ update_calendar_event │    │
│  │        └─ delete_calendar_event │    │
│  │                                 │    │
│  │  NO  → Return final response    │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Tool executor** (`calendarToolExecutor.ts`) handles:
- Zod schema validation of tool arguments
- Conflict detection (overlapping events)
- Timezone conversion (local → UTC via `Intl.DateTimeFormat`)
- Google Calendar API calls
- Error translation to user-friendly messages

### Long-Term Memory with pgvector

The memory system uses PostgreSQL's `pgvector` extension for **semantic long-term memory**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory Pipeline                           │
│                                                             │
│  1. EXTRACT (background, non-blocking):                     │
│     User message + Assistant response                       │
│           │                                                 │
│           ▼                                                 │
│     LLM: "Is this worth remembering?"                       │
│           │                                                 │
│           ▼ (YES)                                           │
│     Generate 1536-dim embedding                             │
│           │                                                 │
│           ▼                                                 │
│     Dedup check (cosine similarity > 0.95 → skip)          │
│           │                                                 │
│           ▼                                                 │
│     Store in chat_memories.embedding (vector 1536)          │
│                                                             │
│  2. RETRIEVE (on new message):                              │
│     Generate query embedding                                │
│           │                                                 │
│           ▼                                                 │
│     pgvector cosine search (top 5, threshold 0.15)          │
│           │                                                 │
│           ▼                                                 │
│     Inject relevant memories into system prompt             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key decisions:**
- **pgvector over Pinecone/Weaviate:** No separate vector DB — PostgreSQL handles relational + vector in one system
- **Deduplication at 0.95 cosine similarity:** Prevents storing redundant memories
- **IVFFlat index:** Fast approximate nearest neighbor search
- **Background extraction:** Memory processing doesn't block the chat response

### JWT Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Flow                                 │
│                                                             │
│  Register/Login:                                            │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐    │
│  │ User creds │───▶│ Verify hash│───▶│ Sign tokens    │    │
│  └────────────┘    └────────────┘    └───────┬────────┘    │
│                                              │              │
│                                              ▼              │
│                    ┌────────────────────────────────────┐    │
│                    │ Access Token (15min)               │    │
│                    │ → cookie: schedulegpt-token        │    │
│                    │ → JSON body (cross-site support)   │    │
│                    ├────────────────────────────────────┤    │
│                    │ Refresh Token (7d)                 │    │
│                    │ → cookie: schedulegpt_refresh      │    │
│                    │   (HttpOnly, SameSite=Strict)      │    │
│                    │ → path: /api/auth                  │    │
│                    └────────────────────────────────────┘    │
│                                                             │
│  Token Payload: { sub, email, role, jti, tokenType }        │
│                                                             │
│  Refresh Flow:                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐    │
│  │ Refresh    │───▶│ Verify     │───▶│ Issue new      │    │
│  │ cookie     │    │ + load user│    │ access+refresh │    │
│  └────────────┘    └────────────┘    └────────────────┘    │
│                                                             │
│  Google OAuth:                                              │
│  ┌────────────┐    ┌────────────┐    ┌────────────────┐    │
│  │ /api/auth/ │───▶│ Google     │───▶│ findOrCreate   │    │
│  │ google     │    │ OAuth2     │    │ GoogleUser     │    │
│  └────────────┘    └────────────┘    └────────────────┘    │
│                                              │              │
│                                              ▼              │
│                    ┌────────────────────────────────────┐    │
│                    │ Redirect to frontend with tokens   │    │
│                    └────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Provider-Driven LLM Configuration

Admins can switch LLM/embedding providers **without code changes**:

```
┌─────────────────────────────────────────────────────────────┐
│                  LLM Provider Registry                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  deepseek   │  │   openai    │  │  anthropic  │        │
│  │  (default)  │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   google    │  │    grok     │  │  openrouter │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  Active config stored in llm_config table:                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ name: "default"                                      │  │
│  │ is_active: true                                      │  │
│  │ active_provider: "deepseek"                          │  │
│  │ api_key: "sk-***xxxx" (masked in responses)          │  │
│  │ model: "deepseek-chat"                               │  │
│  │ base_url: "https://api.deepseek.com"                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  On config change: invalidate cached OpenAI client          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API Quota System

Rate-limiting per user with admin controls:

```
┌─────────────────────────────────────────────────────────────┐
│                    Quota Enforcement                         │
│                                                             │
│  User sends message                                         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────┐                        │
│  │ api_requests_used               │                        │
│  │        <                        │                        │
│  │ api_request_limit (default: 10) │                        │
│  └─────────────┬───────────────────┘                        │
│                │                                            │
│       ┌────────┴────────┐                                   │
│       │                 │                                   │
│       ▼ YES             ▼ NO (quota exceeded)               │
│  ┌──────────┐      ┌──────────────────────────────┐        │
│  │ Process  │      │ Return 403 USER_QUOTA_EXCEEDED│        │
│  │ message  │      │ { code, upgradeInfo }         │        │
│  │          │      └──────────────────────────────┘        │
│  │ Post:    │                                               │
│  │ used++   │      Backoffice can:                          │
│  └──────────┘      • Update api_request_limit per user      │
│                    • Reset api_requests_used to 0            │
└─────────────────────────────────────────────────────────────┘
```

---

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/auth/register` | None | Create account |
| `POST` | `/api/auth/login` | None | Email/password login |
| `GET` | `/api/auth/google` | None | Google OAuth redirect |
| `GET` | `/api/auth/google/callback` | None | Google OAuth callback |
| `POST` | `/api/auth/refresh` | Cookie | Refresh tokens |
| `POST` | `/api/auth/logout` | Token | Clear session |
| `GET` | `/api/auth/me` | Token | Get current user |
| `POST` | `/api/auth/forgot-password` | None | Request OTP |
| `POST` | `/api/auth/verify-otp` | None | Verify OTP |
| `POST` | `/api/auth/reset-password` | None | Reset password |
| `GET` | `/api/calendar-connection/status` | Token | Connection status |
| `GET` | `/api/calendar-connection/connect` | Token | Google Calendar OAuth |
| `GET` | `/api/calendar-connection/connect/callback` | None | OAuth callback |
| `POST` | `/api/calendar-connection/disconnect` | Token | Disconnect calendar |
| `POST` | `/api/access-request/request-access` | Token | Request access |
| `GET` | `/api/access-request/me` | Token | My requests |
| `GET` | `/api/chat/conversations` | Token | List conversations |
| `POST` | `/api/chat/conversations` | Token | New conversation |
| `GET` | `/api/chat/conversations/:id` | Token | Get conversation |
| `DELETE` | `/api/chat/conversations/:id` | Token | Delete conversation |
| `GET` | `/api/chat/conversations/:id/messages` | Token | Get messages |
| `POST` | `/api/chat/conversations/:id/messages` | Token | Send message (triggers AI) |
| `POST` | `/api/backoffice/auth/login` | None | Admin login |
| `GET` | `/api/backoffice/users` | Admin | List users |
| `PATCH` | `/api/backoffice/users/:id/limit` | Admin | Update user quota |
| `GET` | `/api/backoffice/access-requests` | Admin | List requests |
| `PATCH` | `/api/backoffice/access-requests/:id/status` | Admin | Approve/reject |
| `GET` | `/api/backoffice/llm-config` | Admin | List LLM configs |
| `POST` | `/api/backoffice/llm-config` | Admin | Create LLM config |
| `PATCH` | `/api/backoffice/llm-config/:id` | Admin | Update LLM config |

---

## OpenAPI & Frontend Codegen

The backend is the **single source of truth** for the API contract:

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenAPI Pipeline                          │
│                                                             │
│  Backend (this repo)                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ src/config/swagger.ts (2200+ lines)                  │  │
│  │   • All paths, responses, schemas                    │  │
│  │   • components/schemas → frontend TypeScript types   │  │
│  │   • paths → React Query hooks                        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│                         ▼                                   │
│  GET /docs-json (OpenAPI 3.0 JSON)                          │
│                         │                                   │
│                         ▼                                   │
│  Frontend (schedulegptfrontend repo)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ openapi-codegen                                      │  │
│  │   • Fetches /docs-json with Basic auth               │  │
│  │   • Generates typed clients for 3 apps:              │  │
│  │     - web (main app)                                 │  │
│  │     - backoffice (admin)                             │  │
│  │     - website (public)                               │  │
│  │   • pnpm generate-types                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Swagger UI: http://localhost:8000/api-docs                 │
│  Raw JSON:   http://localhost:8000/docs-json                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Database & Migrations

### Local Docker Database

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5434` |
| Database | `schedulegpt` |
| User | `postgres` |
| Password | `postgres` |

### Migration Commands

```sh
# Apply pending migrations
pnpm db:migrate

# Revert latest migration
pnpm db:revert

# Inspect database
docker compose exec -T postgres psql -U postgres -d schedulegpt
```

### Migration Rules

1. **Never** edit an already-applied migration
2. **Never** drop columns/tables with user data
3. **Always** create new timestamped migration files
4. **Prefer** additive changes (`ADD COLUMN`) over destructive ones
5. **Use** `IF NOT EXISTS` guards for idempotent migrations

---

## Local Setup

### Prerequisites

- Node.js 22+
- pnpm 10+
- Docker & Docker Compose

### Quick Start

```sh
# 1. Install dependencies
pnpm install

# 2. Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/schedulegpt
JWT_SECRET=$(openssl rand -hex 32)
EOF

# 3. Start PostgreSQL
pnpm docker:up

# 4. Run migrations
pnpm db:migrate

# 5. Start dev server
pnpm dev
```

API available at `http://localhost:8000`.

### Available Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server with hot-reload (tsx watch) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm type-check` | Type-check without emitting |
| `pnpm start` | Run compiled application |
| `pnpm docker:up` | Start PostgreSQL container |
| `pnpm docker:down` | Stop containers |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:revert` | Revert latest migration |
| `pnpm db:seed:backoffice` | Seed admin account from env vars |
| `pnpm db:seed:admin` | Interactive admin creation |

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret for JWT signing |

### Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | HTTP server port |
| `NODE_ENV` | `development` | Production mode |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGINS` | empty | Comma-separated frontend origins |
| `FRONTEND_URL` | first CORS origin | Redirect URL |
| `DOCS_AUTH_TOKEN` | empty | Protects `/api-docs` |
| `JWT_ACCESS_EXPIRES_IN` | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `14d` | Refresh token lifetime |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | empty | Google OAuth client secret |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | empty | SMTP username |
| `SMTP_PASS` | empty | SMTP password |
| `ADMIN_EMAIL` | empty | Admin email |
| `BACKOFFICE_EMAIL` | empty | Backoffice seed email |
| `BACKOFFICE_PASSWORD` | empty | Backoffice seed password |
| `MEMORY_EXTRACTION_ENABLED` | `true` | Enable chat memory extraction |

---

## Production Notes

- Set `NODE_ENV=production` for secure cookies (`SameSite=None`, `secure: true`)
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Configure `CORS_ORIGINS` with explicit frontend origins
- Set strong `JWT_SECRET` (64+ character random string)
- Set `DOCS_AUTH_TOKEN` before exposing API docs
- Run `pnpm build` then `pnpm start` for production
- Run migrations as controlled deployment step
- Backup database before risky schema changes

---

## License

ISC
