# CeiVoice API Backend

A production-ready TypeScript Express.js API with Passport.js JWT authentication, PostgreSQL database, and comprehensive ticket management system.

## Core Features

### Authentication (Passport.js + JWT)
- **Email/Password Auth** - Registration and login with bcryptjs hashing
- **Google OAuth 2.0** - Secure Google authentication with account linking
- **JWT Tokens** - Access tokens (7 days) and Refresh tokens (30 days)
- **Role-Based Access Control** - ADMIN, ASSIGNEE, USER roles
- **Public Tracking Tokens** - Track requests without authentication (90 day expiry)

### Ticket Management
- **Draft System** - Create and edit tickets before publishing
- **Status Lifecycle** - Draft → New → Assigned → Solving → Solved/Failed → Renew
- **AI Integration** - Auto-generate drafts, suggest categories and solutions
- **Assignment Tracking** - Track assignees with full history
- **Comments** - Public and internal comments with audit trail
- **Followers** - Users can track ticket progress
- **Deadlines** - Set and track ticket deadlines

### Request Processing
- **Public Submissions** - Users submit requests with email verification
- **Tracking IDs** - Track requests without authentication
- **Auto-Ticketing** - Requests automatically create draft tickets
- **Notifications** - Email confirmations and status updates

### Admin Features
- **Statistics Dashboard** - Ticket metrics by status, category, and date
- **Assignee Management** - Manage roles and scopes
- **Workflow Approval** - Review and approve draft tickets
- **Performance Metrics** - Track assignee performance

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js 5.x |
| ORM | Prisma 6.x |
| Database | PostgreSQL |
| Auth | Passport.js + JWT + bcryptjs |
| Email | Nodemailer |
| Dev | ts-node, nodemon |

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- Google OAuth credentials (optional for development)

### Setup (5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# 3. Setup database
pnpm run prisma:migrate
pnpm run prisma:generate

# 4. Start server
pnpm run dev
# Server runs on http://localhost:5000
```

### Available Commands

```bash
pnpm run dev              # Development with hot reload
pnpm run build            # Build for production
pnpm start                # Run built code
pnpm run start:prod       # Build and start
pnpm run prisma:migrate   # Run database migrations
pnpm run prisma:generate  # Generate Prisma types
pnpm run prisma:studio    # Open Prisma Studio
```

## API Reference

### Authentication Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register with email/password | None |
| POST | `/api/auth/login` | Login with email/password | None |
| POST | `/api/auth/refresh` | Refresh access token | None |
| GET | `/api/auth/google` | Google OAuth start | None |
| GET | `/api/auth/google/callback` | Google OAuth callback | None |
| GET | `/api/auth/me` | Get current user | Required |
| POST | `/api/auth/logout` | Logout | Required |

### Request Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/requests` | Submit request | None |
| GET | `/api/requests/track/:id` | Track request | None |
| POST | `/api/requests/verify-token` | Verify token | None |
| GET | `/api/requests` | List all requests | ADMIN |

### Ticket Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/tickets/:id` | Get ticket details | Required |
| GET | `/api/tickets` | List tickets | Required |
| PUT | `/api/tickets/:id` | Update ticket | ADMIN |
| POST | `/api/tickets/:id/assign` | Assign ticket | Required |
| POST | `/api/tickets/:id/comments` | Add comment | Required |
| GET | `/api/tickets/:id/comments` | Get comments | Required |

### Admin Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/drafts` | List drafts | ADMIN |
| POST | `/api/admin/drafts/:id/approve` | Approve draft | ADMIN |
| GET | `/api/admin/stats` | Get statistics | ADMIN |
| GET | `/api/admin/assignees` | List assignees | ADMIN |

## Project Structure

```
src/
├── config/
│   ├── environment.ts    # Config management
│   └── passport.ts       # Passport strategies (JWT, Local, Google)
├── controllers/          # Request handlers
│   ├── auth.controller.ts
│   ├── ticket.controller.ts
│   ├── request.controller.ts
│   └── adminticket.controller.ts
├── services/            # Business logic
│   ├── auth.service.ts          # Auth utilities & token mgmt
│   ├── db.service.ts            # Database queries
│   ├── email.service.ts         # Email sending
│   └── ai.service.ts            # AI utilities
├── routes/              # API route definitions
├── middlewares/         # Express middleware
│   └── auth.middleware.ts       # Passport auth middleware
├── constants/           # Constants
├── app.ts              # Express app config
└── server.ts           # Entry point

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Migration files
```

## Authentication Guide

### Passport.js and JWT Implementation
- **Strategy** - JWT Bearer tokens in Authorization header
- **Token Format** - `Authorization: Bearer <token>`
- **Access Token Expiry** - 7 days
- **Refresh Token Expiry** - 30 days

### Registration and Login

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "test123",
    "confirmPassword": "test123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "test123"}'
```

### Using Access Tokens

```bash
# Access protected endpoint
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/auth/me

# Refresh token
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### Using in Routes
```typescript
import { authenticate, authorize } from "../middlewares/auth.middleware";

// Require authentication
router.get("/protected", authenticate, controller.handler);

// Role-based access
router.delete("/admin", authenticate, authorize(["ADMIN"]), controller.handler);
```

For detailed auth documentation, see [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)

## Configuration

### Required Environment Variables
```env
DATABASE_URL=postgresql://user:pass@localhost/dbname
JWT_SECRET=your-strong-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
```

### Optional Environment Variables
```env
PORT=5000
NODE_ENV=development
JWT_ACCESS_TOKEN_EXPIRY=7d
JWT_REFRESH_TOKEN_EXPIRY=30d
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
CORS_ORIGIN=http://localhost:3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

See `.env.example` for all options.

## Development

### Adding Features
1. Update `prisma/schema.prisma` if needed
2. Run migrations: `pnpm run prisma:migrate`
3. Add business logic to `services/`
4. Create endpoints in `controllers/`
5. Define routes in `routes/`
6. Add middleware in `middlewares/` if needed

### Code Style Guidelines
- TypeScript for type safety
- Service layer for business logic separation
- Async/await for asynchronous operations
- Error handling with try-catch blocks
- Descriptive names for functions and variables

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change PORT in .env or run `PORT=5001 pnpm run dev` |
| Database connection error | Verify DATABASE_URL and ensure PostgreSQL is running |
| Prisma out of sync | Run `pnpm run prisma:generate` |
| 401 Unauthorized | Include `Authorization: Bearer <token>` header |
| 403 Forbidden | User does not have required role |

## Support

Refer to the detailed documentation:
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Authentication quick reference and examples
- [AUTH_TESTING_GUIDE.md](../testing/AUTH_TESTING_GUIDE.md) - Comprehensive testing guide
- Prisma documentation - https://www.prisma.io/docs/

---

**Last Updated**: February 10, 2026
**Version**: 2.0.0 (Passport.js Integration Complete)
**Status**: Production Ready

````
