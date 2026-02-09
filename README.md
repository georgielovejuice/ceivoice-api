# CeiVoice API

Production-ready ticket management system with Passport.js authentication, JWT tokens, and Google OAuth.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Server runs on `http://localhost:5000`

## Features

- Email/password and Google OAuth authentication
- JWT-based token management (7-day access, 30-day refresh)
- Ticket lifecycle management with approval workflows
- Role-based access control (USER, ASSIGNEE, ADMIN)
- Request tracking with auto-ticketing
- Internal and public comments
- Email notifications
- PostgreSQL with Prisma ORM

## Stack

- **Backend**: Express.js 5.x, TypeScript
- **Auth**: Passport.js, JWT, bcryptjs
- **Database**: PostgreSQL, Prisma ORM
- **Email**: Nodemailer
- **Dev Tools**: ts-node, nodemon

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Create user |
| POST | /api/auth/login | Authenticate |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/auth/me | Get profile |
| GET | /api/auth/google | Google OAuth |
| POST | /api/requests | Submit request |
| GET | /api/tickets | List tickets |
| POST | /api/admin/drafts/:id/approve | Approve ticket |

See [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) for full endpoint list.

## Configuration

Required environment variables:

```env
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

See `backend/.env.example` for all options.

## Development

```bash
npm run dev          # Start with hot reload
npm run build        # Build for production
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Database GUI
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Passport & environment config
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── middlewares/     # Auth & custom middleware
│   ├── routes/          # API endpoints
│   ├── app.ts          # Express setup
│   └── server.ts       # Entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # DB migrations
└── package.json
```

## Documentation

- [docs/api/README.md](docs/api/README.md) - API overview
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - API reference
- [docs/testing/AUTH_TESTING_GUIDE.md](docs/testing/AUTH_TESTING_GUIDE.md) - Testing guide
- [docs/STATUS.md](docs/STATUS.md) - Project status
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - Version history

## Testing

```bash
# Interactive testing guide
bash TEST_AUTH_QUICK_START.sh

# Automated test suite
bash backend/test-auth-flows.sh

# Manual testing instructions
cat backend/AUTH_TESTING_GUIDE.md
```

