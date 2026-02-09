# CeiVoice API

> A production-ready ticket management system with complete authentication, built with Express.js & Passport.js

## Project Overview

| Component | Status | Version |
|-----------|--------|---------|
| Backend API | ✅ Production Ready | 2.0.0 |
| Authentication | ✅ Passport.js + JWT | Feb 2026 |
| Database | ✅ PostgreSQL + Prisma | 6.x |
| Documentation | ✅ Complete | 4 files |

## Get Started in 2 Minutes

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Server runs on http://localhost:5000

## Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[backend/README.md](backend/README.md)** | API overview & features | 5 min |
| **[backend/QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md)** | Auth quick lookup | 5 min |
| **[backend/AUTH_IMPLEMENTATION.md](backend/AUTH_IMPLEMENTATION.md)** | Detailed auth guide | 15 min |
| **[backend/CHANGELOG.md](backend/CHANGELOG.md)** | What's changed | 5 min |
| **[CHECKPOINT.md](CHECKPOINT.md)** | Project status & next steps | 10 min |

## What You Can Do

### For Users
- **Register** with email/password or Google
- **Login** to access personalized features
- **Submit requests** that auto-create support tickets
- **Track requests** with unique tracking IDs
- **Follow tickets** to get status updates

### For Support Team
- **Manage tickets** through complete lifecycle
- **Assign tickets** to team members
- **Add comments** (public & internal)
- **Set deadlines** and track progress
- **View statistics** and performance metrics

### For Admins
- **Approve drafts** before tickets go live
- **Manage assignees** and their scope
- **View analytics** on ticket metrics
- **Configure system** and manage users

## Authentication

### Two Authentication Methods

**Email/Password**
```bash
POST /api/auth/register
POST /api/auth/login
```

**Google OAuth**
```bash
GET /api/auth/google
GET /api/auth/google/callback
```

### Token Management
```bash
POST /api/auth/refresh        # Get new access token
GET  /api/auth/me             # Get user profile
```

All protected routes use Bearer token authentication:
```
Authorization: Bearer <your_access_token>
```

## Architecture

```
CeiVoice API Backend
├── Passport.js Strategies
│   ├── JWT (Bearer Token)
│   ├── Local (Email/Password)
│   └── Google OAuth 2.0
├── Services Layer
│   ├── Authentication & Tokens
│   ├── Database Operations
│   ├── Email Notifications
│   └── AI Utilities
├── API Routes
│   ├── /api/auth        (7 endpoints)
│   ├── /api/requests    (4 endpoints)
│   ├── /api/tickets     (8+ endpoints)
│   └── /api/admin       (5+ endpoints)
└── PostgreSQL Database
    └── 12 Interconnected Tables
```

## Key Technologies

| Purpose | Technology |
|---------|-----------|
| Web Framework | Express.js 5.x |
| Language | TypeScript 5.x |
| Database | PostgreSQL + Prisma ORM |
| Authentication | Passport.js + JWT + bcryptjs |
| Email | Nodemailer |
| Development | ts-node, nodemon |

## Full Documentation

Detailed information is in the backend folder:
- See [backend/README.md](backend/README.md) for API documentation
- See [backend/QUICK_REFERENCE.md](backend/QUICK_REFERENCE.md) for auth quick reference
- See [CHECKPOINT.md](CHECKPOINT.md) for project status

## API Workflow Example

```
1. User registers
   POST /api/auth/register → Get accessToken + refreshToken

2. User makes request  
   GET /api/auth/me (with Bearer token) → Returns user profile

3. Access token expires (7 days)
   POST /api/auth/refresh (with refreshToken) → Get new accessToken

4. Submit support request
   POST /api/requests → Auto-creates draft ticket

5. Admin approves draft
   POST /api/admin/drafts/:id/approve → Ticket goes live
```

## Development Workflow

### Starting Fresh
```bash
cd backend
npm install
cp .env.example .env           # Configure your .env
npm run prisma:migrate         # Setup database
npm run dev                    # Start development server
```

### Common Commands
```bash
npm run dev              # Start with hot reload
npm run build            # Build for production
npm run prisma:studio    # View/edit database
npm run prisma:migrate   # Run migrations
```

### Making Changes
1. Update routes in `src/routes/*.ts`
2. Add handlers in `src/controllers/*.ts`
3. Implement logic in `src/services/*.ts`
4. Add middleware in `src/middlewares/*.ts` if needed
5. Update database schema in `prisma/schema.prisma` if needed

## Environment Variables

**Minimum required:**
```env
DATABASE_URL=postgresql://user:pass@localhost/ceivoice
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-id
```

**All variables:** See `backend/.env.example`

## Project Statistics

- **API Endpoints**: 25+
- **Database Tables**: 12
- **Authentication Methods**: 3 (Email, Google, JWT)
- **Services**: 4
- **Controllers**: 4
- **Middleware**: 5+

## 📞 Need Help?

1. **Quick answers?** → `backend/QUICK_REFERENCE.md`
2. **Auth details?** → `backend/AUTH_IMPLEMENTATION.md`
3. **API reference?** → `backend/README.md`
4. **Project status?** → `CHECKPOINT.md`

### Latest Changes
- Integrated Passport.js for production authentication
- Added JWT Bearer token strategy
- Google OAuth 2.0 implementation
- Complete token refresh mechanism
- Comprehensive documentation

For full history, see [backend/CHANGELOG.md](backend/CHANGELOG.md)

---

**Start exploring**: `cd backend && npm install && npm run dev`
