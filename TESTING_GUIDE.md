# Testing Guide

## Setup for Testing

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Ensure database is running**:
   ```bash
   # Run migrations if not done
   npx prisma migrate deploy
   ```

3. **Keep variables ready**:
   - User emails for testing
   - JWT tokens after login
   - Tracking IDs from requests
   - Ticket IDs from responses

## Test Scenarios

### Scenario 1: Complete User Journey

#### Step 1: Submit a Request (No auth required)
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "message": "My application keeps crashing when I upload files"
  }'
```

Expected Response:
```json
{
  "message": "Request submitted successfully",
  "ticket_id": 1,
  "tracking_id": "c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7",
  "status": "Draft"
}
```

**Save**: `ticket_id=1`, `tracking_id=c2d3e4f5-g6h7...`

#### Step 2: User Tracks Their Request
```bash
curl http://localhost:5000/api/requests/track/c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7
```

Expected Response: Draft ticket with no comments yet

#### Step 3: Admin Logs In
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "name": "Admin User"
  }'
```

Expected Response:
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 2,
    "email": "admin@company.com",
    "name": "Admin User"
  }
}
```

**Save**: `JWT_TOKEN=eyJhbGc...`

#### Step 4: Admin Views Draft Tickets
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/tickets/drafts
```

Expected: Array of draft tickets including ticket_id=1

#### Step 5: Admin Edits Draft Ticket
```bash
curl -X PUT http://localhost:5000/api/tickets/drafts/1 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "File Upload Error - Critical",
    "summary": "User reports application crashes when uploading files larger than 10MB",
    "category_id": 1
  }'
```

Expected: Updated ticket object

#### Step 6: Admin Sets Deadline
```bash
curl -X PUT http://localhost:5000/api/tickets/1/deadline \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "deadline": "2026-02-10T17:00:00Z"
  }'
```

#### Step 7: Admin Submits Draft to New Ticket
```bash
curl -X POST http://localhost:5000/api/tickets/1/submit \
  -H "Authorization: Bearer eyJhbGc..."
```

Expected: Ticket status changes from "Draft" to "New"

#### Step 8: Make User an Assignee
```bash
curl -X POST http://localhost:5000/api/admin/assignees/role \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 3,
    "is_assignee": true
  }'
```

#### Step 9: Assign Scope to Assignee
```bash
curl -X POST http://localhost:5000/api/admin/assignees/scope \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 3,
    "scope_name": "Technical Support"
  }'
```

#### Step 10: Assign Ticket to Support Person
```bash
curl -X POST http://localhost:5000/api/tickets/1/reassign \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "assignee_ids": [3],
    "user_id": 2
  }'
```

Expected: Ticket assigned, status changes to "Assigned"

#### Step 11: Support Person Gets Their Workload
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/tickets/assignee/3/workload
```

Expected: Array with ticket_id=1

#### Step 12: Support Person Updates Status to Solving
```bash
curl -X POST http://localhost:5000/api/tickets/1/status \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "new_status": "Solving",
    "user_id": 3
  }'
```

#### Step 13: Support Person Adds Comment
```bash
curl -X POST http://localhost:5000/api/tickets/1/comments \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 3,
    "content": "Found the issue. The server has a 10MB upload limit. We need to increase it or validate on client side.",
    "is_internal": false
  }'
```

#### Step 14: Customer Gets Notification
Customer tracks their request again:
```bash
curl http://localhost:5000/api/requests/track/c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7
```

Expected: Now shows comment from support person

#### Step 15: Support Person Resolves Ticket
```bash
curl -X POST http://localhost:5000/api/tickets/1/status \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "new_status": "Solved",
    "user_id": 3,
    "resolution_comment": "Increased upload limit to 100MB and added client-side validation. Issue resolved."
  }'
```

Expected: Status=Solved, comment added as resolution

#### Step 16: Admin Views Audit Trail
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/admin/audit-trail/1
```

Expected: Complete history of all changes

### Scenario 2: Request Merging

#### Create Second Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer2@test.com",
    "message": "I also have the same file upload issue"
  }'
```

Expected: Second request with ticket_id=2

#### Merge Requests into One Ticket
```bash
curl -X POST http://localhost:5000/api/tickets/merge \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "request_ids": [1, 2]
  }'
```

Expected: Both requests now linked to ticket 1

### Scenario 3: Unlink and Create New

#### Unlink Second Request
```bash
curl -X POST http://localhost:5000/api/tickets/unlink \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "request_id": 2
  }'
```

Expected: Request 2 gets new draft ticket

#### Check New Ticket
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/tickets/drafts
```

Expected: New draft ticket created for request 2

### Scenario 4: Admin Dashboard

#### View Dashboard
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  http://localhost:5000/api/admin/reports/dashboard
```

Expected:
```json
{
  "total_tickets": 2,
  "by_status": [...],
  "by_category": [...],
  "all_tickets": 2
}
```

#### View Assignee Metrics
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  'http://localhost:5000/api/admin/reports/assignee/3?days=30'
```

Expected:
```json
{
  "assignee_id": 3,
  "period_days": 30,
  "metrics": {
    "currentTickets": 0,
    "solvedTickets": 1,
    "failedTickets": 0
  }
}
```

## Test Data Creation Script

```bash
#!/bin/bash
# Save as: test-setup.sh

BASE_URL="http://localhost:5000/api"

echo "Creating test data..."

# 1. Create first request
RESPONSE1=$(curl -s -X POST $BASE_URL/requests \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","message":"Test issue 1"}')
echo "Request 1: $RESPONSE1"

# 2. Create admin user
RESPONSE2=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","name":"Admin"}')
TOKEN=$(echo $RESPONSE2 | jq -r '.token')
ADMIN_ID=$(echo $RESPONSE2 | jq -r '.user.user_id')
echo "Admin token: $TOKEN"

# 3. Create support user
RESPONSE3=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"support@company.com","name":"Support"}')
SUPPORT_ID=$(echo $RESPONSE3 | jq -r '.user.user_id')
echo "Support user ID: $SUPPORT_ID"

# 4. Make support user an assignee
curl -s -X POST $BASE_URL/admin/assignees/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":$SUPPORT_ID,\"is_assignee\":true}"

echo "Test data created successfully!"
echo "Admin Token: $TOKEN"
echo "Support User ID: $SUPPORT_ID"
```

Run with: `bash test-setup.sh`

## Automated Testing with Postman

1. Import `CeiVoice_API.postman_collection.json`
2. Set variables:
   - `jwt_token`: Get from login response
   - `tracking_id`: Get from request submission
3. Run collection in order
4. Check responses match expected format

## Performance Testing

### Load Test Simple Endpoint
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:5000/api/tickets/1

# Using curl in loop
for i in {1..100}; do
  curl http://localhost:5000/api/tickets/1
done
```

### Database Query Performance
```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

## Validation Testing

### Test Email Validation
```bash
# Invalid email
curl -X POST http://localhost:5000/api/requests \
  -d '{"email":"invalid","message":"test"}'
# Expected: 400 error

# Empty message
curl -X POST http://localhost:5000/api/requests \
  -d '{"email":"valid@test.com","message":""}'
# Expected: 400 error
```

### Test Status Transition
```bash
# Try invalid transition (Draft → Solving)
curl -X POST http://localhost:5000/api/tickets/1/status \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"new_status":"Solving","user_id":1}'
# Expected: 400 error

# Valid transition (Draft → New → Assigned → Solving → Solved)
# Should work for each step
```

## Error Scenario Testing

### Test Non-existent Ticket
```bash
curl http://localhost:5000/api/tickets/99999
# Expected: 404 error
```

### Test Invalid Token
```bash
curl -H "Authorization: Bearer invalid" \
  http://localhost:5000/api/auth/me
# Expected: 403 error
```

### Test Missing Required Field
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
# Expected: 400 error (missing message)
```

## Monitoring During Tests

### Watch Database
```bash
npx prisma studio
# View all tables and real-time data changes
```

### Check Logs
```bash
# Terminal 1: Run server
npm run dev

# Terminal 2: Make requests and watch logs
curl http://localhost:5000/api/tickets/1
```

## Test Report Template

```
Test Date: __________
Tester: __________

Test Case: [Name]
- Endpoint: [URL]
- Method: [GET/POST/PUT]
- Status: [PASS/FAIL]
- Response Time: [ms]
- Notes: [Any issues]

Test Case: [Next test]
...

Summary:
- Total Tests: __
- Passed: __
- Failed: __
- Success Rate: __%
```

## Common Test Issues

### "Port already in use"
```bash
# Kill existing process
lsof -i :5000
kill -9 <PID>
```

### "Database connection refused"
```bash
# Check PostgreSQL is running
psql --version
# Start PostgreSQL if needed
```

### "No email received"
```bash
# Check email config in .env
# Test with: npm run dev (check logs)
# Verify SMTP credentials
```

## Next Steps

After all tests pass:
1. Review API documentation
2. Check performance metrics
3. Verify database indices
4. Test with frontend integration
5. Load test in staging
6. Deploy to production
