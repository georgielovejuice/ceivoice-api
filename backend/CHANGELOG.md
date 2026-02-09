# Changelog

All notable changes to this project are documented here.

## [2.0.0] - February 10, 2026

### Major Updates

#### Authentication System Overhaul
- Integrated **Passport.js** for production-grade authentication
- Implemented **JWT Bearer tokens** with access/refresh token strategy
- Added **Google OAuth 2.0** authentication with account linking
- Implemented **bcryptjs** password hashing (10 salt rounds)
- Token strategy: 7-day access tokens, 30-day refresh tokens

#### New Files Created
- `src/config/environment.ts` - Centralized configuration management
- `src/config/passport.ts` - Passport strategies (JWT, Local, Google)
- Updated `src/services/auth.service.ts` - New token & auth methods
- Updated `src/middlewares/auth.middleware.ts` - Passport middleware
- Updated `src/controllers/auth.controller.ts` - New endpoints
- Updated `src/routes/auth.route.ts` - Refactored routes
- Updated `src/app.ts` - Passport initialization

#### API Improvements
- New endpoint: `POST /api/auth/refresh` - Token refresh
- New endpoint: `GET /api/auth/google` - Google OAuth initiation
- New endpoint: `GET /api/auth/google/callback` - OAuth callback
- Updated endpoint: `POST /api/auth/login` - Returns access + refresh tokens
- Updated endpoint: `POST /api/auth/register` - Returns access + refresh tokens
- Backward compatible with existing endpoints

#### Documentation
- Created `README.md` - Concise project overview (clean format)
- Created `QUICK_REFERENCE.md` - Auth quick reference guide
- Created `AUTH_IMPLEMENTATION.md` - Detailed authentication guide
- Consolidated documentation (removed 5 redundant files)

### Security Enhancements
- Production-grade token validation with issuer/audience claims
- Role-based access control (ADMIN, ASSIGNEE, USER)
- Standard Bearer token authentication
- HTTPS ready with CORS configuration
- Environment-based configuration management

### Backward Compatibility
- All existing endpoints remain functional
- Tracking token functionality preserved
- User management utilities available
- Database schema unchanged
- No migrations required for existing data

### Documentation Cleanup
**Removed redundant files:**
- FINAL_SUMMARY.md
- FILE_MANIFEST.md
- IMPLEMENTATION_SUMMARY.md
- NEXT_STEPS.md
- PASSPORT_INTEGRATION_SUMMARY.md

**Kept essential documentation:**
- README.md (project overview & quick start)
- QUICK_REFERENCE.md (auth quick lookup)
- AUTH_IMPLEMENTATION.md (detailed auth guide)
- CHANGELOG.md (this file)

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

See [README.md](README.md) for quick start guide.

For authentication details, see:
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick lookup
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Detailed guide

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

- **v2.0.0** - Passport.js integration (Feb 10, 2026)
- **v1.0.0** - Initial release (Dec 2025)
