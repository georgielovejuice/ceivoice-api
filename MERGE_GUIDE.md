# CeiVoice Backend Merge Guide

## Overview
This document describes the merged backend that combines features from `backend-expressjs` and `backend-old-typescript` into a single, unified TypeScript Express.js application following professional conventions.

## What Was Merged

### From `backend-expressjs` (Newer):
✅ **Google OAuth 2.0 Integration**
- Secure Google authentication with ID token verification
- Development mode with test users

✅ **AI Service**
- Draft ticket generation from user messages
- Automatic category suggestions
- Suggested solution generation
- Priority estimation

✅ **Clean Route Structure**
- Modern Express.js route organization
- Proper middleware chaining

### From `backend-old-typescript` (Feature-Rich):
✅ **Email/Password Authentication**
- User registration with validation
- Email/password login with bcrypt hashing
- Token generation and verification

✅ **Comprehensive Email Service**
- Confirmation emails
- Status change notifications
- Comment notifications
- Assignment notifications

✅ **Database Service**
- Full CRUD operations for all entities
- Ticket assignment and management
- Comment system
- Status history tracking
- Assignment history tracking
- Follower system
- Notification management
- Statistics and metrics
- Scope management

✅ **User Management Features**
- User roles (USER, ASSIGNEE, ADMIN)
- Assignee management
- User lookup by email/ID
- Admin user queries

✅ **Tracking System**
- Unique tracking IDs for requests
- Tracking tokens for public tracking
- Request-ticket linking

✅ **Advanced Features**
- Public and internal comments
- Ticket followers
- Assignment history
- Status history
- Notifications system
- Admin statistics
- Assignee performance metrics

## Architecture Improvements

### 1. **Unified Field Naming Convention**
All database fields now follow consistent snake_case naming:
```
✅ user_id (was userId or user_id - now consistent)
✅ tracking_id (was trackingId)
✅ is_assignee (was isAssignee)
✅ suggested_solution (was suggestedSolution)
✅ created_at, updated_at (standardized)
```

### 2. **Enhanced Middleware**
```typescript
// Authentication with roles
authenticate(req, res, next)  // Requires valid token
authorize(['ADMIN'])          // Role-based access
authenticateOptional()        // Optional authentication
```

### 3. **Service Layer Organization**
Services are organized by domain:
- `auth.service.ts` - Authentication, passwords, tokens
- `db.service.ts` - Database operations for all entities
- `email.service.ts` - Email notifications
- `ai.service.ts` - AI-powered suggestions

### 4. **Controller Organization**
Controllers handle HTTP requests and delegate to services:
- `auth.controller.ts` - All auth endpoints (Google, email/password)
- `ticket.controller.ts` - Ticket management
- `request.controller.ts` - Request submission and tracking
- `adminticket.controller.ts` - Admin-specific operations

### 5. **Route Organization**
Clean, modular routes with proper authentication/authorization:
```
/api/auth/         - Authentication
/api/requests/     - Request submission & tracking
/api/tickets/      - Ticket operations
/api/admin/        - Admin operations
```

## Database Schema Evolution

### New/Enhanced Models:
```prisma
User                // Enhanced with more fields
OAuthToken          // OAuth token storage
Ticket              // Enhanced with all fields
Request             // Full implementation
TicketAssignment    // Assignment management
Follower            // User followers
Comment             // Public & internal
StatusHistory       // Status audit trail
AssignmentHistory   // Assignment audit trail
TicketRequest       // Request linking
AssigneeScope       // Scope management
Notification        // User notifications
```

## Authentication Flow

### Option 1: Google OAuth
```
User → Frontend → Backend
          ↓
    Verify with Google
          ↓
    Create/Update User
          ↓
    Generate JWT Token
          ↓
    Return Token to Frontend
```

### Option 2: Email/Password
```
User Registration
    ↓
Hash password with bcrypt
    ↓
Store in database
    ↓
Return JWT token
    ↓
User can login with email/password
```

### Development Mode
```
AUTH_MODE=DEV
    ↓
Bypass Google verification
    ↓
Create test users (admin@test.com or user@test.com)
    ↓
Generate tokens automatically
```

## API Endpoint Comparison

### Authentication
| Operation | Old Express | Old TypeScript | Merged |
|-----------|------------|----------------|--------|
| Google Login | ✅ | ❌ | ✅ |
| Email Login | ❌ | ✅ | ✅ |
| Register | ❌ | ✅ | ✅ |
| Get User Info | ✅ | ❌ | ✅ |

### Tickets
| Operation | Old Express | Old TypeScript | Merged |
|-----------|------------|----------------|--------|
| Get Draft Tickets | ❌ | ✅ | ✅ |
| Edit Draft | ❌ | ✅ | ✅ |
| Update Status | ✅ | ❌ | ✅ |
| Add Comments | ❌ | ✅ | ✅ |
| Assign Tickets | ❌ | ✅ | ✅ |

### Requests
| Operation | Old Express | Old TypeScript | Merged |
|-----------|------------|----------------|--------|
| Submit Request | ❌ | ✅ | ✅ |
| Track Request | ❌ | ✅ | ✅ |
| Get All Requests | ❌ | ✅ | ✅ |

### Admin Features
| Feature | Old Express | Old TypeScript | Merged |
|---------|------------|----------------|--------|
| Approve Drafts | ✅ | ❌ | ✅ |
| Manage Assignees | ❌ | ✅ | ✅ |
| View Statistics | ❌ | ✅ | ✅ |
| Manage Notifications | ❌ | ✅ | ✅ |

## TypeScript Improvements

### Type Safety
```typescript
// Interfaces for API responses
export interface AuthResponse {
  token: string;
  user: { user_id: number; email: string; role: string }
}

// Enums for constants
export enum TicketStatus {
  Draft = "Draft",
  New = "New",
  Assigned = "Assigned",
  // ... etc
}

// Typed middleware
export interface AuthPayload {
  user_id: number;
  email: string;
  role: "USER" | "ASSIGNEE" | "ADMIN";
}
```

### Strong Types
- Request/Response types are properly typed
- Database entities have full type definitions via Prisma
- Middleware augments Express Request with user data

## Configuration Management

### Environment Variables
```env
# Core
DATABASE_URL          # PostgreSQL connection
JWT_SECRET            # JWT signing key
PORT                  # Server port
NODE_ENV              # Environment

# Google OAuth
GOOGLE_CLIENT_ID      # OAuth client ID
GOOGLE_CLIENT_SECRET  # OAuth secret

# Email
EMAIL_SERVICE         # Email provider
EMAIL_USER            # Email account
EMAIL_PASSWORD        # Email password
FRONTEND_URL          # Frontend URL for links

# Development
AUTH_MODE             # DEV or PRODUCTION
DEV_ROLE              # Default role in dev
```

## Migration Path

### If you were using `backend-expressjs`:
1. Update any routes that reference `adminticket.route` (now supports full admin features)
2. Enjoy new email services, user management, and request tracking
3. Update frontend to handle new endpoints for email/password auth

### If you were using `backend-old-typescript`:
1. Update Google OAuth endpoints (now fully supported)
2. Update field naming to use snake_case consistently
3. Update any custom route references (consolidated routes)
4. Enjoy AI-powered ticket suggestions

## Code Quality Features

✅ **Error Handling**
- Try/catch blocks with meaningful error messages
- Proper HTTP status codes
- Validation before operations

✅ **Performance**
- Database indexes on frequently queried fields
- Efficient query patterns via Prisma
- Optional fields for flexibility

✅ **Security**
- Password hashing with bcrypt (10 salt rounds)
- JWT token verification
- Google OAuth verification
- Role-based access control
- Email validation

✅ **Maintainability**
- Service layer separation of concerns
- Consistent naming conventions
- Comprehensive documentation
- Type safety throughout

## Testing Checklist

- [ ] Test Google OAuth login
- [ ] Test email/password registration
- [ ] Test email/password login
- [ ] Test request submission
- [ ] Test request tracking
- [ ] Test ticket creation and status updates
- [ ] Test comments (public and internal)
- [ ] Test ticket assignments
- [ ] Test admin approvals
- [ ] Test email notifications
- [ ] Test role-based access control
- [ ] Test development mode with test users

## Running the Merged Backend

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run prisma:migrate
npm run prisma:generate

# Start development
npm run dev

# Build for production
npm run build
npm run start:prod
```

## Summary

The merged backend combines the best of both implementations:
- **Modern authentication** (Google OAuth + Email/Password)
- **Comprehensive features** (All original features preserved)
- **Professional architecture** (Clean separation of concerns)
- **TypeScript safety** (Full type definitions)
- **Production ready** (Error handling, validation, logging)

This is now a single, unified codebase that's easier to maintain, extend, and deploy.
