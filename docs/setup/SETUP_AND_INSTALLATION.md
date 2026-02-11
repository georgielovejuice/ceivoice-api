# CeiVoice API - Setup and Installation Guide

## Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+ 
- pnpm 8.0+ (install via `npm install -g pnpm`)
- PostgreSQL 14+ (for database)
- Docker (optional, for RabbitMQ)

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ceivoice"

# Resend Email API
RESEND_API_KEY="your-resend-api-key"  # Get from https://resend.com
FROM_EMAIL="noreply@ceivoice.com"
FRONTEND_URL="http://localhost:3000"

# RabbitMQ (optional for development)
RABBITMQ_ENABLED="false"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# Auth
JWT_SECRET="your-jwt-secret"
PASSPORT_SECRET="your-passport-secret"
```

### 3. Set Up Database

```bash
# Run migrations
pnpm exec prisma migrate dev

# (Optional) Seed initial data
pnpm exec prisma db seed
```

### 4. Start Development Server

```bash
pnpm run dev
```

Server will run at: `http://localhost:5000`

---

## Full Setup with RabbitMQ (Production-Ready)

### 1. Start PostgreSQL

```bash
# Using Docker
docker run -d --name postgres \
  -e POSTGRES_USER=ceivoice \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ceivoice \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Start RabbitMQ

```bash
docker run -d --name rabbitmq \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:4-management
```

RabbitMQ Dashboard: http://localhost:15672 (user: guest, pass: guest)

### 3. Configure Environment

```env
# Database
DATABASE_URL="postgresql://ceivoice:password@localhost:5432/ceivoice"

# Resend Email API
RESEND_API_KEY="your-api-key"
FROM_EMAIL="noreply@ceivoice.com"
FRONTEND_URL="http://localhost:3000"

# RabbitMQ
RABBITMQ_ENABLED="true"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# Auth
JWT_SECRET="your-jwt-secret"
PASSPORT_SECRET="your-passport-secret"
```

### 4. Set Up Database

```bash
pnpm exec prisma migrate deploy
```

### 5. Run Services

**Terminal 1 - API Server:**

```bash
pnpm run dev
```

**Terminal 2 - Email Worker:**

```bash
pnpm run worker:email:dev
```

Both will run in watch mode for development.

---

## Docker Compose Setup (Easiest)

A `docker-compose.yml` is provided for running all services together:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

This starts:
- PostgreSQL database
- RabbitMQ message queue
- API Server
- Email Worker

---

## Common Commands

### Development

```bash
# Start API in watch mode
pnpm run dev

# Start email worker in watch mode
pnpm run worker:email:dev

# Run tests
pnpm run test

# Build for production
pnpm run build
```

### Database

```bash
# Create a new migration
pnpm exec prisma migrate dev --name "description"

# Reset database (WARNING: destroys all data)
pnpm exec prisma migrate reset

# View database GUI
pnpm exec prisma studio
```

### Production Build

```bash
# Build
pnpm run build

# Start production server
pnpm start

# Start production email worker
pnpm start:worker
```

---

## Email System Features

### Sending Emails

Use the email service in your code:

```typescript
import { sendConfirmationEmail } from "./services/email.service";

// Send immediately or queue (based on RABBITMQ_ENABLED)
await sendConfirmationEmail(
  "user@example.com",
  "tracking-id-123",
  42
);
```

### Email Types Supported

1. **Confirmation Email** - New request confirmation with tracking link
2. **Status Change Email** - Ticket status update notifications
3. **Comment Notification** - New comment alerts
4. **Assignment Notification** - Ticket assignment alerts

### Queue Options

Pass `useQueue: false` to send immediately:

```typescript
// Send immediately (bypass queue)
await sendConfirmationEmail(
  "user@example.com",
  "tracking-id",
  42,
  false  // Don't use queue
);
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection string in .env
# Default: postgresql://ceivoice:password@localhost:5432/ceivoice
```

### RabbitMQ Connection Error

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check credentials in .env
# Default: amqp://guest:guest@localhost:5672
```

### TypeScript Compilation Errors

```bash
# Clear cache and reinstall
pnpm install
pnpm run build
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `RESEND_API_KEY` | Yes | - | Resend API key for email sending |
| `FROM_EMAIL` | Yes | noreply@ceivoice.com | Sender email address |
| `FRONTEND_URL` | Yes | http://localhost:3000 | Frontend URL for links in emails |
| `RABBITMQ_ENABLED` | No | false | Enable RabbitMQ queue processing |
| `RABBITMQ_URL` | No | amqp://localhost:5672 | RabbitMQ connection URL |
| `JWT_SECRET` | Yes | - | Secret for JWT token signing |
| `PASSPORT_SECRET` | Yes | - | Secret for session management |
| `NODE_ENV` | No | development | Environment (development/production) |
| `PORT` | No | 5000 | Server port |

---

## Next Steps

1. Review [IMPLEMENTATION_DETAILS.md](./IMPLEMENTATION_DETAILS.md) for technical architecture
2. Check API endpoints in [docs/api/README.md](./docs/api/README.md)
3. Run tests: `pnpm run test`
4. Deploy to production (see Docker setup above)

