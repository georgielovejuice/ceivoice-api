# Database Migration Guide: Current Schema → Refined Schema

## Overview

This guide walks you through migrating from the current ambiguous schema to a **normalized, lookup-based schema** that fixes the status update bug and provides a clean foundation for reporting.

---

## What Changed?

### Key Improvements

1. **Lookup Tables for Statuses & Categories**
   - Status is now a foreign key `status_id` instead of free text
   - Eliminates inconsistencies (e.g., "Draft" vs "draft")
   - Enables ordered workflow progression

2. **Single Source of Truth**
   - `Ticket.status_id` = current state
   - `StatusHistory` = audit trail (old → new transitions)
   - No more ambiguity between current status and history

3. **Explicit Workflow Timestamps**
   - `created_at` = AI draft creation
   - `activated_at` = When Admin submits Draft → New
   - `resolved_at` = When marked Solved/Failed
   - Enables accurate SLA and resolution time reporting

4. **Required Resolution Comment**
   - `resolution_comment_id` links to the final comment
   - Enforces documentation of ticket outcomes

5. **Audit Trail with Reasons**
   - `StatusHistory.change_reason` explains why status changed
   - `AssignmentHistory.changed_by_id` tracks who made the change

---

## Migration Steps

### Step 1: Backup Current Database

**CRITICAL: Always backup before schema changes!**

```bash
# Connect to your Supabase database
pg_dump -h <your-supabase-host> -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

### Step 2: Run Seed Data for Lookup Tables

This creates the reference data for statuses and categories.

```bash
cd backend/prisma
psql -h <your-supabase-host> -U postgres -d postgres -f seed-refined.sql
```

**What this does:**
- Creates `ticket_statuses` with 7 statuses (Draft, New, Assigned, Solving, Solved, Failed, Renew)
- Each status has a `step_order` for workflow progression
- Populates common categories (IT, HR, Finance, etc.) with SLA hours

### Step 3: Run Data Migration

This transforms existing data to the new schema.

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f migration-to-refined.sql
```

**What this does:**
1. Creates new tables: `ticket_statuses`, refined `tickets`, refined `status_histories`
2. Migrates data from old schema to new schema:
   - Maps text statuses to `status_id` (e.g., "Draft" → 1)
   - Preserves all relationships (comments, assignments, followers)
   - Converts status history records
3. Renames old tables to `_old` (backup)
4. Renames new tables to production names

### Step 4: Update Prisma Schema

```bash
# Replace the current schema
mv backend/prisma/schema.prisma backend/prisma/schema-old.prisma
mv backend/prisma/schema-refined.prisma backend/prisma/schema.prisma

# Regenerate Prisma Client
cd backend
npx prisma generate
```

### Step 5: Test Migration

Before deploying, test basic operations:

```bash
# Start backend
pnpm run dev

# Test endpoints:
# 1. GET /api/tickets/2 - Verify ticket status shows as integer status_id
# 2. PATCH /api/tickets/2/status with {"new_status": "Assigned"}
# 3. Check database - both Ticket.status_id and StatusHistory should update correctly
```

### Step 6: Update Frontend (If Applicable)

If you have a frontend, update it to:
- Fetch status names from `/api/statuses` lookup endpoint
- Display status names instead of IDs
- Use the new workflow endpoints:
  - `POST /api/workflow/drafts/:id/activate` (Draft → New)
  - `POST /api/workflow/tickets/:id/resolve` (→ Solved/Failed)

---

## New API Endpoints

### Workflow Endpoints

```bash
# Activate Draft → New (Admin only)
POST /api/workflow/drafts/:id/activate
Authorization: Bearer <admin_token>

# Resolve Ticket with required comment
POST /api/workflow/tickets/:id/resolve
Content-Type: application/json
Authorization: Bearer <assignee_token>
{
  "resolution_status": "Solved",
  "resolution_comment": "Fixed database connection issue by updating credentials"
}

# Renew Ticket (reopen Solved/Failed)
POST /api/workflow/tickets/:id/renew
Content-Type: application/json
Authorization: Bearer <assignee_token>
{
  "reason": "Customer reported issue still present"
}
```

### Reporting Endpoints

```bash
# Admin Global Metrics
GET /api/reporting/admin/metrics?period=last_30_days
Authorization: Bearer <admin_token>

# Category Trends
GET /api/reporting/admin/category-trends?days=30
Authorization: Bearer <admin_token>

# Assignee Workload
GET /api/reporting/assignee/workload?sort_by=deadline
Authorization: Bearer <assignee_token>

# Assignee Performance
GET /api/reporting/assignee/performance?period=last_30_days
Authorization: Bearer <assignee_token>
```

---

## Rollback Plan

If something goes wrong:

### Immediate Rollback (Schema Only)

```sql
-- Rename tables back
ALTER TABLE tickets RENAME TO tickets_new;
ALTER TABLE status_histories RENAME TO status_histories_new;
ALTER TABLE tickets_old RENAME TO tickets;
ALTER TABLE status_histories_old RENAME TO status_histories;

-- Restore old Prisma schema
mv backend/prisma/schema-old.prisma backend/prisma/schema.prisma
npx prisma generate
```

### Full Rollback (Database + Schema)

```bash
# Restore from backup
psql -h <your-supabase-host> -U postgres -d postgres < backup_<date>.sql

# Restore old schema
mv backend/prisma/schema-old.prisma backend/prisma/schema.prisma
cd backend && npx prisma generate
```

---

## Verification Checklist

After migration, verify:

- [ ] All existing tickets are visible
- [ ] Status changes update both `Ticket.status_id` and `StatusHistory`
- [ ] Draft activation creates an `activated_at` timestamp
- [ ] Ticket resolution requires a comment
- [ ] Admin metrics endpoint returns data
- [ ] Assignee workload endpoint shows correct active tickets
- [ ] No console errors in backend logs

---

## Database Schema Comparison

### Before (Current)

```prisma
model Ticket {
  status String @default("Draft") // Free text - inconsistent!
  // No activation timestamp
  // No resolution metadata
}

model StatusHistory {
  old_status String // Free text
  new_status String // Free text
  // No change reason
}
```

### After (Refined)

```prisma
model Ticket {
  status_id Int // Foreign key → normalized!
  activated_at DateTime? // Explicit workflow tracking
  activated_by_id Int?
  resolved_at DateTime?
  resolution_comment_id Int?
  
  status TicketStatus @relation(...)
}

model TicketStatus {
  status_id Int @id
  name String @unique // "Draft", "New", etc.
  step_order Int // Workflow progression
}

model StatusHistory {
  old_status_id Int // Normalized
  new_status_id Int // Normalized
  change_reason String? // Audit trail
  
  old_status TicketStatus @relation("OldStatus")
  new_status TicketStatus @relation("NewStatus")
}
```

---

## Performance Impact

### Improvements
- ✅ Faster status queries (integer comparison vs string)
- ✅ Indexed status_id enables efficient filtering
- ✅ Reporting queries use indexed timestamps
- ✅ Normalized data reduces storage

### Considerations
- Status lookups require a JOIN (minimal overhead)
- Add indexes on frequently queried fields:
  - `tickets.status_id`
  - `tickets.activated_at`
  - `tickets.resolved_at`
  - `status_histories.new_status_id`

---

## Support

If you encounter issues:

1. **Check logs**: `backend/logs/migration.log` (if configured)
2. **Database state**: 
   ```sql
   SELECT status_id, COUNT(*) FROM tickets GROUP BY status_id;
   ```
3. **Prisma Client**: `npx prisma studio` to inspect data visually

---

## Next Steps After Migration

1. **Update Postman Collection**
   - Test all workflow endpoints
   - Add reporting endpoints to collection

2. **Monitor Production**
   - Check API response times
   - Monitor database query performance
   - Review error logs for migration issues

3. **Document New Workflow**
   - Update API documentation
   - Train team on new endpoints
   - Update frontend to use refined schema

---

## FAQ

**Q: Will this migration cause downtime?**  
A: Minimal. The migration copies data first, then swaps table names. Expect < 1 minute downtime.

**Q: What happens to old data?**  
A: Old tables are renamed to `_old` and preserved. You can drop them after verifying migration success:
```sql
DROP TABLE IF EXISTS tickets_old CASCADE;
DROP TABLE IF EXISTS status_histories_old CASCADE;
```

**Q: Can I run this migration incrementally?**  
A: No. This is an all-or-nothing migration due to foreign key constraints. Test in staging first!

**Q: How do I update the status update bug fix?**  
A: The bug is automatically fixed by the new schema. Status updates now correctly modify `Ticket.status_id` and create `StatusHistory` records.

---

**Migration Created**: $(date +%Y-%m-%d)  
**Schema Version**: 2.0 (Normalized)  
**Prisma Version**: Check `package.json`
