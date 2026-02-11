# 🚀 CeiVoice API - Quick Start Guide

## ✅ What We've Accomplished

### 1. Database Deployment ✓
- ✅ Connected to Supabase (AWS Singapore)
- ✅ Migrated refined schema (11 tables)
- ✅ Seeded with test data (5 users, 4 tickets, 7 statuses, 5 categories)
- ✅ All relationships and indexes created

### 2. API Server ✓
- ✅ Server running on port 5000
- ✅ All endpoints operational
- ✅ Authentication working (JWT)
- ✅ Authorization enforced (role-based)

### 3. Testing ✓
- ✅ Database connectivity verified
- ✅ API endpoints tested
- ✅ CRUD operations confirmed
- ✅ 100% critical tests passed

---

## 🎯 Quick Commands

### Start the Server
```bash
cd /home/engineer-kim/Desktop/ceivoice-api/backend
npm run dev
```

### Test Everything
```bash
# Test database
npx ts-node test-database.ts

# Test API
bash ../test-api.sh

# Test CRUD
bash ../test-crud.sh
```

### Database Tools
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# View migrations
ls prisma/migrations

# Reseed database
npm run prisma:seed
```

---

## 🔐 Login Credentials

### Admin
```
Email: admin@ceivoice.com
Password: Test123!
```

### IT Support Assignee
```
Email: it.support@ceivoice.com
Password: Test123!
```

### Regular User
```
Email: john.doe@company.com
Password: Test123!
```

---

## 📡 Test API Endpoint

### Login (Get JWT Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ceivoice.com",
    "password": "Test123!"
  }'
```

### Get Your Profile
```bash
# Replace YOUR_TOKEN with the accessToken from login
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "message": "I need help with my account"
  }'
```

---

## 📊 Database Access

### Supabase Dashboard
1. Visit: https://supabase.com
2. Log in to your account
3. Select your project
4. Go to Table Editor to view data

### Via Prisma Studio (Local)
```bash
cd backend
npm run prisma:studio
# Opens at http://localhost:5555
```

---

## 🎫 Ticket Workflow

```
1. Draft (AI-generated)
   ↓ [Admin activates]
2. New (Awaiting assignment)
   ↓ [Admin assigns]
3. Assigned (Has assignee)
   ↓ [Assignee starts work]
4. Solving (In progress)
   ↓ [Work completed]
5. Solved/Failed (Final states)
   ↓ [If needed]
6. Renew (Reopened)
```

---

## 📁 Project Structure

```
ceivoice-api/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.ts                # Seed data
│   │   └── migrations/            # Migration history
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   ├── routes/                # API endpoints
│   │   ├── services/              # Database & external services
│   │   └── middlewares/           # Auth & validation
│   └── .env                       # Environment config
├── test-database.ts               # Database tests
├── test-api.sh                    # API tests
├── test-crud.sh                   # CRUD tests
└── DEPLOYMENT_SUCCESS_REPORT.md   # Full report
```

---

## 🔍 Verify Everything is Working

### Step 1: Check Server
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 2: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ceivoice.com","password":"Test123!"}'
# Should return: {"accessToken":"...","refreshToken":"..."}
```

### Step 3: Check Database
```bash
cd backend
npx ts-node test-database.ts
# Should show: ✅ ALL TESTS PASSED SUCCESSFULLY!
```

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Kill existing processes
pkill -f "ts-node"

# Restart
cd backend
npm run dev
```

### Database connection error
```bash
# Check .env file
cat backend/.env | grep DATABASE_URL

# Test connection
cd backend
npx prisma db pull
```

### JWT token expired
- Tokens expire after 7 days
- Login again to get new token
- Or use refresh token endpoint

---

## 📈 Next Steps

1. **Frontend Integration**: Connect your frontend to these APIs
2. **Postman Collection**: Import the collection for API testing
3. **Production Deploy**: Deploy to your production environment
4. **Monitoring**: Set up logging and alerts
5. **Backup**: Configure automated backups in Supabase

---

## 🎉 Success Indicators

✅ Server responds to `/health`  
✅ Login returns JWT tokens  
✅ Database has 5 users  
✅ Database has 4 sample tickets  
✅ All API endpoints working  

**Your CeiVoice API is LIVE and READY! 🚀**

---

For detailed information, see:
- [DEPLOYMENT_SUCCESS_REPORT.md](DEPLOYMENT_SUCCESS_REPORT.md) - Full deployment report
- [POSTMAN_COLLECTION_GUIDE.md](POSTMAN_COLLECTION_GUIDE.md) - API testing guide
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) - Database schema
