# CeiVoice API - Implementation Details

## Architecture Overview

The CeiVoice API is built with a modern, scalable architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Express.js API Server (Port 5000)          │
├─────────────────────────────────────────────────────────┤
│  Routes (auth, tickets, requests, admin)               │
│  Middleware (auth, validation)                         │
│  Controllers (business logic)                          │
│  Services (database, email, queue)                     │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
   PostgreSQL      RabbitMQ
   (Database)      (Message Queue)
       │
       ├─► Prisma ORM
       └─► Migrations
       
       ▼
   Email Service (Resend API)
       │
       ├─► React Email Templates
       └─► Email Worker Process
```

---

## Technology Stack

### Core Framework
- **Express.js 5.x** - Web framework
- **TypeScript** - Type-safe language
- **Node.js 18+** - Runtime

### Database
- **PostgreSQL 14+** - Relational database
- **Prisma ORM** - Database access and migrations

### Authentication
- **Passport.js** - Authentication middleware
- **JWT (jsonwebtoken)** - Token-based auth

### Email System
- **Resend** - Email delivery service
- **React Email** - Component-based email templates
- **@react-email/render** - Email template rendering
- **RabbitMQ** (Optional) - Message queue for async processing

### Development Tools
- **ts-node** - TypeScript execution for Node.js
- **nodemon** - File watch and auto-restart
- **pnpm** - Fast package manager

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express app setup
│   ├── server.ts                 # Server entry point
│   │
│   ├── config/
│   │   ├── environment.ts        # Config from env variables
│   │   └── passport.ts           # Passport.js strategies
│   │
│   ├── routes/
│   │   ├── auth.route.ts         # Authentication endpoints
│   │   ├── ticket.route.ts       # Ticket CRUD endpoints
│   │   ├── request.route.ts      # Request CRUD endpoints
│   │   └── adminticket.route.ts  # Admin ticket management
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts    # Auth logic
│   │   ├── ticket.controller.ts  # Ticket logic
│   │   ├── request.controller.ts # Request logic
│   │   └── adminticket.controller.ts # Admin logic
│   │
│   ├── services/
│   │   ├── db.service.ts         # Database utilities
│   │   ├── email.service.ts      # Email sending (Resend)
│   │   ├── queue.service.ts      # RabbitMQ integration
│   │   └── ai.service.ts         # AI/ML features
│   │
│   ├── templates/
│   │   ├── ConfirmationEmail.tsx         # Confirmation template
│   │   ├── StatusChangeEmail.tsx         # Status change template
│   │   ├── CommentNotificationEmail.tsx  # Comment template
│   │   └── AssignmentNotificationEmail.tsx # Assignment template
│   │
│   ├── middlewares/
│   │   └── auth.middleware.ts    # Auth validation
│   │
│   ├── constants/
│   │   └── ticketStatus.ts       # Status enums
│   │
│   └── workers/
│       └── email.worker.ts       # Email queue worker
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration files
│
├── dist/                         # Compiled JavaScript
├── node_modules/                 # Dependencies
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── tsconfig.json                 # TypeScript config
├── package.json                  # Project metadata
└── docker-compose.yml            # Docker setup
```

---

## Key Components

### 1. Email System

#### Email Service (`src/services/email.service.ts`)

Handles email sending with dual-mode support:

```typescript
// Mode 1: Immediate (useQueue: false)
await sendConfirmationEmail(email, trackingId, ticketId, false);
// Sends directly via Resend API

// Mode 2: Queue (useQueue: true)
await sendConfirmationEmail(email, trackingId, ticketId, true);
// Queues to RabbitMQ, worker processes later
```

**Available Functions:**

- `sendConfirmationEmail()` - New request confirmation
- `sendStatusChangeEmail()` - Status updates
- `sendCommentNotificationEmail()` - Comment alerts
- `sendAssignmentNotificationEmail()` - Assignment notifications
- `processQueuedEmails()` - Worker function for queue consumption

#### Email Templates (React Email)

Located in `src/templates/`:

- **ConfirmationEmail.tsx**
  - Props: `email`, `trackingId`, `ticketId`, `frontendUrl`
  - Includes tracking link
  - Professional HTML layout

- **StatusChangeEmail.tsx**
  - Props: `ticketId`, `newStatus`, `trackingId`, `frontendUrl`
  - Color-coded status indicators
  - Action button to view ticket

- **CommentNotificationEmail.tsx**
  - Props: `ticketId`, `commenterName`, `trackingId`, `frontendUrl`
  - Shows commenter name
  - Links back to ticket

- **AssignmentNotificationEmail.tsx**
  - Props: `ticketId`, `ticketTitle`, `assigneeName`
  - Assignment details
  - Call-to-action button

#### Queue Service (`src/services/queue.service.ts`)

RabbitMQ integration:

```typescript
// Publish email to queue
await queueService.publishEmail({
  type: "confirmation",
  email: "user@example.com",
  data: { trackingId, ticketId }
});

// Consume emails (used by worker)
await queueService.consumeEmails(async (payload) => {
  // Process email
});

// Get queue statistics
const stats = await queueService.getQueueStats();
```

**Queue Configuration:**

- Exchange: `email_exchange` (direct)
- Queue: `emails` (durable)
- Message TTL: 24 hours
- Max length: 10,000 messages

#### Email Worker (`src/workers/email.worker.ts`)

Standalone process that:
1. Connects to RabbitMQ
2. Consumes queued emails
3. Renders templates to HTML
4. Sends via Resend API
5. Acknowledges messages
6. Handles graceful shutdown

Run with: `pnpm run worker:email:dev`

### 2. Authentication System

#### Auth Controller (`src/controllers/auth.controller.ts`)

Handles:
- User registration
- Login/logout
- JWT token generation
- Password reset
- Session management

#### Passport Configuration (`src/config/passport.ts`)

Supports:
- Local strategy (username/password)
- JWT strategy (token-based)
- OAuth strategies (optional)

#### Auth Middleware (`src/middlewares/auth.middleware.ts`)

Validates:
- JWT tokens
- User permissions
- Session status

### 3. Database Layer

#### Prisma Schema (`prisma/schema.prisma`)

Defines:
- User model
- Ticket model
- Request model
- Comments model
- Admin audit logs

#### Database Service (`src/services/db.service.ts`)

Provides:
- Query builders
- Transaction support
- Seed functions
- Migration helpers

#### Migrations

Located in `prisma/migrations/`:
- Numbered sequentially
- Automatic via `prisma migrate`
- Rollback support

---

## Request/Response Flow

### Creating a Ticket

```
POST /api/tickets
├── Route: ticketRoute
├── Controller: createTicket()
├── Validation: middleware
├── DB: prisma.ticket.create()
├── Email: sendConfirmationEmail()
│   ├── Check RABBITMQ_ENABLED
│   ├── Queue → RabbitMQ (if enabled)
│   └── Send → Resend API (if queued is false)
├── Response: 201 Created
└── Client receives ticket + email sent confirmation
```

### Email Processing (With Queue)

```
API sends email:
├── queueService.publishEmail()
├── → RabbitMQ (durable queue)
└── Returns immediately

Email Worker:
├── queueService.consumeEmails()
├── Processes batch
├── Renders React template
├── Calls Resend API
├── Acknowledges message
└── Ready for next message
```

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"
FROM_EMAIL="noreply@ceivoice.com"
FRONTEND_URL="http://localhost:3000"

# Queue (RabbitMQ)
RABBITMQ_ENABLED="true"
RABBITMQ_URL="amqp://user:pass@localhost:5672"

# Auth
JWT_SECRET="your-secret-key"
PASSPORT_SECRET="your-secret-key"

# Server
NODE_ENV="development"
PORT=5000
LOG_LEVEL="debug"
```

### TypeScript Configuration

Key compiler options in `tsconfig.json`:

- `target: "ES2020"` - Modern JavaScript
- `module: "commonjs"` - Node.js modules
- `strict: true` - Strict type checking
- `jsx: "react"` - JSX/TSX support for email templates
- `esModuleInterop: true` - CommonJS/ESM compatibility

---

## Error Handling

### Email Service Errors

```typescript
try {
  await sendConfirmationEmail(...);
} catch (error) {
  console.error("Email failed:", error);
  // Fallback: queue automatically for retry
}
```

### Queue Service Errors

- Failed messages: Auto-requeued with exponential backoff
- Connection failures: Automatic reconnection
- Dead-letter queue: Messages after 3 retries

### API Error Response

```json
{
  "status": "error",
  "message": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Performance Considerations

### Email Processing

- **Immediate Mode**: ~200-500ms per email
- **Queue Mode**: ~50-100ms (returns immediately)
- **Batch Processing**: Worker processes 10-100 emails in parallel

### Database

- Prisma connection pooling (default: 10 connections)
- Indexes on frequently queried fields
- Pagination support for large datasets

### Caching

- Session caching via Redis (optional)
- Template compilation caching
- Static file caching in production

---

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t ceivoice-api:latest .

# Run container
docker run -d \
  -e DATABASE_URL="..." \
  -e RESEND_API_KEY="..." \
  -p 5000:5000 \
  ceivoice-api:latest
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] JWT secrets generated
- [ ] HTTPS enabled
- [ ] Logging configured
- [ ] Error monitoring (Sentry, etc.)
- [ ] Email templates tested
- [ ] RabbitMQ cluster (if using queue)
- [ ] Database backups automated
- [ ] Rate limiting enabled

---

## Monitoring & Logging

### Log Levels

- `error` - Critical failures
- `warn` - Warnings
- `info` - General information
- `debug` - Detailed debugging

### Queue Monitoring

```bash
# RabbitMQ Dashboard
http://localhost:15672

# Queue Stats Endpoint (if exposed)
GET /api/admin/queue-stats
```

### Email Delivery

Track deliverability via Resend Dashboard:
- Open rates
- Click rates
- Bounce rates
- Spam complaints

---

## Testing

### Unit Tests

```bash
pnpm run test
```

### Email Testing

```bash
# Test with development emails
RESEND_API_KEY="test_key" pnpm run dev

# Use Resend test domain
FROM_EMAIL="onboarding@resend.dev"
```

### Queue Testing

```bash
# View RabbitMQ queue
docker logs rabbitmq

# Monitor queue depth
GET /api/admin/queue-stats
```

---

## Troubleshooting

### Email Not Sending

1. Check `RESEND_API_KEY` is valid
2. Verify `FROM_EMAIL` is verified in Resend
3. Check email address isn't in spam list
4. Review logs: `docker logs api`

### Queue Not Processing

1. Verify RabbitMQ running: `docker ps | grep rabbitmq`
2. Check `RABBITMQ_ENABLED=true`
3. Check worker process: `pnpm run worker:email:dev`
4. Monitor logs: `docker logs rabbitmq`

### Database Connection Issues

1. Verify PostgreSQL running
2. Check `DATABASE_URL` format
3. Run migrations: `pnpm exec prisma migrate deploy`
4. View schema: `pnpm exec prisma studio`

---

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
