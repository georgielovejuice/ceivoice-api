# Authentication Quick Reference

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|-----------------|
| POST | `/api/auth/register` | User registration | None |
| POST | `/api/auth/login` | User login | None |
| POST | `/api/auth/refresh` | Refresh access token | None (requires refresh token) |
| GET | `/api/auth/me` | Get current user profile | Required |
| GET | `/api/auth/google` | Initiate Google OAuth flow | None |
| GET | `/api/auth/google/callback` | Google OAuth callback | None |

### Request/Response Examples

#### Registration

Request:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123",
    "fullName": "John Doe"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": "123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Login

Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "user": {
      "user_id": "123",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Get Current User

Request:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Response:
```json
{
  "status": "success",
  "data": {
    "user_id": "123",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER"
  }
}
```

#### Refresh Token

Request:
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "user_id": "123",
      "email": "user@example.com",
      "role": "USER"
    }
  }
}
```

## Protected Endpoints

All protected endpoints require an `Authorization` header with a valid access token:

```bash
Authorization: Bearer <accessToken>
```

Example:
```bash
curl -X GET http://localhost:5000/api/protected-endpoint \
  -H "Authorization: Bearer eyJhbGc..."
```

## Token Management

### Token Structure

Access Token:
- Expiration: 7 days
- Type: JWT (JSON Web Token)
- Format: `Bearer <token>`

Refresh Token:
- Expiration: 30 days
- Type: JWT (JSON Web Token)
- Used to obtain new access tokens

### Token Refresh Flow

1. User logs in and receives both access and refresh tokens
2. Access token is used for API requests
3. When access token expires, use refresh token to get a new access token
4. If refresh token expires, user must log in again

Example:
```bash
# Initial login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response includes accessToken and refreshToken
# Use accessToken for requests
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"

# When accessToken expires, refresh it
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'
```

## Authentication in Code

### Using in Express Routes

```typescript
import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Route requiring authentication
router.get("/protected", authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Route requiring specific role
router.delete("/user/:id", authenticate, authorize(["ADMIN"]), (req, res) => {
  // Only ADMIN role can access
  res.json({ success: true });
});

export default router;
```

### Accessing User in Controller

```typescript
export const myHandler = async (req: Request, res: Response) => {
  // User info available after authenticate middleware
  const userId = (req.user as any).user_id;
  const email = (req.user as any).email;
  const role = (req.user as any).role;
  
  // Use user information in logic
  res.json({ userId, email, role });
};
```

### Client-Side Token Storage

```javascript
// After login/register
const { accessToken, refreshToken } = response.data;

// Store tokens in localStorage (or sessionStorage)
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);

// Use token in requests
const response = await fetch("/api/protected", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
  }
});

// On token expiration, refresh it
const newTokens = await fetch("/api/auth/refresh", {
  method: "POST",
  body: JSON.stringify({
    refreshToken: localStorage.getItem("refreshToken")
  })
});

// Update stored tokens
localStorage.setItem("accessToken", newTokens.accessToken);
```

## User Roles

The application supports three user roles:

| Role | Permissions | Description |
|------|-------------|-------------|
| USER | Read own data, create requests | Standard user |
| ASSIGNEE | Manage tickets | Support staff |
| ADMIN | Full access | Administrator |

## Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 400 | Invalid credentials | Wrong email/password | Verify credentials |
| 401 | Unauthorized | Missing/invalid token | Include valid auth token |
| 403 | Forbidden | Insufficient permissions | Use account with proper role |
| 422 | Validation error | Invalid request data | Check request format |
| 500 | Server error | Unexpected error | Check server logs |

## Environment Variables

For authentication to work, configure these variables:

```env
JWT_SECRET=your-secret-key-minimum-32-characters
PASSPORT_SECRET=your-passport-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

See `.env.example` for all available options.
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

For detailed information, see [api/README.md](api/README.md)
