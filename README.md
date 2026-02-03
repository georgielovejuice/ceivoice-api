# CeiVoice Backend - Ticket Management System

A comprehensive backend service for managing user requests and tickets with automated workflow management, collaboration features, and admin reporting.

## Quick Start

### Prerequisites
- Node.js v16+
- PostgreSQL v12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npx prisma migrate deploy

# Start development server
npm run dev
```

Server runs on `http://localhost:5000`

## Features

### Core Functionality
✅ User request submission with email validation
✅ Automatic draft ticket creation
✅ Ticket tracking with unique tracking IDs
✅ Google OAuth authentication
✅ Email confirmation and notifications
✅ Draft ticket management (create, edit, merge, unlink)
✅ Ticket status workflow with validation
✅ Multi-assignee support
✅ Comment system (public & internal)
✅ Ticket followers and notifications
✅ Admin dashboard with statistics
✅ Assignee performance metrics
✅ Complete audit trail

### No AI Module
As requested, the AI module (EP02) is excluded. All draft tickets are created manually with default values.

## Project Structure

```
src/
├── controllers/
│   ├── auth.controller.ts      # OAuth and login
│   ├── admin.controller.ts     # Admin operations
│   ├── request.controller.ts   # Request submission & tracking
│   ├── ticket.controller.ts    # Ticket management
│   └── user.controller.ts      # User management
├── services/
│   ├── auth.service.ts         # JWT token management
│   ├── db.service.ts           # All database operations
│   ├── email.service.ts        # Email notifications
│   ├── oauth.service.ts        # Google OAuth
│   ├── validation.service.ts   # Input validation
│   └── ai.service.ts           # (Excluded from implementation)
├── routes/
│   ├── auth.routes.ts
│   ├── admin.routes.ts
│   ├── request.routes.ts
│   ├── ticket.routes.ts
│   └── user.routes.ts
├── middlewares/
│   └── auth.middleware.ts      # JWT authentication
├── app.ts                       # Express app setup
└── server.ts                    # Server entry point

prisma/
└── schema.prisma               # Database schema
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation.

### Key Endpoints

- `POST /api/requests` - Submit new request
- `GET /api/requests/track/:tracking_id` - Track request status
- `GET /api/tickets/drafts` - Get draft tickets
- `POST /api/tickets/:id/status` - Update ticket status
- `POST /api/tickets/:id/reassign` - Reassign ticket
- `POST /api/tickets/:id/comments` - Add comment
- `GET /api/admin/reports/dashboard` - Admin report
- `GET /api/auth/google` - Start Google OAuth

## Database Schema

The schema includes models for:
- Users (with OAuth support)
- Requests
- Tickets
- Categories
- Comments
- Status/Assignment History
- Followers
- Notifications
- Assignee Scopes
- OAuth Tokens

See `prisma/schema.prisma` for full schema details.

## Configuration

Create `.env` file with required variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
JWT_SECRET=your-secret-key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# View database
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name
```

## Environment

- **Development**: TypeScript with ts-node-dev for auto-reload
- **Build**: TypeScript to JavaScript compilation
- **Production**: Node.js running compiled JavaScript

## Key Services

### Database Service
- CRUD operations for all entities
- Relationship management
- Query optimization with Prisma

### Email Service
- Confirmation emails (async)
- Status change notifications
- Comment notifications
- Assignment notifications

### OAuth Service
- Google OAuth flow
- Token management
- User info retrieval

### Validation Service
- Email validation
- Message/content validation
- Status validation
- Status transition rules

## Status Workflow

Valid transitions:
- Draft → New
- New → Assigned, Renew
- Assigned → Solving, Renew
- Solving → Solved, Failed, Renew
- Solved → Renew
- Failed → Renew
- Renew → New

## Performance Notes

- Database indexes on frequently queried fields
- Async email sending (non-blocking)
- JWT stateless authentication
- Efficient Prisma queries

## Authentication

Endpoints use JWT token authentication:

```
Authorization: Bearer <jwt_token>
```

Get token via:
1. Google OAuth: `/api/auth/google`
2. Email login: `POST /api/auth/login`

## Error Handling

Standard error responses:
```json
{
  "error": "Error message"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Implementation Notes

### Excluded Features
- **AI Module (EP02)**: No auto-generation of titles, summaries, categories, or solutions
- Draft tickets use manual default values

### Included Features
All other requirements from EP01, EP03-EP07 are fully implemented

### Limitations
- Email service requires valid SMTP configuration
- Google OAuth requires registered application
- Production deployment needs HTTPS/SSL
- Database must be PostgreSQL (not SQLite or other)

## Future Enhancements

- Add email queue system (Bull/BullMQ)
- Implement request rate limiting
- Add caching layer (Redis)
- WebSocket for real-time updates
- File attachment support
- Advanced filtering and search
- PDF report generation
- API documentation with Swagger

## Troubleshooting

### Database Connection Issues
```bash
# Check connection
npx prisma db execute --stdin < health_check.sql

# Reset database (dev only)
npx prisma migrate reset
```

### Missing Dependencies
```bash
npm install
npm run build
```

### Port Already in Use
Change PORT in .env or use different port:
```bash
PORT=5001 npm run dev
```

## License

ISC

## Support

For issues:
1. Check `.env` configuration
2. Verify database connection
3. Check email service credentials
4. Review application logs
