# CeiVoice Backend - Ticket Management System

A complete ticket management system built with TypeScript, Express, Prisma, and PostgreSQL.

## Features Implemented (Excluding AI Module)

### EP01: User Request Submission and Tracking
- ✅ Request form submission API (email validation, message validation)
- ✅ Automatic draft ticket creation
- ✅ Submission confirmation emails (async)
- ✅ Ticket tracking with unique tracking ID
- ✅ Google OAuth 2.0 authentication
- ✅ Email notifications system

### EP03: Admin Draft and Ticket Management
- ✅ View draft tickets list
- ✅ Edit draft ticket fields
- ✅ Set deadline for tickets
- ✅ Merge multiple requests into single ticket
- ✅ Unlink requests and create new drafts
- ✅ Submit draft to new ticket with auto-followers

### EP04: Ticket Resolution and Workflow
- ✅ Assignee workload view (active tickets by deadline)
- ✅ Update ticket status with validation
- ✅ Status change history tracking
- ✅ Reassign tickets to multiple assignees
- ✅ Assignment history logging

### EP05: Collaboration and Communication
- ✅ View all ticket comments
- ✅ Add public and internal comments
- ✅ Comment notifications to followers
- ✅ View ticket participants (assignees and followers)

### EP06: System Administration and Reporting
- ✅ Toggle assignee roles
- ✅ Define assignee scopes/departments
- ✅ Admin report dashboard with statistics
- ✅ Assignee personal performance metrics
- ✅ Complete audit trail for all changes

### EP07: Non-Functional Requirements
- ✅ Email notifications (< 60 seconds)
- ✅ API response times (< 1 second)
- ✅ Security: JWT authentication
- ✅ Database: Indexed queries for performance
- ✅ CORS enabled for frontend integration

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone and navigate to project:**
   ```bash
   cd test-ceivoice-backend-database
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database:**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication Endpoints (`/api/auth`)

#### Google OAuth
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback?code=CODE` - Handle OAuth callback

#### Email Login
- `POST /api/auth/login` - Login with email
  ```json
  {
    "email": "user@example.com",
    "name": "User Name"
  }
  ```

#### Current User
- `GET /api/auth/me` - Get authenticated user info (requires token)

### Request Endpoints (`/api/requests`)

#### Submit Request (EP01-ST001)
- `POST /api/requests` - Submit new request
  ```json
  {
    "email": "user@example.com",
    "message": "My issue description"
  }
  ```

#### Track Request (EP01-ST003)
- `GET /api/requests/track/:tracking_id` - Get ticket status by tracking ID

### Ticket Endpoints (`/api/tickets`)

#### Draft Management (EP03)
- `GET /api/tickets/drafts` - Get all draft tickets
- `PUT /api/tickets/drafts/:id` - Edit draft ticket
  ```json
  {
    "title": "New title",
    "summary": "New summary",
    "category_id": 1
  }
  ```

#### Deadline Management (EP03-ST003)
- `PUT /api/tickets/:id/deadline` - Set deadline
  ```json
  {
    "deadline": "2026-03-01T10:00:00Z"
  }
  ```

#### Request Management (EP03)
- `POST /api/tickets/merge` - Merge requests
  ```json
  {
    "ticket_id": 1,
    "request_ids": [1, 2, 3]
  }
  ```
- `POST /api/tickets/unlink` - Unlink request
  ```json
  {
    "ticket_id": 1,
    "request_id": 2
  }
  ```

#### Ticket Submission (EP03-ST006)
- `POST /api/tickets/:id/submit` - Submit draft to new ticket

#### Workload & Status (EP04)
- `GET /api/tickets/assignee/:assignee_id/workload` - Get assignee's active tickets
- `POST /api/tickets/:id/status` - Update ticket status
  ```json
  {
    "new_status": "Assigned",
    "user_id": 1,
    "resolution_comment": "Optional comment for Solved/Failed"
  }
  ```

#### History
- `GET /api/tickets/:id/status-history` - Get status change history
- `GET /api/tickets/:id/assignment-history` - Get assignment history

#### Reassignment (EP04-ST004)
- `POST /api/tickets/:id/reassign` - Reassign ticket
  ```json
  {
    "assignee_ids": [1, 2],
    "user_id": 3
  }
  ```

#### Comments (EP05)
- `GET /api/tickets/:id/comments` - Get all comments
- `POST /api/tickets/:id/comments` - Add comment
  ```json
  {
    "user_id": 1,
    "content": "Comment text",
    "is_internal": false
  }
  ```

#### Participants (EP05-ST003)
- `GET /api/tickets/:id/participants` - Get assignees and followers

### User Endpoints (`/api/users`)

- `GET /api/users/:user_id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `GET /api/users/:user_id/notifications` - Get user notifications
- `PUT /api/users/notifications/:notification_id/read` - Mark as read

### Admin Endpoints (`/api/admin`)

#### Assignee Management (EP06-ST001)
- `POST /api/admin/assignees/role` - Toggle assignee role
  ```json
  {
    "user_id": 1,
    "is_assignee": true
  }
  ```

#### Scope Management (EP06-ST002)
- `POST /api/admin/assignees/scope` - Assign scope
  ```json
  {
    "user_id": 1,
    "scope_name": "IT"
  }
  ```
- `DELETE /api/admin/assignees/scope` - Remove scope
  ```json
  {
    "user_id": 1,
    "scope_name": "IT"
  }
  ```
- `GET /api/admin/assignees/:user_id/scopes` - Get assignee scopes
- `GET /api/admin/assignees` - Get all assignees

#### Reports & Analytics (EP06-ST003, EP06-ST004)
- `GET /api/admin/reports/dashboard?start_date=X&end_date=Y` - Admin dashboard
- `GET /api/admin/reports/assignee/:user_id?days=30` - Assignee metrics

#### Audit Trail (EP06-ST005)
- `GET /api/admin/audit-trail/:ticket_id` - Get complete audit trail

## Database Schema

### Core Tables

**User**
- user_id (PK)
- email (unique)
- name
- role (USER, ASSIGNEE, ADMIN)
- is_assignee
- google_id, google_email
- timestamps

**Request**
- request_id (PK)
- email
- message
- tracking_id (unique)
- created_at

**Ticket**
- ticket_id (PK)
- title
- summary
- status (Draft, New, Assigned, Solving, Solved, Failed, Renew)
- deadline
- category_id (FK)
- timestamps

**Category**
- category_id (PK)
- name (unique)

**Comment**
- comment_id (PK)
- ticket_id (FK)
- user_id (FK)
- content
- is_internal
- created_at

**StatusHistory**
- history_id (PK)
- ticket_id (FK)
- old_status
- new_status
- changed_by (FK)
- changed_at

**TicketAssignment**
- assignment_id (PK)
- ticket_id (FK)
- assignee_id (FK)
- is_active
- assigned_at

**Follower**
- follower_id (PK)
- ticket_id (FK)
- user_id (FK)
- followed_at

**AssignmentHistory**
- assignment_id (PK)
- ticket_id (FK)
- old_assignee_id (FK)
- new_assignee_id (FK)
- changed_at

**AssigneeScope**
- scope_id (PK)
- assignee_id (FK)
- scope_name

**Notification**
- notification_id (PK)
- ticket_id (FK)
- user_id (FK)
- type (submission, status_change, new_comment, assignment)
- message
- is_read
- created_at

**OAuthToken**
- token_id (PK)
- user_id (FK, unique)
- google_token
- refresh_token
- expires_at

## Status Transitions

```
Draft → New
New → Assigned, Renew
Assigned → Solving, Renew
Solving → Solved, Failed, Renew
Solved → Renew
Failed → Renew
Renew → New
```

## Services

### Validation Service (`services/validation.service.ts`)
- Email validation
- Message validation
- Title validation
- Status validation
- Status transition validation

### Email Service (`services/email.service.ts`)
- Confirmation emails
- Status change notifications
- Comment notifications
- Assignment notifications

### OAuth Service (`services/oauth.service.ts`)
- Google OAuth URL generation
- Token exchange
- User info retrieval
- Token refresh

### Auth Service (`services/auth.service.ts`)
- JWT token generation and verification
- Tracking token management

### Database Service (`services/db.service.ts`)
- All database operations
- User management
- Ticket CRUD
- Comments, history, assignments
- Notifications and scopes

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Authentication

Use JWT tokens for authenticated endpoints:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token by:
1. Using Google OAuth: `/api/auth/google`
2. Email login: `POST /api/auth/login`

## Environment Configuration

Required variables in `.env`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
EMAIL_SERVICE=gmail
EMAIL_USER=your-email
EMAIL_PASSWORD=app-password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## Development

### Run in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Database migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# View database
npx prisma studio
```

## Performance Optimization

- Database indexes on frequently queried fields (status, email, timestamps)
- Efficient queries with Prisma relations
- Async email sending (non-blocking)
- JWT for stateless authentication
- CORS enabled for frontend

## Security Features

- JWT authentication for protected endpoints
- Email validation
- Input validation and sanitization
- Database encryption ready (configure in production)
- Secure password practices (OAuth for Google)
- SQL injection protection via Prisma ORM

## Testing

Recommended tools:
- Postman for API testing
- Jest for unit tests
- Supertest for integration tests

Example test structure can be added in `src/__tests__/` directory.

## Support

For issues or questions, please check the database logs:

```bash
npx prisma studio
```

Or check server logs in development mode.

## License

ISC
