# CeiVoice API Backend - Merged Edition

This is a unified, production-ready TypeScript Express.js backend that combines features from both the original `backend-expressjs` and `backend-old-typescript` implementations. It follows Express.js conventions with a clean, maintainable architecture.

## 🎯 Features

### Authentication & Authorization
- **Google OAuth 2.0 Integration** - Secure Google authentication with ID token verification
- **Email/Password Authentication** - Local registration and login with bcrypt password hashing
- **JWT Token Management** - Bearer token authentication with configurable expiration
- **Tracking Tokens** - Special tokens for request tracking with 90-day expiration
- **Role-Based Access Control** - USER, ASSIGNEE, and ADMIN roles with middleware-based authorization

### Ticket Management
- **Draft Ticket Management** - Create and edit tickets before publishing
- **Status Tracking** - Comprehensive ticket status lifecycle (Draft → New → Assigned → Solving → Solved/Failed → Renew)
- **AI-Powered Suggestions** - Automatic draft generation, category suggestion, and solution recommendations
- **Comment System** - Public and internal comments with user tracking
- **Assignment Management** - Assign tickets to assignees with assignment history
- **Deadline Management** - Set and track ticket deadlines
- **Follower System** - Track interested users per ticket

### Request Processing
- **Request Submission** - Users can submit requests with email verification
- **Tracking IDs** - Unique tracking IDs for request tracking without authentication
- **Email Notifications** - Confirmation, status change, and comment notifications
- **Request-Ticket Linking** - Link multiple requests to single tickets

### Admin Features
- **Ticket Statistics** - View ticket metrics by status, category, and date range
- **Assignee Management** - Manage assignee roles and assign scopes
- **Draft Approval Workflow** - Review and approve draft tickets
- **Notification Management** - User notification system with read status tracking
- **Assignee Performance Metrics** - Track metrics like current, solved, and failed tickets

### Database
- **PostgreSQL with Prisma ORM** - Type-safe database access with migrations
- **Comprehensive Schema** - Users, Tickets, Requests, Comments, Assignments, Notifications, and more
- **Referential Integrity** - Cascade deletes and proper foreign key relationships
- **Indexing** - Strategic indexes for performance optimization

## 📦 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **ORM**: Prisma Client 6.x
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth 2.0, bcryptjs
- **Email**: Nodemailer
- **Utilities**: axios, uuid, email-validator
- **Development**: ts-node, nodemon, TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or pnpm package manager
- Google OAuth credentials (for Google login)

### Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd ceivoice-api/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   - Database URL
   - JWT secret
   - Google OAuth credentials
   - Email settings
   - Frontend URL

4. **Set up the database**
   ```bash
   # Create initial migration
   npm run prisma:migrate

   # Generate Prisma client
   npm run prisma:generate

   # Open Prisma Studio to view data
   npm run prisma:studio
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /auth/google-login         Login with Google ID token
POST   /auth/register             Register with email/password
POST   /auth/login                Login with email/password
GET    /auth/me                   Get current user (requires auth)
```

### Request Routes (`/api/requests`)
```
POST   /requests                  Submit a new request (public)
GET    /requests/track/:tracking_id  Track request status (public)
GET    /requests                  Get all requests (admin only)
POST   /requests/verify-token     Verify tracking token
```

### Ticket Routes (`/api/tickets`)
```
GET    /tickets/:id               Get ticket details
GET    /tickets?status=Draft      Get tickets by status
PUT    /tickets/:id               Edit draft ticket (admin)
PUT    /tickets/:id/deadline      Set ticket deadline (admin)
PATCH  /tickets/:id/status        Update ticket status (admin)
POST   /tickets/:id/assign        Assign ticket to user
POST   /tickets/:id/unassign      Unassign ticket from user
POST   /tickets/:id/comments      Add comment to ticket
GET    /tickets/:id/comments      Get ticket comments
POST   /tickets/:id/followers     Follow a ticket
GET    /tickets/:id/followers     Get ticket followers
```

### Admin Routes (`/api/admin`)
```
GET    /admin/drafts              List draft tickets
PUT    /admin/drafts/:id          Update draft ticket
POST   /admin/drafts/:id/approve  Approve draft ticket
GET    /admin/active              List active tickets
POST   /admin/:id/assign          Assign ticket to user
GET    /admin/assignees           Get all assignees
GET    /admin/stats               Get ticket statistics
GET    /admin/notifications       Get user notifications
PUT    /admin/notifications/:id/read  Mark notification as read
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── ticket.controller.ts
│   │   ├── request.controller.ts
│   │   └── adminticket.controller.ts
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── db.service.ts
│   │   ├── email.service.ts
│   │   ├── ai.service.ts
│   │   └── oauth.service.ts
│   ├── routes/              # API routes
│   │   ├── auth.route.ts
│   │   ├── ticket.route.ts
│   │   ├── request.route.ts
│   │   └── adminticket.route.ts
│   ├── middlewares/         # Express middlewares
│   │   └── auth.middleware.ts
│   ├── constants/           # Constants and enums
│   │   └── ticketStatus.ts
│   ├── app.ts              # Express app configuration
│   └── server.ts           # Server entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔐 Authentication Modes

### Development Mode (AUTH_MODE=DEV)
When `AUTH_MODE=DEV`, the system bypasses Google OAuth verification and creates test users:
- Admin user: `admin@test.com` (when `DEV_ROLE=ADMIN`)
- Regular user: `user@test.com` (when `DEV_ROLE=USER`)

Perfect for local development and testing.

### Production Mode (AUTH_MODE=PRODUCTION)
Requires valid Google OAuth credentials. Tokens are verified against Google's API.

## 📝 Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `GOOGLE_CLIENT_ID` - Google OAuth client ID

### Optional
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret (required in production)
- `EMAIL_SERVICE` - Email service provider (default: gmail)
- `EMAIL_USER` - Email account for sending notifications
- `EMAIL_PASSWORD` - Email account password/app password
- `FRONTEND_URL` - Frontend URL for email links
- `AUTH_MODE` - Authentication mode (DEV/PRODUCTION)
- `DEV_ROLE` - Default role in dev mode (ADMIN/USER)

## 🧪 Testing the API

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login with email/password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Submit a request
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "message": "I have an issue with the system"
  }'

# Track request
curl http://localhost:5000/api/requests/track/[TRACKING_ID]
```

### Using Postman
Import the Postman collection from `CeiVoice_API.postman_collection.json` for comprehensive API testing.

## 🔄 Database Migrations

### Create a new migration
```bash
npm run prisma:migrate -- --name descriptive_name
```

### View database with Prisma Studio
```bash
npm run prisma:studio
```

### Reset database (development only)
```bash
npx prisma migrate reset
```

## 📊 Database Schema

The database includes the following main entities:
- **User** - System users with roles and authentication data
- **Ticket** - Support tickets with status and assignments
- **Request** - User-submitted requests linked to tickets
- **Comment** - Internal and public comments on tickets
- **Category** - Ticket categorization
- **StatusHistory** - Audit trail of ticket status changes
- **AssignmentHistory** - Audit trail of ticket assignments
- **TicketAssignment** - Current ticket-assignee relationships
- **Follower** - Users following tickets
- **Notification** - User notifications
- **AssigneeScope** - Scope restrictions for assignees
- **OAuthToken** - Stored OAuth tokens

## 🤝 Contributing

When adding new features:
1. Add database schema changes to `prisma/schema.prisma`
2. Create a migration: `npm run prisma:migrate`
3. Implement business logic in `services/`
4. Add controller endpoints in `controllers/`
5. Define routes in `routes/`
6. Add middleware if needed in `middlewares/`

## 📝 Code Style

- TypeScript for type safety
- Async/await for asynchronous operations
- Error handling with try/catch blocks
- Meaningful variable and function names
- Service layer for business logic separation

## 🐛 Troubleshooting

### Port already in use
```bash
# Change the port in .env or use a different port
PORT=5001 npm run dev
```

### Database connection error
```bash
# Check DATABASE_URL in .env
# Ensure PostgreSQL is running
# Verify database exists and credentials are correct
```

### Prisma client out of sync
```bash
npm run prisma:generate
```

### Migration conflicts
```bash
npx prisma migrate resolve --rolled-back [migration_name]
```

## 📄 License

This project is provided as-is for the CeiVoice platform.

## 📞 Support

For issues or questions, please contact the development team.

---

**Last Updated**: 2026-02-09  
**Version**: 1.0.0  
**Status**: Production Ready ✅
