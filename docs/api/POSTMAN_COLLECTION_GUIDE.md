# Postman Collection Refactoring - Complete Guide

## 📋 What's New

Your `CeiVoice-API.postman_collection.json` has been refactored to:

✅ **Use new database schema**
- `status_id` (integer) instead of `status` (string)
- `assignee_user_id` (FK) instead of `is_assignee` boolean
- Removed `is_internal` field from comments

✅ **Include all endpoints** with proper request/response tests
- 40+ API endpoints fully documented
- Test scripts that auto-validate responses
- Auto-save environment variables (tokens, IDs)

✅ **Complete workflow examples**
- Workflow 1: Create → Activate → Assign → Solve (6 steps)
- Workflow 2: Failed → Renewed (4 steps)
- Each step auto-saves needed variables for next request

✅ **Organized into folders**
- Authentication
- Draft Tickets
- Ticket Management
- Workflow Operations
- Admin Operations
- Request Tracking
- Complete Test Workflows
- Schema Reference

---

## 🚀 Quick Start

### Step 1: Import the Refactored Collection

1. Open **Postman**
2. Click **Import** (top-left)
3. Choose file: `CeiVoice-API-Refactored.postman_collection.json`
4. Click **Import**

### Step 2: Start Your Server

```bash
cd backend
pnpm run dev
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Connected to Supabase database
```

### Step 3: Create Admin User (if you haven't)

```bash
cd backend
npx ts-node scripts/create-admin-user.ts
```

### Step 4: Login to Get Tokens

In Postman:
1. Go to **Authentication** → **Login as Admin**
2. Click **Send**
3. Tokens are auto-saved! ✅

---

## 📊 What You Can Test

### A. Single Endpoint Tests
- **Create Draft Ticket** - Creates status_id: 1
- **Get Ticket Details** - Validates new schema
- **Assign Ticket** - Uses assignee_user_id FK
- **Add Comment** - Tests comment creation
- **Update Status** - Changes status_id with validation

### B. Complete Workflows (Run sequentially)

**Workflow 1: Happy Path (Solved)**
```
Draft → New → Assigned → Solving → Solved
```
1. Click folder "✅ Workflow 1: Create → Activate → Assign → Solve"
2. Click each request in order
3. Each one runs the next step automatically
4. Watch console for progress ✓

**Workflow 2: Failed & Reopen**
```
New → Assigned → Failed → Renew
```
1. Similar to Workflow 1 but ends with renewal

### C. Admin Dashboards
- **Admin Metrics** - Total tickets, backlog, resolution rate
- **Assignee Workload** - Active tickets per assignee
- **Assignee Performance** - Solved, failed, success rate

---

## 🔍 How Tests Work

Every request includes validation scripts that:

1. **Check response code** (200, 201, etc.)
2. **Validate schema** (status_id is number, not string)
3. **Save variables** for next request
4. **Print console output** with colored indicators

**Example:**
```javascript
pm.test('Draft activated (status_id: 1 → 2)', () => {
  pm.expect(response.data.status_id).to.eql(2);
});
```

When you run a request, you'll see:
- ✓ Test passed (green)
- ✗ Test failed (red)
- Console logs with details

---

## 📝 Environment Variables Auto-Set

The collection automatically saves:

| Variable | Set By | Used For |
|----------|--------|----------|
| `access_token` | Login request | All authenticated endpoints |
| `ticket_id` | Get Tickets list | Single ticket operations |
| `draft_ticket_id` | Create Draft | Draft operations |
| `workflow_ticket_id` | Workflow requests | Workflow steps |
| `assignee_id` | Get Assignees | Assign operations |
| `current_user_id` | Get Current User | Performance metrics |

**Example:** After running "List All Tickets", the first ticket's ID is automatically saved to `{{ticket_id}}` variable. Next request that uses `{{ticket_id}}` will have it filled in!

---

## 🧪 Testing Sequence

### Option 1: Test One Endpoint
1. Find endpoint in collection
2. Click it
3. Click **Send**
4. See response + test results

### Option 2: Test Complete Workflow
1. Go to **📊 Complete Test Workflows** folder
2. Open **✅ Workflow 1** or **❌ Workflow 2**
3. Click each request in order from top to bottom
4. Watch test results appear

### Option 3: Use Collection Runner (Advanced)
1. Right-click collection name
2. Click **Run collection**
3. Pops up in new window
4. Runs all requests automatically
5. Shows pass/fail summary

---

## 🆚 Schema Changes Reference

### Old Schema → New Schema

**Ticket Object**

Old:
```json
{
  "ticket_id": 1,
  "status": "Draft",              // String
  "is_assignee": true,            // Boolean
  "assignments": [
    { "assignee_id": 2 }          // Junction table
  ]
}
```

New:
```json
{
  "ticket_id": 1,
  "status_id": 1,                 // Integer FK (1-7)
  "status": { 
    "status_id": 1, 
    "name": "Draft" 
  },                              // Status object
  "assignee_user_id": 2,          // Direct FK
  "creator_user_id": 1            // Direct FK
}
```

**Key Differences:**
- Use **`status_id`** (number) in all queries
- Use **`assignee_user_id`** to get assignee
- No more **`assignments`** array
- No **`is_internal`** field on comments

---

## 🐛 Common Issues & Solutions

### "Invalid value for status_id"
**Issue:** Using `"status": "New"` instead of status_id
**Fix:** Use `status_id: 2` in request body, status name in query params

### "Cannot assign to null user"
**Issue:** Assignee ID doesn't exist
**Fix:** Run "Get All Assignees" first to see valid IDs

### "Status cannot be changed to Draft"
**Issue:** Trying to revert ticket to Draft (status_id: 1)
**Fix:** Once activated, can only move forward or use Renew (7)

### Token expired
**Issue:** "Invalid or expired token"
**Fix:** Run "Login as Admin" again to get fresh token

### Wrong environment URL
**Issue:** Calls going to wrong server
**Fix:** Check `base_url` variable is `http://localhost:5000`

---

## 📞 What Each Endpoint Does

### Authentication
- **Login** - Get access token
- **Register** - Create new user
- **Get Current User** - Fetch your profile
- **Refresh Token** - Get new access token

### Draft Management
- **Create Draft** - Create with status_id: 1
- **List Drafts** - All status_id: 1 tickets
- **Update Draft** - Edit title/description (must be status_id: 1)
- **Activate Draft** - Change status_id: 1 → 2

### Ticket Operations
- **List All** - All non-draft tickets
- **Get Details** - Fetch single ticket
- **Get by Status** - Filter by status name
- **Assign** - Set assignee_user_id + status_id: 3
- **Unassign** - Clear assignee_user_id
- **Update Status** - Change status_id
- **Add Comment** - Create comment on ticket
- **Get Comments** - List all comments

### Workflows
- **Resolve (Solved)** - Mark status_id: 5, add comment
- **Resolve (Failed)** - Mark status_id: 6, add comment
- **Renew** - Reopen ticket, set status_id: 7

### Admin
- **All Users** - List all users
- **All Assignees** - List users with ASSIGNEE or ADMIN role
- **Metrics** - Dashboard stats
- **Workload** - Active tickets per assignee
- **Performance** - Solved/failed per assignee

### Public Requests
- **Submit Request** - Create public request (no auth needed)
- **Track Request** - Check status using tracking_id

---

## 🎯 Success Checklist

- [ ] Server running (`pnpm run dev`)
- [ ] Admin user created (`npx ts-node scripts/create-admin-user.ts`)
- [ ] Collection imported into Postman
- [ ] Login request passes (token saved)
- [ ] Can create draft ticket
- [ ] Can activate draft to status_id: 2
- [ ] Can assign ticket (assignee_user_id set)
- [ ] Can add comments
- [ ] Can change status_id
- [ ] Admin metrics endpoint works
- [ ] Complete workflow 1 passes

Once all checked ✅ - **Everything is working!**

---

## 📚 Additional Resources

- Full testing guide: [TESTING_NEW_DATABASE.md](TESTING_NEW_DATABASE.md)
- Implementation details: [IMPLEMENTATION_DETAILS.md](IMPLEMENTATION_DETAILS.md)
- API documentation: [docs/api/README.md](docs/api/README.md)

