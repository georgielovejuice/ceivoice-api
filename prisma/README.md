# Prisma Database Schema

This directory contains the database schema, migrations, and seeding scripts for CeiVoice API.

## 📁 Folder Structure

```
prisma/
├── schema.prisma          # Database schema (source of truth)
├── seed.ts                # Database seeding script
├── migrations/            # Migration history (DO NOT DELETE)
│   ├── migration_lock.toml
│   └── 20260211100440_initial_schema/
│       └── migration.sql
└── README.md              # This file
```

## 📝 Files Explained

### `schema.prisma`
**The single source of truth for your database structure.**
- Defines all tables, columns, relationships, and indexes
- Used by Prisma to generate the client and migrations
- Current schema: Refined design with 11 tables (normalized)

### `seed.ts`
**Populates database with initial/test data:**
- 7 Ticket Statuses (Draft → Solved/Failed workflow)
- 5 Categories (IT Support, HR, Finance, etc.)
- 5 Test Users (1 admin, 2 assignees, 2 regular users)
- 4 Sample Tickets
- Related data (comments, notifications, etc.)

### `migrations/`
**The version control history of your database schema.**
- Each migration is a timestamped folder
- Contains SQL that was applied to the database
- **Never delete this** - it's how Prisma knows your DB state
- **Commit this to Git** - team members need it

---

## 🔧 Common Commands

### View Database (GUI)
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Create Migration (after schema changes)
```bash
npx prisma migrate dev --name description_of_change
```

### Apply Migrations (production)
```bash
npx prisma migrate deploy
```

### Reset Database (⚠️ deletes all data)
```bash
npx prisma migrate reset
```

### Seed Database
```bash
npx ts-node prisma/seed.ts
# or
npm run prisma:seed
```

### Generate Prisma Client (after schema changes)
```bash
npx prisma generate
```

---

## 🎯 Typical Workflow

### 1. **Making Schema Changes**
```bash
# 1. Edit schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name add_new_field

# 3. Prisma automatically:
#    - Creates migration file
#    - Applies to database
#    - Regenerates Prisma Client
```

### 2. **Fresh Database Setup**
```bash
# Run all migrations
npx prisma migrate deploy

# Seed with test data
npm run prisma:seed
```

### 3. **Development Reset**
```bash
# Reset DB + run migrations + seed
npx prisma migrate reset
```

---

## 📊 Current Database Schema

### Lookup Tables
- `ticket_statuses` - Workflow states (Draft, New, Assigned, etc.)
- `categories` - Ticket categories with SLA hours

### Core Tables
- `users` - Authentication and user management
- `tickets` - Main ticket table (current state)
- `requests` - Anonymous user requests
- `oauth_tokens` - Google OAuth tokens

### Audit & Collaboration
- `status_histories` - Status change audit trail
- `assignment_histories` - Assignment change audit trail
- `comments` - Ticket comments (public/internal)
- `followers` - Ticket followers
- `notifications` - User notifications
- `assignee_scopes` - Assignee category assignments
- `ticket_requests` - Links requests to tickets

---

## 🔐 Test Credentials

After running seed:

```
Admin:
  Email: admin@ceivoice.com
  Password: Test123!

IT Support Assignee:
  Email: it.support@ceivoice.com
  Password: Test123!

HR Team Assignee:
  Email: hr.team@ceivoice.com
  Password: Test123!

Regular Users:
  Email: john.doe@company.com / jane.smith@company.com
  Password: Test123!
```

---

## 🚨 Important Notes

### ⚠️ DO NOT DELETE `migrations/` folder
- This is your database version control
- Deleting it breaks migration history
- Team members need this folder to sync their databases

### ⚠️ Migration vs Push
- **Use `migrate dev`** during development (creates history)
- **Use `db push`** only for prototyping (no history)
- **Use `migrate deploy`** in production

### ⚠️ Schema.prisma is the source of truth
- Don't manually edit migration files
- Always modify `schema.prisma` and create new migrations

---

## 🔍 Troubleshooting

### "Migration failed"
```bash
# Check database connection
npx prisma db pull

# Reset and try again
npx prisma migrate reset
```

### "Client is not generated"
```bash
npx prisma generate
```

### "Out of sync"
```bash
# Pull current DB schema
npx prisma db pull

# Or reset to migration state
npx prisma migrate reset
```

---

## 📚 Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
