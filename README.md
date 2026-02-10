# CeiVoice API

Production-ready ticket management system with comprehensive authentication, email notifications, and advanced queue processing.

## Overview

CeiVoice API is a TypeScript-based Express.js application providing ticket management, user authentication, and email notification capabilities. It features JWT-based authentication, PostgreSQL database with Prisma ORM, and asynchronous email processing via RabbitMQ.

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm 8.0 or later
- PostgreSQL 14 or later
- Docker (optional, for RabbitMQ)

### Quick Start

```bash
cd backend
pnpm install
cp .env.example .env
pnpm exec prisma migrate dev
pnpm run dev
```

The API will be available at `http://localhost:5000`.

## Core Features

### Authentication
- Email/password registration and login
- Google OAuth 2.0 integration
- JWT token management (7-day access, 30-day refresh)
- Role-based access control (USER, ASSIGNEE, ADMIN)
- Secure password hashing with bcryptjs

### Ticket Management
- Draft creation and editing
- Status lifecycle management
- Request tracking with auto-ticketing
- Comment system (public and internal)
- Admin approval workflows
- Ticket assignment and history

### Email Notifications
- Resend email delivery service
- React Email component-based templates
- RabbitMQ message queue for async processing
- Email types: Confirmation, Status Change, Comments, Assignments

### Database
- PostgreSQL relational database
- Prisma ORM for database access
- Automatic migrations
- 12+ tables for comprehensive data modeling

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ with TypeScript |
| Framework | Express.js 5.x |
| Database | PostgreSQL 14+ |
| ORM | Prisma 6.x |
| Authentication | Passport.js, JWT, bcryptjs |
| Email | Resend API, React Email |
| Queue | RabbitMQ, amqplib |
| Development | ts-node, nodemon, pnpm |

## API Endpoints

See [API Reference](docs/api/README.md) for complete endpoint documentation.

Common endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/auth/google` | Google OAuth initiation |
| POST | `/api/requests` | Submit new request |
| GET | `/api/tickets` | List all tickets |
| POST | `/api/admin/drafts/:id/approve` | Approve draft ticket |

## Configuration

Create a `.env` file based on `.env.example` with the following required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ceivoice"

# Authentication
JWT_SECRET="your-secret-key-minimum-32-characters"
PASSPORT_SECRET="your-passport-secret-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@ceivoice.com"
FRONTEND_URL="http://localhost:3000"

# RabbitMQ (optional)
RABBITMQ_ENABLED="false"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

## Development

### Common Commands

```bash
# Start development server with auto-reload
pnpm run dev

# Run email worker (for queue processing)
pnpm run worker:email:dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Database operations
pnpm exec prisma migrate dev    # Create and run migration
pnpm exec prisma migrate deploy # Deploy migrations
pnpm exec prisma studio         # Open database GUI

# Testing
pnpm run test
```

### Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration and strategies
│   │   ├── environment.ts    # Environment variables
│   │   └── passport.ts       # Passport.js strategies
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── ticket.controller.ts
│   │   ├── request.controller.ts
│   │   └── adminticket.controller.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── db.service.ts
│   │   ├── email.service.ts
│   │   ├── queue.service.ts
│   │   └── ai.service.ts
│   ├── middlewares/          # Express middleware
│   │   └── auth.middleware.ts
│   ├── routes/               # API route definitions
│   │   ├── auth.route.ts
│   │   ├── ticket.route.ts
│   │   ├── request.route.ts
│   │   └── adminticket.route.ts
│   ├── templates/            # Email templates
│   │   ├── ConfirmationEmail.tsx
│   │   ├── StatusChangeEmail.tsx
│   │   ├── CommentNotificationEmail.tsx
│   │   └── AssignmentNotificationEmail.tsx
│   ├── workers/              # Background workers
│   │   └── email.worker.ts
│   ├── constants/            # Constants
│   │   └── ticketStatus.ts
│   ├── app.ts                # Express application setup
│   └── server.ts             # Server entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── dist/                     # Compiled JavaScript
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project dependencies
├── .env.example              # Environment template
└── .npmrc                     # pnpm configuration
```

## Documentation

- [Setup and Installation](SETUP_AND_INSTALLATION.md) - Complete setup guide
- [Implementation Details](IMPLEMENTATION_DETAILS.md) - Technical architecture
- [API Reference](docs/api/README.md) - Endpoint documentation
- [Quick Reference](docs/QUICK_REFERENCE.md) - Auth quick reference
- [Testing Guide](docs/testing/AUTH_TESTING_GUIDE.md) - Auth testing instructions
- [Status](docs/STATUS.md) - Project status and roadmap

### Quick Testing

Start testing authentication flows:

```bash
bash scripts/test-auth-quick-start.sh
```

This interactive script guides you through registration, login, and token refresh.

## Support

For issues, questions, or contributions, refer to the documentation above or check the detailed guides in `docs/`.