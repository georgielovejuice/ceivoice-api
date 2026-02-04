# CeiVoice Backend API - TypeScript Migration Guide

## Overview
This Express.js backend has been refactored from JavaScript to TypeScript, following proper Express.js naming conventions and best practices.

## File Structure Changes

### Before (JavaScript)
```
src/
├── app.js
├── server.js
├── constants/
│   └── ticketStatus.js
├── controllers/
│   ├── auth.js
│   ├── ticket.js
│   ├── request.js
│   └── adminticket.js
├── middlewares/
│   └── auth.middleware.js
├── routes/
│   ├── auth.js
│   ├── ticket.js
│   ├── request.js
│   └── adminticket.js
└── services/
    ├── auth.js
    ├── ticket.js
    ├── ai.js
    └── adminticket.js
```

### After (TypeScript)
```
src/
├── app.ts
├── server.ts
├── constants/
│   └── ticketStatus.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── ticket.controller.ts
│   ├── request.controller.ts
│   └── adminticket.controller.ts
├── middlewares/
│   └── auth.middleware.ts
├── routes/
│   ├── auth.route.ts
│   ├── ticket.route.ts
│   ├── request.route.ts
│   └── adminticket.route.ts
└── services/
    ├── auth.service.ts
    ├── ticket.service.ts
    ├── ai.service.ts
    └── adminticket.service.ts
```

## Naming Conventions Applied

### Controllers
- File naming: `<feature>.controller.ts`
- Pattern: PascalCase function exports
- Example: `auth.controller.ts` → `googleLogin`, `me`

### Services
- File naming: `<feature>.service.ts`
- Pattern: Function-based exports with proper interfaces
- Example: `auth.service.ts` → `googleLogin()`, `AuthResponse` interface

### Routes
- File naming: `<feature>.route.ts`
- Pattern: Express Router with controller method references
- Example: `auth.route.ts` → `/google`, `/me`

### Middleware
- File naming: `<feature>.middleware.ts`
- Pattern: Function exports with Express types
- Example: `auth.middleware.ts` → `authenticate()`, `authorize()`

## Key TypeScript Features Implemented

### Type Safety
- Full strict mode enabled in `tsconfig.json`
- Request/Response types from `@types/express`
- Prisma-generated client types
- Custom interfaces for API contracts

### Custom Types
```typescript
// Auth Payload
interface AuthPayload {
  user_id: number;
  role: "USER" | "ADMIN";
}

// Ticket Status Enum
enum TicketStatus {
  DRAFT = "DRAFT",
  NEW = "NEW",
  SOLVING = "SOLVING",
  SOLVED = "SOLVED",
  FAILED = "FAILED"
}

// Service Response Types
interface AuthResponse {
  token: string;
  user: User;
}
```

### Express Type Augmentation
Proper Express Request type augmentation for authenticated requests:
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database
```bash
npx prisma migrate dev --name init
# or
npm run db:migrate
```

### 4. Development
```bash
npm run dev
# Runs with ts-node and nodemon for hot reload
```

### 5. Production Build
```bash
npm run build
# Compiles TypeScript to JavaScript in dist/
npm start
# Runs compiled JavaScript
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server (requires build) |
| `npm run start:prod` | Build and run production server |

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user profile

### Requests
- `POST /api/requests` - Submit a new request

### Tickets
- `POST /api/tickets/:id/status` - Update ticket status
- `PATCH /api/tickets/:id/status` - Update ticket status

### Admin
- `GET /api/admin/tickets/drafts` - List draft tickets
- `PATCH /api/admin/tickets/:id/draft` - Update draft ticket
- `POST /api/admin/tickets/:id/approve` - Approve draft ticket
- `GET /api/admin/tickets` - List active tickets

## Environment Variables

```
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # JWT signing secret
GOOGLE_CLIENT_ID      # Google OAuth client ID
PORT                  # Server port (default: 5000)
AUTH_MODE             # DEV or PRODUCTION
DEV_ROLE              # Default role in DEV mode
```

## Migration Notes

### Breaking Changes
- File extensions changed from `.js` to `.ts`
- Import paths should point to new `.ts` files
- Controller naming now includes `.controller` suffix
- Service naming now includes `.service` suffix
- Route naming now includes `.route` suffix

### Type Checking
Run type checking:
```bash
npx tsc --noEmit
```

### Linting (Optional)
Consider adding ESLint for code quality:
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Database Models

The Prisma schema includes:
- **User** - User accounts with roles
- **Request** - Customer requests
- **Ticket** - Support tickets
- **Category** - Ticket categories
- **Comment** - Ticket comments
- **StatusHistory** - Ticket status change audit log
- **TicketRequest** - Link between requests and tickets
- **AssignmentHistory** - Ticket assignment history

## Best Practices

1. **Type Safety**: Always define proper types for function parameters and returns
2. **Error Handling**: Catch errors and provide meaningful messages
3. **Validation**: Use Prisma types and custom interfaces for validation
4. **Constants**: Store magic strings and configurations in constants files
5. **Middleware**: Use middleware for cross-cutting concerns (auth, logging)
6. **Services**: Keep business logic in services, controllers thin
7. **Routes**: Routes should only define endpoints and middleware order

## Future Enhancements

- Add request validation (zod or joi)
- Add logging (winston or pino)
- Add error handling middleware
- Add rate limiting
- Add API documentation (Swagger/OpenAPI)
- Add unit and integration tests
- Add pre-commit hooks (husky)
- Add code formatting (prettier)

## Troubleshooting

### TypeScript compilation errors
```bash
npx tsc --noEmit
```

### Port already in use
```bash
kill -9 $(lsof -i :5000 | grep -v COMMAND | awk '{print $2}')
```

### Database connection issues
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run migrations: `npx prisma migrate dev`

## Support
For issues or questions, please refer to the project documentation or contact the development team.
