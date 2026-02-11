# Authentication Flows Testing Guide

## Overview

This document provides step-by-step instructions to test all authentication flows in the CeiVoice API.

**Prerequisites:**
- Node.js server running on `http://localhost:5000`
- Backend database configured and connected
- JWT secret configured in `.env`

## Starting the Server

```bash
cd backend
pnpm install
cp .env.example .env
# Edit .env with your actual credentials
pnpm run dev
```

The server should start on `http://localhost:5000`.

## Test 1: User Registration

### Objective
Register a new user with email and password, receive access and refresh tokens.

### Command

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test.user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

### Expected Response (200 OK)

```json
{
  "message": "User registered successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test.user@example.com",
    "name": "Test User",
    "role": "USER"
  }
}
```

### What to Verify

- [ ] Status code is 200
- [ ] `accessToken` is present and is a JWT (3 parts separated by dots)
- [ ] `refreshToken` is present and is a JWT
- [ ] User profile includes email, name, and role
- [ ] No password is returned in response
- [ ] Tokens contain proper claims (user_id, email, role, iat, exp)

### Failure Cases

**Duplicate Email:**
```bash
# Register same email again - should fail
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User 2",
    "email": "test.user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'
```

Expected: `409 Conflict` or `400 Bad Request` with error message about duplicate email.

**Password Mismatch:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test.user2@example.com",
    "password": "Password123!",
    "confirmPassword": "DifferentPassword!"
  }'
```

Expected: `400 Bad Request` with error about password mismatch.

---

## Test 2: User Login

### Objective
Login with registered email and password, receive new tokens.

### Command

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "Password123!"
  }'
```

### Expected Response (200 OK)

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test.user@example.com",
    "name": "Test User",
    "role": "USER"
  }
}
```

### What to Verify

- [ ] Status code is 200
- [ ] New `accessToken` is issued (may be different from registration)
- [ ] New `refreshToken` is issued
- [ ] User information is returned
- [ ] Tokens are valid JWTs

### Failure Cases

**Wrong Password:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@example.com",
    "password": "WrongPassword!"
  }'
```

Expected: `401 Unauthorized` with message "Invalid credentials" or "Incorrect password".

**Non-existent Email:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "Password123!"
  }'
```

Expected: `401 Unauthorized` with message "User not found" or "Invalid credentials".

---

## Test 3: Get User Profile (Protected Route)

### Objective
Access protected endpoint using Bearer token authentication.

### Command

```bash
# Replace TOKEN_HERE with actual access token from login
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Expected Response (200 OK)

```json
{
  "user": {
    "user_id": 1,
    "email": "test.user@example.com",
    "name": "Test User",
    "role": "USER"
  }
}
```

### What to Verify

- [ ] Status code is 200
- [ ] User profile is returned
- [ ] Token was successfully validated
- [ ] User data matches registration/login

### Failure Cases

**No Token:**
```bash
curl -X GET http://localhost:5000/api/auth/me
```

Expected: `401 Unauthorized` with message "Missing token" or "No authentication".

**Invalid Token:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

Expected: `401 Unauthorized` with message "Invalid token" or "Token verification failed".

**Expired Token:** (After 7 days, or manually modify token to have past expiry)

Expected: `401 Unauthorized` with message "Token expired".

---

## Test 4: Token Refresh

### Objective
Use refresh token to get a new access token without re-authenticating.

### Command

```bash
# Use refreshToken from login response
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Expected Response (200 OK)

```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "test.user@example.com",
    "name": "Test User",
    "role": "USER"
  }
}
```

### What to Verify

- [ ] Status code is 200
- [ ] New `accessToken` is issued
- [ ] New token is different from old one (timestamps differ)
- [ ] User information is returned
- [ ] New token has updated `iat` (issued at) claim
- [ ] New token has same `exp` duration (7 days from now)

### Failure Cases

**No Refresh Token:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": ""
  }'
```

Expected: `400 Bad Request` with error message.

**Invalid Refresh Token:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid.token.here"
  }'
```

Expected: `401 Unauthorized` with message "Invalid refresh token".

**Expired Refresh Token:** (After 30 days)

Expected: `401 Unauthorized` with message "Refresh token expired".

---

## Test 5: JWT Token Claims Verification

### Objective
Verify that JWT tokens contain the correct claims.

### How to Decode JWT

Go to [jwt.io](https://jwt.io) and paste the token in the "Encoded" section.

### Expected Claims in Access Token

```json
{
  "user_id": 1,
  "email": "test.user@example.com",
  "role": "USER",
  "iss": "ceivoice-api",          // Issuer
  "aud": "ceivoice-clients",      // Audience
  "iat": 1704067200,              // Issued at timestamp
  "exp": 1704672000,              // Expiration timestamp (7 days later)
  "alg": "HS256"
}
```

### Expected Claims in Refresh Token

```json
{
  "user_id": 1,
  "email": "test.user@example.com",
  "role": "USER",
  "iss": "ceivoice-api",          // Issuer
  "aud": "ceivoice-clients",      // Audience
  "iat": 1704067200,              // Issued at timestamp
  "exp": 1706745600,              // Expiration timestamp (30 days later)
  "alg": "HS256"
}
```

### What to Verify

- [ ] `user_id` is a number and matches database user
- [ ] `email` matches the user's email
- [ ] `role` is one of: USER, ASSIGNEE, ADMIN
- [ ] `iss` is "ceivoice-api"
- [ ] `aud` is "ceivoice-clients"
- [ ] `iat` is reasonable Unix timestamp
- [ ] `exp` is iat + 7 days (access) or iat + 30 days (refresh)
- [ ] Token is signed with HS256 algorithm

---

## Test 6: Google OAuth Flow

### Objective
Test Google OAuth 2.0 authentication flow (initiation and callback).

### Step 1: Initiate OAuth

```bash
curl -X GET http://localhost:5000/api/auth/google \
  -H "Accept: text/html" \
  -v
```

### Expected Response

**Status:** `302 Found` (redirect)  
**Location Header:** Should redirect to Google login page

```
Location: https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&...
```

### What to Verify

- [ ] Status is 302 (redirect)
- [ ] Location header points to Google OAuth endpoint
- [ ] Contains `client_id` from environment
- [ ] Contains `scope=profile email`
- [ ] Contains `redirect_uri` pointing back to your app

### Step 2: User Authentication

1. Follow the redirect to Google
2. Log in with Google account
3. Accept permissions
4. You'll be redirected to callback URL

### Step 3: Callback (Automatic)

The OAuth callback is handled automatically. You should receive:

```json
{
  "message": "OAuth login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "user@gmail.com",
    "name": "User Name",
    "role": "USER"
  }
}
```

### What to Verify

- [ ] Redirect is successful
- [ ] Tokens are returned
- [ ] User profile is created/found
- [ ] User can access protected routes with returned token

---

## Test 7: Token Validation with Different Scenarios

### Scenario 1: Modified Token

```bash
# Take a valid token and change one character
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MODIFIED.signature"
```

Expected: `401 Unauthorized` - Signature verification should fail.

### Scenario 2: Token from Different Secret

If JWT was signed with a different secret, should fail verification.

Expected: `401 Unauthorized`.

### Scenario 3: Correct Format, Wrong Issuer

Token must have `iss: "ceivoice-api"`.

Expected: `401 Unauthorized` if issuer doesn't match.

---

## Test 8: Logout (If Implemented)

### Command

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Expected Response

```json
{
  "message": "Logout successful"
}
```

### What to Verify

- [ ] Status code is 200
- [ ] Logout succeeds with valid token
- [ ] After logout, token might be blacklisted (depends on implementation)

---

## Automated Test Results Summary

Create a test results file with the following template:

```markdown
# Test Results - [Date]

## Test Environment
- Server URL: http://localhost:5000
- Database: [Connected/Failed]
- Node Version: [v16+]

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Registration | PASS/FAIL | |
| Login | PASS/FAIL | |
| Get Profile | PASS/FAIL | |
| Token Refresh | PASS/FAIL | |
| JWT Claims | PASS/FAIL | |
| Google OAuth | PASS/FAIL | |
| Token Validation | PASS/FAIL | |
| Logout | PASS/FAIL | |

## Issues Found
- [List any issues]

## Next Steps
- [List any recommended fixes]
```

---

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 500 Server Error | Server not running or DB error | Check server logs, verify database connection |
| CORS error | Frontend on different port | Check CORS_ORIGIN in .env |
| 401 Unauthorized | Invalid/missing token | Ensure token is included and valid |
| Token expired | Token older than 7 days | Use refresh endpoint to get new token |
| Connection refused | Server not listening | Start server with `pnpm run dev` |

---

## Next Steps

After successful testing:

1. **Deploy to production** with strong JWT secret
2. **Add token blacklist** for logout functionality
3. **Implement email verification** for new accounts
4. **Add rate limiting** to prevent brute force
5. **Monitor token usage** for security
6. **Implement 2FA** for additional security


