# Migration Guide - Enable RLS Policies

## Overview

Migration `20251016175551_enable_rls_policies.sql` enables Row Level Security (RLS) and creates comprehensive security policies for all CRUD operations across all application tables.

This migration reverses the changes made in `20251009100001_disable_rls.sql` and implements proper access control based on user authentication and ownership.

## Prerequisites

Before running this migration, ensure you have:

1. Supabase CLI installed (`npm install -g supabase` or see [Supabase CLI docs](https://supabase.com/docs/guides/cli))
2. Docker installed and running (required for local development)
3. Access to your Supabase project (local or remote)

## Migration Execution

### Local Development (Recommended for testing)

1. **Start local Supabase instance:**

   ```bash
   supabase start
   ```

2. **Apply the migration:**

   ```bash
   supabase db reset
   ```

   This will reset your local database and apply all migrations in order, including the new RLS policies.

   **Alternative (apply only new migrations):**

   ```bash
   supabase migration up
   ```

3. **Verify migration status:**

   ```bash
   supabase migration list
   ```

   You should see `20251016175551_enable_rls_policies.sql` marked as applied.

4. **Test RLS policies:**
   After applying the migration, test your application to ensure:
   - Authenticated users can access their own data
   - Authenticated users cannot access other users' data
   - Anonymous users are denied access to protected resources

### Production/Remote Database

**⚠️ WARNING: Test thoroughly in local/staging environment before applying to production!**

1. **Link to your remote project:**

   ```bash
   supabase link --project-ref <your-project-ref>
   ```

2. **Check current migration status:**

   ```bash
   supabase db remote list
   ```

3. **Apply the migration to remote database:**

   ```bash
   supabase db push
   ```

4. **Verify the migration was applied:**
   ```bash
   supabase db remote list
   ```

## What This Migration Does

### 1. Enables RLS on all tables:

- `flashcard_sets`
- `flashcards`
- `flashcard_progress`
- `generation_sessions`
- `study_sessions`
- `study_reviews`
- `system_logs`

**Note:** The custom `users` table no longer exists after migration `20251014000000_migrate_to_auth_users.sql`. The system now uses `auth.users` directly.

### 2. Creates comprehensive security policies:

#### User Access Pattern:

- **Authenticated users** can only access their own data
- **Anonymous users** have no access to any tables
- Access is controlled through `auth.uid()` checks

#### Table-Specific Rules:

**flashcard_sets:**

- Users can only access flashcard sets they own (`user_id = auth.uid()`)

**flashcards:**

- Users can only access flashcards belonging to their flashcard sets
- Access checked via JOIN with `flashcard_sets` table

**flashcard_progress:**

- Users can only access progress data for their own flashcards
- Access checked via JOIN through `flashcards` → `flashcard_sets` chain

**generation_sessions:**

- Users can only access their own generation sessions

**study_sessions:**

- Users can only access their own study sessions

**study_reviews:**

- Users can only access reviews from their own study sessions
- Access checked via JOIN with `study_sessions` table

**system_logs:**

- Append-only for authenticated users
- No read, update, or delete access (consider adding admin role in future)

## Rollback

If you need to rollback this migration (disable RLS again):

1. **Create a rollback migration:**

   ```bash
   supabase migration new rollback_rls
   ```

2. **Add rollback SQL**:

   ```sql
   -- Note: no users table (dropped in 20251014000000_migrate_to_auth_users.sql)
   ALTER TABLE flashcard_sets DISABLE ROW LEVEL SECURITY;
   ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
   ALTER TABLE flashcard_progress DISABLE ROW LEVEL SECURITY;
   ALTER TABLE generation_sessions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE study_sessions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE study_reviews DISABLE ROW LEVEL SECURITY;
   ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
   ```

3. **Apply the rollback:**
   ```bash
   supabase migration up
   ```

## Post-Migration Checklist

After applying this migration, verify:

- [ ] All existing application features work correctly
- [ ] Users can only see their own data
- [ ] API endpoints respect RLS policies (use `supabase` client from `context.locals`)
- [ ] Authentication is working properly
- [ ] No unauthorized access is possible
- [ ] Error handling for permission denied scenarios is in place
- [ ] Performance is acceptable (RLS policies may add query overhead)

## Troubleshooting

### Issue: "permission denied for table X"

**Cause:** RLS policies are now enforced. Your application code might be using queries that don't pass RLS checks.

**Solution:**

- Ensure all queries use the authenticated Supabase client
- Verify `auth.uid()` returns the correct user ID
- Check that foreign key relationships are correct

### Issue: Performance degradation

**Cause:** RLS policies add WHERE clauses to every query, which can impact performance.

**Solution:**

- Add indexes on columns used in RLS policy checks (especially `user_id` and foreign keys)
- Consider using database functions with SECURITY DEFINER for complex queries
- Monitor query performance with `EXPLAIN ANALYZE`

### Issue: Service role bypasses RLS

**Cause:** Service role key has superuser privileges and bypasses RLS.

**Solution:**

- Use service role only for admin operations
- Use authenticated client (`supabase` from `context.locals`) for user operations
- Never expose service role key to frontend

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
