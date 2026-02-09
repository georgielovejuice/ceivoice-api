# Passport.js Authentication - Quick Reference

## Files Created/Modified

### Created Files
- ✅ `src/config/environment.ts` - Configuration management
- ✅ `src/config/passport.ts` - Passport strategies
- ✅ `AUTH_IMPLEMENTATION.md` - Full documentation
- ✅ `PASSPORT_INTEGRATION_SUMMARY.md` - Implementation summary

### Modified Files
- ✅ `src/app.ts` - Passport initialization
- ✅ `src/services/auth.service.ts` - New auth methods
- ✅ `src/middlewares/auth.middleware.ts` - Passport middleware
- ✅ `src/controllers/auth.controller.ts` - New endpoints
- ✅ `src/routes/auth.route.ts` - Updated routes
- ✅ `.env.example` - Updated configuration template

## API Endpoints

### Public Endpoints

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/api/auth/register` | email, password, confirmPassword, fullName | accessToken, refreshToken, user |
| POST | `/api/auth/login` | email, password | accessToken, refreshToken, user |
| POST | `/api/auth/refresh` | refreshToken | accessToken, user |
| GET | `/api/auth/google` | - | Redirect to Google |
| GET | `/api/auth/google/callback` | - | Redirect with user data |

### Protected Endpoints (Require: `Authorization: Bearer <token>`)

| Method | Endpoint | Returns | Notes |
|--------|----------|---------|-------|
| GET | `/api/auth/me` | user profile | Requires valid access token |
| POST | `/api/auth/logout` | success message | Optional - client-side logout |

## Using in Routes

### Example: Protected Route
```typescript
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import * as controller from "../controllers/mycontroller";

const router = Router();

// Require authentication
router.get("/my-data", authenticate, controller.getMyData);

// Require specific role
router.delete("/user/:id", authenticate, authorize(["ADMIN"]), controller.deleteUser);

// Admin only
router.post("/admin-action", authenticate, requireAdmin, controller.adminAction);

export default router;
```

### Accessing User in Controller
```typescript
export const myHandler = async (req: Request, res: Response) => {
  // User info available after authenticate middleware
  const userId = (req.user as any).user_id;
  const email = (req.user as any).email;
  const role = (req.user as any).role;
  
  // Your code here
};
```

## Token Usage

### Client-Side Storage (JavaScript)
```javascript
// After login/register
const { accessToken, refreshToken } = response;

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Use in API calls
const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Refresh token
const newTokens = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});
```

## Configuration

### Required Environment Variables
```env
JWT_SECRET=your-strong-secret-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Optional Environment Variables
```env
JWT_ACCESS_TOKEN_EXPIRY=7d        # Default: 7 days
JWT_REFRESH_TOKEN_EXPIRY=30d      # Default: 30 days
NODE_ENV=development              # Default: development
PORT=5000                         # Default: 5000
CORS_ORIGIN=*                     # Default: * (all origins)
```

## Key Features

| Feature | Status | Details |
|---------|--------|---------|
| Email/Password Auth | ✅ | With bcryptjs hashing |
| Google OAuth | ✅ | With account linking |
| JWT Tokens | ✅ | Access + Refresh tokens |
| Token Refresh | ✅ | Automatic token refresh |
| Role-Based Access | ✅ | ADMIN, ASSIGNEE, USER |
| Password Validation | ✅ | Min 6 characters |
| Email Validation | ✅ | Standard email format |
| Error Handling | ✅ | Comprehensive errors |
| Type Safety | ✅ | Full TypeScript support |

## Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "confirmPassword": "test123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### Get Current User
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5000/api/auth/me
```

### Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## Security Checklist

- [ ] JWT_SECRET is strong (min 32 chars)
- [ ] HTTPS enabled in production
- [ ] CORS configured for production domain
- [ ] Google OAuth credentials set
- [ ] Tokens stored securely on client (httpOnly cookies)
- [ ] Token refresh implemented on client
- [ ] Error messages don't leak sensitive data
- [ ] Rate limiting on auth endpoints
- [ ] Monitoring and logging configured
- [ ] Database backups configured

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No token provided | Include `Authorization: Bearer <token>` header |
| 401 Invalid token | Token expired or invalid | Refresh token using `/api/auth/refresh` |
| 403 Forbidden | Wrong role | Check user role in database |
| 400 Invalid email | Bad email format | Verify email format |
| 400 Passwords don't match | Registration error | Ensure password fields match |

## Next Steps

1. **Test Endpoints**
   - [ ] Test user registration
   - [ ] Test user login
   - [ ] Test token refresh
   - [ ] Test protected routes

2. **Frontend Integration**
   - [ ] Store tokens securely
   - [ ] Implement token refresh
   - [ ] Handle token expiry
   - [ ] Update all API calls

3. **Production Setup**
   - [ ] Set JWT_SECRET
   - [ ] Configure Google OAuth
   - [ ] Enable HTTPS
   - [ ] Set CORS_ORIGIN
   - [ ] Configure monitoring

4. **Optional Enhancements**
   - [ ] Email verification
   - [ ] Account lockout
   - [ ] Two-factor auth
   - [ ] Token blacklist

---

For detailed information, see `AUTH_IMPLEMENTATION.md`
