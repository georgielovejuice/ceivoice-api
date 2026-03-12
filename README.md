# CeiVoice API — Backend

> Repository: https://github.com/georgielovejuice/ceivoice-api

REST API backend for CeiVoice, a voice-of-the-employee ticket management platform. Built with **Express.js**, **TypeScript**, **Prisma ORM**, and **Supabase** for authentication and database.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js 5 |
| Language | TypeScript 5 |
| ORM | Prisma 6 (PostgreSQL) |
| Auth | Supabase (Google OAuth + JWT) |
| Email | Resend |
| AI | Ollama (self-hosted LLM) |
| Package Manager | pnpm |

---

## Project Structure

```
src/
├── app.ts              # Express app setup, CORS, route registration
├── server.ts           # HTTP server entry point
├── config/             # Supabase client, environment config
├── constants/          # Shared constants
├── controllers/        # Route handler logic
│   ├── admin/          # Admin ticket management
│   ├── ticket/         # Ticket CRUD, comments, lifecycle
│   ├── adminticket.controller.ts
│   ├── reporting.controller.ts
│   ├── request.controller.ts
│   └── workflow.controller.ts
├── middlewares/        # Auth middleware, error handlers
├── repositories/       # Prisma data access layer
├── routes/             # Express router definitions
│   ├── ticket.route.ts
│   ├── adminticket.route.ts
│   ├── request.route.ts
│   ├── workflow.route.ts
│   └── reporting.route.ts
├── services/           # Business logic (auth, db, email)
├── templates/          # React Email templates
├── types/              # Shared TypeScript type definitions
└── lib/                # Utility helpers
prisma/
├── schema.prisma       # Database schema (PostgreSQL + multiSchema)
└── migrations/         # Migration history
```

---

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `GET /health` | Health check |
| `GET /` | API info and available endpoints |
| `/api/tickets` | Ticket operations (create, read, update, comments, lifecycle) |
| `/api/requests` | Request submission |
| `/api/admin` | Admin ticket management, assignments, drafts |
| `/api/workflow` | Workflow management |
| `/api/reporting` | Reporting and analytics |

All endpoints (except health check) require a valid **Supabase JWT** passed as `Authorization: Bearer <token>`.

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- A [Supabase](https://supabase.com) project (PostgreSQL + Auth)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file and fill in values
cp .env.example .env

# 3. Generate Prisma client
pnpm exec prisma generate

# 4. Run migrations
pnpm exec prisma migrate dev

# 5. Start dev server (port 5000)
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string |
| `DIRECT_URL` | Supabase direct connection string (for migrations) |
| `PORT` | Server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase dashboard |
| `SUPABASE_OAUTH_CALLBACK_URL` | Google OAuth redirect URL |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `FROM_EMAIL` | Sender email address |
| `FRONTEND_URL` | Frontend URL (used in email links) |
| `OLLAMA_HOST` | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | Ollama model name |

---

## Production Build

```bash
pnpm run build   # Compile TypeScript → dist/
pnpm start       # Run dist/server.js
```

---

## Docker

### Build and run standalone

```bash
docker build -t ceivoice-api .
docker run -p 5000:5000 --env-file .env ceivoice-api
```

### Run with docker compose (from monorepo root)

```bash
# Run DB migrations first
docker compose run --rm api npx prisma migrate deploy

# Start all services
docker compose up --build
```

See the root `docker-compose.yml` for the full multi-service setup including the frontend.

---

## Database

Prisma is configured with PostgreSQL using Supabase's multi-schema setup (`public` + `auth`).

```bash
pnpm exec prisma studio      # Open Prisma Studio GUI
pnpm exec prisma migrate dev # Create and apply a new migration
pnpm exec prisma generate    # Regenerate Prisma client after schema changes
```

---

## Auth Flow

1. User authenticates via **Google OAuth** through Supabase PKCE flow
2. Supabase issues an access token (JWT)
3. Frontend stores the token and sends it as `Authorization: Bearer <token>` on every request
4. Backend middleware validates the JWT using `SUPABASE_JWT_SECRET`
5. User identity is resolved from the JWT claims
