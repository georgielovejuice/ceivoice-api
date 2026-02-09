# CeiVoice API Backend

A production-ready TypeScript Express.js API with Passport.js JWT authentication, PostgreSQL database, and comprehensive ticket management system.

## 🎯 Core Features

### Authentication (Passport.js + JWT)
- **Email/Password Auth** - Registration & login with bcryptjs hashing
- **Google OAuth 2.0** - Secure Google authentication with account linking
- **JWT Tokens** - Access tokens (7d) + Refresh tokens (30d)
- **Role-Based Access** - ADMIN, ASSIGNEE, USER roles
- **Tracking Tokens** - Public request tracking (90d expiry)

### Ticket Management
- **Draft System** - Create & edit tickets before publishing
- **Status Lifecycle** - Draft → New → Assigned → Solving → Solved/Failed → Renew
- **AI Integration** - Auto-generate drafts, suggest categories & solutions
- **Assignments** - Track assignees with history
- **Comments** - Public & internal comments with audit trail
- **Followers** - Users can track ticket progress
- **Deadlines** - Set & track ticket deadlines

### Request Processing
- **Public Submissions** - Users submit requests with email verification
- **Tracking IDs** - Track requests without authentication
- **Auto-Ticketing** - Requests automatically create draft tickets
- **Notifications** - Email confirmations & status updates

### Admin Features
- **Statistics Dashboard** - Ticket metrics by status, category, date
- **Assignee Management** - Manage roles & scopes
- **Workflow Approval** - Review & approve draft tickets
- **Performance Metrics** - Track assignee performance

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js 5.x |
| ORM | Prisma 6.x |
| Database | PostgreSQL |
| Auth | Passport.js + JWT + bcryptjs |
| Email | Nodemailer |
| Dev | ts-node, nodemon |

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- PostgreSQL
- Google OAuth credentials (optional for dev mode)

### Setup (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# 3. Setup database
npm run prisma:migrate
npm run prisma:generate

# 4. Start server
npm run dev
# Server runs on http://localhost:5000
```

### Scripts
```bash
npm run dev              # Development with hot reload
npm run build            # Build for production
npm start                # Run built code
npm run start:prod       # Build + start
npm run prisma:migrate   # Run database migrations
npm run prisma:generate  # Generate Prisma types
npm run prisma:studio    # Open Prisma UI
```

## 📚 API Reference

### Authentication Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register with email/password | ❌ |
| POST | `/api/auth/login` | Login with email/password | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| GET | `/api/auth/google` | Google OAuth start | ❌ |
| GET | `/api/auth/google/callback` | Google OAuth callback | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| POST | `/api/auth/logout` | Logout | ✅ |

### Request Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/requests` | Submit request | ❌ |
| GET | `/api/requests/track/:id` | Track request | ❌ |
| POST | `/api/requests/verify-token` | Verify token | ❌ |
| GET | `/api/requests` | List all (admin) | ✅ ADMIN |

### Ticket Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/tickets/:id` | Get ticket details | ✅ |
| GET | `/api/tickets` | List tickets | ✅ |
| PUT | `/api/tickets/:id` | Update ticket | ✅ ADMIN |
| POST | `/api/tickets/:id/assign` | Assign ticket | ✅ |
| POST | `/api/tickets/:id/comments` | Add comment | ✅ |
| GET | `/api/tickets/:id/comments` | Get comments | ✅ |

### Admin Endpoints
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/drafts` | List drafts | ✅ ADMIN |
| POST | `/api/admin/drafts/:id/approve` | Approve draft | ✅ ADMIN |
| GET | `/api/admin/stats` | Get statistics | ✅ ADMIN |
| GET | `/api/admin/assignees` | List assignees | ✅ ADMIN |

## 🏗️ Project Structure

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

## 🔐 Authentication Guide

### Passport.js + JWT Implementation
- **Strategy**: JWT Bearer tokens in Authorization header
- **Format**: `Authorization: Bearer <token>`
- **Access Token**: Valid for 7 days
- **Refresh Token**: Valid for 30 days

### Register & Login
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

### Using Tokens
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

For detailed auth documentation, see `QUICK_REFERENCE.md`

## ⚙️ Configuration

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

## 🤝 Development

### Adding Features
1. Update `prisma/schema.prisma` if needed
2. Run migrations: `npm run prisma:migrate`
3. Add logic to `services/`
4. Create endpoints in `controllers/`
5. Define routes in `routes/`
6. Add middleware in `middlewares/` if needed

### Code Style
- TypeScript for type safety
- Service layer for business logic
- Async/await for async operations
- Error handling with try/catch
- Meaningful names

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change PORT in .env or `PORT=5001 npm run dev` |
| DB connection error | Check DATABASE_URL, ensure PostgreSQL running |
| Prisma out of sync | Run `npm run prisma:generate` |
| 401 Unauthorized | Include `Authorization: Bearer <token>` header |
| 403 Forbidden | User lacks required role |

## 📞 Support

See the detailed documentation:
- **QUICK_REFERENCE.md** - Auth quick reference & examples
- **AUTH_IMPLEMENTATION.md** - Comprehensive auth guide
- Prisma documentation: https://www.prisma.io/docs/

---

**Last Updated**: February 10, 2026  
**Version**: 2.0.0 (Passport.js Integration Complete)  
**Status**: ✅ Production Ready
