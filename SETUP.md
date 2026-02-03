# Setup Guide

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database connection string
- JWT secret
- Email service credentials (Gmail)
- Google OAuth credentials
- Frontend URL

### 3. Setup Database

#### Create PostgreSQL Database
```bash
# Using psql
createdb ceivoice_backend
```

#### Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run all migrations
npx prisma migrate deploy
```

### 4. Start Server
```bash
npm run dev
```

Server will start on port defined in `.env` (default: 5000)

## Environment Variables Explained

### DATABASE_URL
PostgreSQL connection string. Format:
```
postgresql://username:password@host:port/database_name
```

Example:
```
postgresql://postgres:password@localhost:5432/ceivoice_backend
```

### JWT_SECRET
Secret key for signing JWT tokens. Use a strong random string in production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Email Configuration
Required for sending confirmation and notification emails:
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate app-specific password: https://myaccount.google.com/apppasswords
3. Use the generated password in EMAIL_PASSWORD

### Google OAuth
Get credentials from: https://console.cloud.google.com/

1. Create a new OAuth 2.0 Web Application
2. Set authorized redirect URI to: `http://localhost:5000/api/auth/google/callback`
3. Copy Client ID and Client Secret to `.env`

### FRONTEND_URL
URL of your frontend application. Used for email links:
```
http://localhost:3000
```

For production, use your domain.

## Database Schema Initialization

The Prisma schema includes all required tables:
- Users
- Requests
- Tickets
- Categories
- Comments
- StatusHistory
- TicketAssignment
- Follower
- AssignmentHistory
- AssigneeScope
- Notification
- OAuthToken

Run `npx prisma migrate deploy` to create all tables.

## Development Workflow

### View Database
```bash
npx prisma studio
```
Opens interactive database viewer at http://localhost:5555

### Create New Migration
```bash
npx prisma migrate dev --name descriptive_migration_name
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

## Testing the API

### 1. Submit a Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "message": "This is my issue"
  }'
```

Response:
```json
{
  "message": "Request submitted successfully",
  "ticket_id": 1,
  "tracking_id": "abc-123-def",
  "status": "Draft"
}
```

### 2. Track Request
```bash
curl http://localhost:5000/api/requests/track/abc-123-def
```

### 3. Create User (for testing)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "Admin User"
  }'
```

### 4. Edit Draft Ticket
```bash
curl -X PUT http://localhost:5000/api/tickets/drafts/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "New Title",
    "summary": "New Summary"
  }'
```

## Production Deployment

### Before Deploying

1. **Set strong JWT_SECRET**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use secure database**
   - PostgreSQL on managed service (AWS RDS, Azure Database, etc.)
   - Enable SSL/TLS

3. **Configure email service**
   - Use production email account
   - Consider email queue system for scalability

4. **Set up SSL/HTTPS**
   - Use Let's Encrypt or similar
   - Update FRONTEND_URL to https://

5. **Build project**
   ```bash
   npm run build
   ```

### Running in Production

```bash
npm start
```

Set environment:
```bash
NODE_ENV=production npm start
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ceivoice-backend .
docker run -p 5000:5000 --env-file .env ceivoice-backend
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

Or change port in `.env`:
```
PORT=5001
```

### Database Connection Failed
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Check credentials

Test connection:
```bash
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
```

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASSWORD in `.env`
- For Gmail, verify app-specific password is used
- Check email service is not blocking connections
- Check server logs for errors

### Google OAuth Not Working
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check GOOGLE_REDIRECT_URI matches in Google Console
- Ensure application is authorized in Google Cloud

### Prisma Client Issues
Regenerate client:
```bash
npx prisma generate
npx prisma db push
```

## Performance Tuning

### Database Optimization
Indices are already created for:
- email, status, deadline, created_at
- Lookup fields

Monitor slow queries:
```sql
SELECT query, calls, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC;
```

### Caching (Future)
Consider adding Redis for:
- Session caching
- Query result caching
- Rate limiting

### Email Queue (Future)
Use Bull/BullMQ for:
- Async email processing
- Retry logic
- Rate limiting

## Monitoring & Logging

### View Logs
Development:
```bash
npm run dev
```

Production:
- Check application logs
- Monitor error tracking (e.g., Sentry)
- Check email service logs

### Database Monitoring
Use Prisma Studio:
```bash
npx prisma studio
```

Or use PostgreSQL tools:
- pgAdmin
- DBeaver
- Adminer

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env`
3. ✅ Setup database
4. ✅ Run server
5. Start testing with curl or Postman
6. Integrate with frontend
7. Deploy to production

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.
