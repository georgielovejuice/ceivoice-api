# Quick Reference Guide

## Common Commands

```bash
# Development
npm run dev                          # Start with auto-reload
npm run build                        # Compile TypeScript
npm start                            # Run compiled version

# Database
npx prisma studio                    # Open database UI
npx prisma migrate dev --name name   # Create migration
npx prisma migrate deploy            # Apply migrations
npx prisma generate                  # Regenerate Prisma client

# Dependencies
npm install                          # Install all packages
npm update                           # Update packages
```

## Environment Setup

```bash
# Copy template
cp .env.example .env

# Required variables
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-secret-key
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app-password
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## API Base URL
```
http://localhost:5000/api
```

## Authentication

### Get JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User"}'
```

### Use Token in Requests
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

## Example Workflows

### 1. Submit Request → Track → Update Status

```bash
# 1. Submit request
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","message":"Help!"}'
# Response: ticket_id=1, tracking_id="abc-123"

# 2. Track request (no auth needed)
curl http://localhost:5000/api/requests/track/abc-123

# 3. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","name":"Admin"}'
# Response: token="eyJ..."

# 4. Get draft tickets
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:5000/api/tickets/drafts

# 5. Edit draft ticket
curl -X PUT http://localhost:5000/api/tickets/drafts/1 \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"title":"New Title","summary":"Summary"}'

# 6. Submit draft
curl -X POST http://localhost:5000/api/tickets/1/submit \
  -H "Authorization: Bearer eyJ..."

# 7. Assign ticket
curl -X POST http://localhost:5000/api/tickets/1/reassign \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"assignee_ids":[2],"user_id":1}'

# 8. Update status
curl -X POST http://localhost:5000/api/tickets/1/status \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"new_status":"Solving","user_id":2}'
```

### 2. Manage Assignees

```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","name":"Admin"}' \
  | jq -r '.token')

# Make user an assignee
curl -X POST http://localhost:5000/api/admin/assignees/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"is_assignee":true}'

# Assign scope
curl -X POST http://localhost:5000/api/admin/assignees/scope \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"scope_name":"IT"}'

# View metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/reports/assignee/2
```

### 3. Comment & Collaborate

```bash
# Add comment
curl -X POST http://localhost:5000/api/tickets/1/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":2,"content":"Working on this","is_internal":false}'

# Get comments
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/tickets/1/comments

# Get participants
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/tickets/1/participants
```

## File Locations

### Source Code
- Controllers: `src/controllers/*.controller.ts`
- Services: `src/services/*.service.ts`
- Routes: `src/routes/*.routes.ts`
- Middleware: `src/middlewares/`
- Entry: `src/server.ts`, `src/app.ts`

### Configuration
- Environment: `.env` (create from `.env.example`)
- Database: `prisma/schema.prisma`
- TypeScript: `tsconfig.json`
- Dependencies: `package.json`

### Documentation
- Setup: `SETUP.md`
- API Docs: `API_DOCUMENTATION.md`
- Summary: `IMPLEMENTATION_SUMMARY.md`
- Postman: `CeiVoice_API.postman_collection.json`

## Troubleshooting

### Port 5000 Already in Use
```bash
# Change in .env
PORT=5001

# Or kill process (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Failed
```bash
# Test connection
psql postgresql://user:pass@localhost:5432/dbname

# Or check .env DATABASE_URL
echo $DATABASE_URL
```

### Email Not Sending
- Check Gmail app-specific password is used (not account password)
- Verify EMAIL_USER and EMAIL_PASSWORD in .env
- Check 2FA is enabled on Gmail account

### Prisma Client Issues
```bash
npx prisma generate
npx prisma db push
```

## Status Codes

```
200 OK                    - Success
201 Created              - Resource created
400 Bad Request          - Validation error
401 Unauthorized         - No token provided
403 Forbidden            - Invalid token
404 Not Found            - Resource not found
500 Internal Server Error - Server error
```

## Common Response Format

### Success
```json
{
  "message": "Operation successful",
  "data": {}
}
```

### Error
```json
{
  "error": "Error description"
}
```

## Valid Status Values

```
Draft       - Initial state
New         - Submitted for processing
Assigned    - Assigned to person
Solving     - Being worked on
Solved      - Completed
Failed      - Could not resolve
Renew       - Reopened
```

## Valid Status Transitions

```
Draft    → New
New      → Assigned, Renew
Assigned → Solving, Renew
Solving  → Solved, Failed, Renew
Solved   → Renew
Failed   → Renew
Renew    → New
```

## Default Values

```
Status:      Draft
Role:        USER
Is Assignee: false
Is Internal: false (for comments)
```

## Field Limits

```
Title:       100 characters max
Summary:     500 characters max
Message:     No limit
Email:       Must be valid format
```

## Important Notes

- All timestamps are in UTC
- JWT tokens expire after 24 hours
- Tracking links work without authentication
- Internal comments only visible to assignees
- Deletion creates history record (audit trail)
- Multiple assignees are supported per ticket

## Performance Tips

- Use index filters (status, deadline)
- Paginate large result sets
- Cache frequently accessed data
- Use async operations (emails)
- Monitor database query performance

## Security Reminders

1. Never commit .env file
2. Use strong JWT_SECRET in production
3. Keep dependencies updated
4. Use HTTPS in production
5. Validate all inputs
6. Use parameterized queries (Prisma handles this)
7. Monitor for SQL injection (Prisma prevents this)
8. Rotate OAuth tokens regularly

## Testing Checklist

- [ ] Submit request endpoint
- [ ] Track request by ID
- [ ] Google OAuth flow
- [ ] Email login
- [ ] Get draft tickets
- [ ] Edit draft
- [ ] Submit draft to new
- [ ] Assign ticket
- [ ] Update status
- [ ] Add comment
- [ ] Get participants
- [ ] Admin dashboard
- [ ] Assignee metrics
- [ ] Audit trail

## Additional Resources

- **API Docs**: See `API_DOCUMENTATION.md`
- **Setup Guide**: See `SETUP.md`
- **Postman Collection**: Import `CeiVoice_API.postman_collection.json`
- **Database**: Run `npx prisma studio`
- **TypeScript**: Check `tsconfig.json`
