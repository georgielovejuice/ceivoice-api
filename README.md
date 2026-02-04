# CeiVoice Backend API

A TypeScript-based Express.js REST API for managing support tickets and user requests with role-based access control.

## Project Structure

```
backend-expressjs/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Entry point
│   ├── constants/             # Constants and enums
│   ├── controllers/           # Request handlers (*.controller.ts)
│   ├── middlewares/           # Express middleware (*.middleware.ts)
│   ├── routes/                # Route definitions (*.route.ts)
│   └── services/              # Business logic (*.service.ts)
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies
└── .env.example               # Environment variables template
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.9
- **Framework**: Express.js 5.2
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Google OAuth2
- **Development**: ts-node + nodemon

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or SQLite for development)
- pnpm or npm

### Installation

```bash
cd backend-expressjs
pnpm install    # or npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ceivoice_db"
JWT_SECRET="your-secret-key-change-in-production"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
PORT=5000
AUTH_MODE=DEV
DEV_ROLE=ADMIN
```

### Database Setup

```bash
npx prisma migrate dev --name init
npx prisma studio  # View database in GUI
```

### Development

```bash
npm run dev          # Starts with ts-node + nodemon hot reload
```

### Production Build

```bash
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled server
```

## API Endpoints

### Authentication
- `POST /api/auth/google` - OAuth2 login
- `GET /api/auth/me` - Get current user (requires auth)

### Requests
- `POST /api/requests` - Submit support request

### Tickets
- `POST /api/tickets/:id/status` - Update ticket status (requires auth)
- `PATCH /api/tickets/:id/status` - Alternative update method

### Admin (requires ADMIN role)
- `GET /api/admin/tickets/drafts` - List draft tickets
- `PATCH /api/admin/tickets/:id/draft` - Edit draft ticket
- `POST /api/admin/tickets/:id/approve` - Approve draft to NEW status
- `GET /api/admin/tickets` - List active tickets

### Health Check
- `GET /health` - Server health status

## Features

✅ **Type Safety** - Full TypeScript with strict mode
✅ **Authentication** - JWT + Google OAuth2 integration
✅ **Authorization** - Role-based access control (USER/ADMIN)
✅ **Database** - Prisma ORM with PostgreSQL
✅ **Hot Reload** - Development with nodemon + ts-node
✅ **API Structure** - Controllers, Services, Routes, Middleware pattern
✅ **Validation** - Request type checking via Prisma
✅ **Error Handling** - Try-catch with proper error responses

## Development

### Get JWT Token (DEV Mode)

1. Set `AUTH_MODE=DEV` and `DEV_ROLE=ADMIN` in `.env`
2. Restart server: `npm run dev`
3. POST to `/api/auth/google` with any `id_token`
4. Copy returned token and use in Authorization header

### TypeScript Compilation

```bash
npx tsc --noEmit     # Check for errors without building
npm run build        # Build to dist/
```

### Database Operations

```bash
npx prisma migrate dev       # Create and run migration
npx prisma studio           # Open database GUI
npx prisma generate         # Regenerate Prisma client
```

## Naming Conventions

- **Controllers**: `*.controller.ts` - Handle HTTP requests/responses
- **Services**: `*.service.ts` - Business logic and database queries
- **Routes**: `*.route.ts` - Define endpoints and middleware
- **Middleware**: `*.middleware.ts` - Authentication, logging, etc.
- **Constants**: `*.ts` - Enums and constants

## File Structure Rules

```
src/
├── controllers/auth.controller.ts      (HTTP handlers)
├── services/auth.service.ts            (Database & logic)
├── routes/auth.route.ts                (Express Router)
└── middlewares/auth.middleware.ts      (Express middleware)
```

## Database Models

- **User** - User accounts with roles (ADMIN/USER)
- **Request** - Customer support requests
- **Ticket** - Support tickets with status tracking
- **Category** - Ticket categories
- **Comment** - Internal/external ticket comments
- **StatusHistory** - Audit log for status changes
- **TicketRequest** - Link requests to tickets
- **AssignmentHistory** - Track ticket assignments

## Status Transitions

```
DRAFT → NEW → SOLVING → SOLVED
             ↓
            FAILED
```

- **USER**: Can only create requests (DRAFT → NEW)
- **ADMIN**: Can change status (NEW → SOLVING → SOLVED/FAILED)

## Error Handling

All errors return appropriate HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Testing with Postman

See [TYPESCRIPT_MIGRATION.md](./TYPESCRIPT_MIGRATION.md) for complete API testing guide.

## Contributing

1. Create a feature branch from `main`
2. Make changes following the naming conventions
3. Run type checking: `npx tsc --noEmit`
4. Build and test locally: `npm run build && npm start`
5. Commit with descriptive messages

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Production server (requires build) |
| `npm run start:prod` | Build and run production |

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npx prisma migrate dev`

### TypeScript Errors
- Run `npx tsc --noEmit` to check all errors
- Ensure all imports use `.ts` file extensions
- Check that types are properly imported

### Port Already in Use
```bash
kill -9 $(lsof -i :5000)
```

## License

ISC

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Introduction](https://jwt.io/introduction)
