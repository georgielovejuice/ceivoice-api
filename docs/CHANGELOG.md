# Changelog

All notable changes to this project are documented here.

## [2.1.0] - February 11, 2026

### Email System Implementation
- Integrated Resend API for professional email delivery
- Implemented React Email for component-based email templates
- Added RabbitMQ integration for asynchronous email processing
- Created 4 email templates: Confirmation, Status Change, Comment Notification, Assignment
- Implemented email worker service for background processing
- Added email queue management with auto-requeue

### TypeScript Configuration
- Added JSX support to tsconfig.json for React Email templates
- Improved type definitions for queue service
- Fixed implicit any type issues

### Bug Fixes
- Fixed pnpm lockfile version configuration warnings
- Resolved TypeScript compilation errors with email templates
- Corrected type definitions in RabbitMQ integration

### Documentation Updates
- Consolidated documentation into 2 comprehensive guides
- Updated all documentation to follow professional standards
- Removed deprecated email-specific guides
- Updated SETUP_AND_INSTALLATION.md with complete setup instructions
- Updated IMPLEMENTATION_DETAILS.md with technical architecture

## [2.0.0] - February 10, 2026

### Authentication System
- Integrated Passport.js for production-grade authentication
- Implemented JWT Bearer token authentication
- Added Google OAuth 2.0 integration
- Implemented bcryptjs password hashing (10 salt rounds)
- Token strategy: 7-day access tokens, 30-day refresh tokens

### New Files
- src/config/environment.ts - Centralized configuration
- src/config/passport.ts - Passport authentication strategies
- src/services/email.service.ts - Email delivery service
- src/services/queue.service.ts - RabbitMQ integration
- src/templates/ - React Email components

### API Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User authentication
- POST /api/auth/refresh - Token refresh
- GET /api/auth/me - Get user profile
- GET /api/auth/google - Google OAuth initiation
- GET /api/auth/google/callback - OAuth callback handler

### Database
- PostgreSQL with Prisma ORM
- 12+ tables for comprehensive data modeling
- Automated migration system

### Documentation
- docs/api/README.md - API reference
- docs/QUICK_REFERENCE.md - Authentication reference
- docs/testing/ - Testing documentation
- docs/STATUS.md - Project status

### Security
- Token validation with issuer/audience claims
- Role-based access control (ADMIN, ASSIGNEE, USER)
- Standard Bearer token authentication
- CORS configuration support
- Environment-based secret management

## [1.0.0] - Initial Release

### Core Features
- Express.js server setup
- Basic routing structure
- Database schema with Prisma
- User management
- Ticket management foundation
- `docs/STATUS.md` - Project status

**Removed redundant files:**
- Old root-level .md files moved to organized structure

**Kept essential documentation:**
- Root README.md (project overview)
- Docs folder structure for GitHub visibility

## [1.0.0] - Previous Release

### Features
- Express.js 5.x backend
- Prisma ORM with PostgreSQL
- Ticket management system
- Request submission and tracking
- Email notifications
- AI-powered suggestions
- Admin dashboard features

---

## Getting Started with Latest Version

See [Root README.md](../../README.md) for quick start guide.

For authentication details, see:
- [api/README.md](api/README.md) - Complete API reference
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick lookup
- [testing/](testing/) - Testing guides

## Next Steps

1. **Test Authentication**
   - Test user registration
   - Test user login
   - Test token refresh
   - Test protected routes
   - Test Google OAuth flow

2. **Frontend Integration**
   - Store tokens securely
   - Implement token refresh logic
   - Update all API calls with Bearer tokens
   - Handle token expiry gracefully

3. **Production Deployment**
   - Set strong JWT_SECRET
   - Configure Google OAuth credentials
   - Enable HTTPS
   - Set up monitoring
   - Configure rate limiting

## Version History

- **v2.0.0** - Passport.js integration with docs reorganization (Feb 10, 2026)
- **v1.0.0** - Initial release (Dec 2025)

```
