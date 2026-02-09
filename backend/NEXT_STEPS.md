# Next Steps - After Merge

## 📋 Immediate Actions Required

### 1. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your actual values:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (random secret key)
# - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - EMAIL credentials
# - Frontend URL
```

### 2. Dependency Installation
```bash
# Install all dependencies
npm install

# Or with pnpm
pnpm install
```

### 3. Database Setup
```bash
# Create initial migration
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# (Optional) View database with UI
npm run prisma:studio
```

### 4. Start Development
```bash
# Run development server with auto-reload
npm run dev

# Or build and start production
npm run build
npm start
```

### 5. Verify API is Running
```bash
# Check health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"2026-02-09T..."}
```

## 🔧 Configuration Checklist

### Authentication Setup
- [ ] Set JWT_SECRET to a strong random string
- [ ] For Google OAuth:
  - [ ] Register app at Google Cloud Console
  - [ ] Get GOOGLE_CLIENT_ID
  - [ ] Get GOOGLE_CLIENT_SECRET
  - [ ] Configure redirect URIs
- [ ] For email/password auth:
  - [ ] Verify JWT_SECRET is set
  - [ ] Test registration endpoint
  - [ ] Test login endpoint

### Email Configuration
- [ ] Set EMAIL_SERVICE (gmail, outlook, etc.)
- [ ] Set EMAIL_USER (sender email)
- [ ] Set EMAIL_PASSWORD (app password for gmail)
- [ ] Set FRONTEND_URL (for email links)
- [ ] Test sending confirmation email

### Database Configuration
- [ ] Ensure PostgreSQL is running
- [ ] Create database named "ceivoice_db" (or desired name)
- [ ] Update DATABASE_URL in .env
- [ ] Run migrations: `npm run prisma:migrate`
- [ ] Verify tables created: `npm run prisma:studio`

## 🧪 Testing the API

### Test Authentication
```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# You should get a token back - save it for other requests
```

### Test Protected Endpoint
```bash
# Get current user (use token from registration)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Request Submission
```bash
# Submit a request (public endpoint)
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "message": "I am experiencing an issue"
  }'

# Save the tracking_id for tracking
```

## 📝 Common Issues & Solutions

### Issue: "Cannot find module 'express'"
**Solution**: Run `npm install`

### Issue: "Database connection failed"
**Solution**: 
1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Ensure database exists

### Issue: "Prisma client not generated"
**Solution**: Run `npm run prisma:generate`

### Issue: "Port 5000 already in use"
**Solution**: 
```bash
PORT=5001 npm run dev
```

### Issue: "JWT errors"
**Solution**: 
1. Check JWT_SECRET is set in .env
2. Ensure token hasn't expired (7 days)
3. Verify token format: "Bearer TOKEN_HERE"

## 🚀 Deployment Preparation

### For Production Deployment:
1. [ ] Set NODE_ENV=production in .env
2. [ ] Set AUTH_MODE=PRODUCTION (not DEV)
3. [ ] Use strong JWT_SECRET
4. [ ] Configure proper GOOGLE_CLIENT_ID/SECRET
5. [ ] Set up email with production credentials
6. [ ] Use production PostgreSQL database
7. [ ] Set proper FRONTEND_URL
8. [ ] Run `npm run build`
9. [ ] Test with `npm start`

### Environment Variables for Production
```env
NODE_ENV=production
AUTH_MODE=PRODUCTION
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/ceivoice_prod
JWT_SECRET=your-very-strong-secret-key-minimum-32-chars
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-secret
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-app-specific-password
FRONTEND_URL=https://yourdomain.com
PORT=5000
```

## 📚 Documentation Files

Inside the backend folder, you'll find:
- **README.md** - Complete API documentation and setup guide
- **IMPLEMENTATION_SUMMARY.md** - What was merged and how
- **MERGE_GUIDE.md** - Detailed merge information
- **.env.example** - Environment variables template

In the root ceivoice-api folder:
- **MERGE_GUIDE.md** - High-level merge overview

## 🔄 Continuous Development

### When Adding Features:
1. Create Prisma schema changes
2. Create migration: `npm run prisma:migrate`
3. Update services with new DB operations
4. Create/update controllers
5. Create/update routes
6. Add authentication/authorization as needed
7. Test endpoints

### Code Quality Standards:
- Use TypeScript for type safety
- Add proper error handling
- Validate all inputs
- Use async/await patterns
- Keep services lean
- Document complex logic
- Add JSDoc comments

## 📊 Database Validation

After setup, verify your database has these tables:
```
users
oauth_tokens
requests
tickets
categories
ticket_assignments
followers
comments
status_histories
assignment_histories
ticket_requests
assignee_scopes
notifications
```

Use Prisma Studio to view:
```bash
npm run prisma:studio
# Opens http://localhost:5555
```

## 🎯 Next Features to Implement

Consider implementing:
1. [ ] Pagination for list endpoints
2. [ ] Search functionality
3. [ ] Advanced filtering
4. [ ] Rate limiting
5. [ ] Request logging
6. [ ] Error monitoring (Sentry)
7. [ ] API versioning
8. [ ] WebSocket for real-time updates
9. [ ] File attachments
10. [ ] Advanced analytics

## 📞 Support Resources

- **Express.js Documentation**: https://expressjs.com
- **TypeScript Documentation**: https://www.typescriptlang.org
- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs
- **Google OAuth**: https://developers.google.com/identity

## ✅ Final Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Authentication endpoints work
- [ ] Email service configured (if needed)
- [ ] Frontend can connect to backend
- [ ] All tests passing
- [ ] Ready for deployment

## 🎉 You're Ready!

The merged backend is now ready for:
- Local development
- Feature implementation
- Integration testing
- Production deployment

Happy coding! 🚀
