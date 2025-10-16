-- ============================================================================
-- Migration: Enable RLS and Create Security Policies
-- Description: Enables Row Level Security (RLS) for all application tables 
--              and creates comprehensive security policies for CRUD operations.
--              This migration reverses the 20251009100001_disable_rls.sql 
--              migration and implements proper access control based on user 
--              authentication and ownership.
--              Note: Uses auth.users (no custom users table after migration 
--              20251014000000_migrate_to_auth_users.sql)
-- Tables affected: flashcard_sets, flashcards, flashcard_progress,
--                  generation_sessions, study_sessions, study_reviews, system_logs
-- Author: Database Migration System
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- enable rls for all application tables
-- note: users table no longer exists, now using auth.users
alter table flashcard_sets enable row level security;
alter table flashcards enable row level security;
alter table flashcard_progress enable row level security;
alter table generation_sessions enable row level security;
alter table study_sessions enable row level security;
alter table study_reviews enable row level security;
alter table system_logs enable row level security;

-- ============================================================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================================================

-- drop existing policies to avoid conflicts
-- note: no users table policies (table dropped in 20251014000000_migrate_to_auth_users.sql)

drop policy if exists "flashcard_sets_select_anon" on flashcard_sets;
drop policy if exists "flashcard_sets_select_authenticated" on flashcard_sets;
drop policy if exists "flashcard_sets_insert_anon" on flashcard_sets;
drop policy if exists "flashcard_sets_insert_authenticated" on flashcard_sets;
drop policy if exists "flashcard_sets_update_anon" on flashcard_sets;
drop policy if exists "flashcard_sets_update_authenticated" on flashcard_sets;
drop policy if exists "flashcard_sets_delete_anon" on flashcard_sets;
drop policy if exists "flashcard_sets_delete_authenticated" on flashcard_sets;

drop policy if exists "flashcards_select_anon" on flashcards;
drop policy if exists "flashcards_select_authenticated" on flashcards;
drop policy if exists "flashcards_insert_anon" on flashcards;
drop policy if exists "flashcards_insert_authenticated" on flashcards;
drop policy if exists "flashcards_update_anon" on flashcards;
drop policy if exists "flashcards_update_authenticated" on flashcards;
drop policy if exists "flashcards_delete_anon" on flashcards;
drop policy if exists "flashcards_delete_authenticated" on flashcards;

drop policy if exists "flashcard_progress_select_anon" on flashcard_progress;
drop policy if exists "flashcard_progress_select_authenticated" on flashcard_progress;
drop policy if exists "flashcard_progress_insert_anon" on flashcard_progress;
drop policy if exists "flashcard_progress_insert_authenticated" on flashcard_progress;
drop policy if exists "flashcard_progress_update_anon" on flashcard_progress;
drop policy if exists "flashcard_progress_update_authenticated" on flashcard_progress;
drop policy if exists "flashcard_progress_delete_anon" on flashcard_progress;
drop policy if exists "flashcard_progress_delete_authenticated" on flashcard_progress;

drop policy if exists "generation_sessions_select_anon" on generation_sessions;
drop policy if exists "generation_sessions_select_authenticated" on generation_sessions;
drop policy if exists "generation_sessions_insert_anon" on generation_sessions;
drop policy if exists "generation_sessions_insert_authenticated" on generation_sessions;
drop policy if exists "generation_sessions_update_anon" on generation_sessions;
drop policy if exists "generation_sessions_update_authenticated" on generation_sessions;
drop policy if exists "generation_sessions_delete_anon" on generation_sessions;
drop policy if exists "generation_sessions_delete_authenticated" on generation_sessions;

drop policy if exists "study_sessions_select_anon" on study_sessions;
drop policy if exists "study_sessions_select_authenticated" on study_sessions;
drop policy if exists "study_sessions_insert_anon" on study_sessions;
drop policy if exists "study_sessions_insert_authenticated" on study_sessions;
drop policy if exists "study_sessions_update_anon" on study_sessions;
drop policy if exists "study_sessions_update_authenticated" on study_sessions;
drop policy if exists "study_sessions_delete_anon" on study_sessions;
drop policy if exists "study_sessions_delete_authenticated" on study_sessions;

drop policy if exists "study_reviews_select_anon" on study_reviews;
drop policy if exists "study_reviews_select_authenticated" on study_reviews;
drop policy if exists "study_reviews_insert_anon" on study_reviews;
drop policy if exists "study_reviews_insert_authenticated" on study_reviews;
drop policy if exists "study_reviews_update_anon" on study_reviews;
drop policy if exists "study_reviews_update_authenticated" on study_reviews;
drop policy if exists "study_reviews_delete_anon" on study_reviews;
drop policy if exists "study_reviews_delete_authenticated" on study_reviews;

drop policy if exists "system_logs_select_anon" on system_logs;
drop policy if exists "system_logs_select_authenticated" on system_logs;
drop policy if exists "system_logs_insert_anon" on system_logs;
drop policy if exists "system_logs_insert_authenticated" on system_logs;
drop policy if exists "system_logs_update_anon" on system_logs;
drop policy if exists "system_logs_update_authenticated" on system_logs;
drop policy if exists "system_logs_delete_anon" on system_logs;
drop policy if exists "system_logs_delete_authenticated" on system_logs;

-- ============================================================================
-- 3. FLASHCARD_SETS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access flashcard sets they own
-- anon users have no access to flashcard sets

-- anon role: no access to flashcard sets
create policy "flashcard_sets_select_anon"
  on flashcard_sets for select
  to anon
  using (false);

-- authenticated role: users can only view their own flashcard sets
create policy "flashcard_sets_select_authenticated"
  on flashcard_sets for select
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no insert access
create policy "flashcard_sets_insert_anon"
  on flashcard_sets for insert
  to anon
  with check (false);

-- authenticated role: users can only create flashcard sets for themselves
create policy "flashcard_sets_insert_authenticated"
  on flashcard_sets for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon role: no update access
create policy "flashcard_sets_update_anon"
  on flashcard_sets for update
  to anon
  using (false);

-- authenticated role: users can only update their own flashcard sets
create policy "flashcard_sets_update_authenticated"
  on flashcard_sets for update
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no delete access
create policy "flashcard_sets_delete_anon"
  on flashcard_sets for delete
  to anon
  using (false);

-- authenticated role: users can only delete their own flashcard sets
create policy "flashcard_sets_delete_authenticated"
  on flashcard_sets for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 4. FLASHCARDS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access flashcards that belong to their flashcard sets
-- access is determined by checking ownership of the parent flashcard_set
-- anon users have no access

-- anon role: no access to flashcards
create policy "flashcards_select_anon"
  on flashcards for select
  to anon
  using (false);

-- authenticated role: users can view flashcards from their own sets
create policy "flashcards_select_authenticated"
  on flashcards for select
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.flashcard_set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no insert access
create policy "flashcards_insert_anon"
  on flashcards for insert
  to anon
  with check (false);

-- authenticated role: users can only insert flashcards into their own sets
create policy "flashcards_insert_authenticated"
  on flashcards for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.flashcard_set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no update access
create policy "flashcards_update_anon"
  on flashcards for update
  to anon
  using (false);

-- authenticated role: users can only update flashcards in their own sets
create policy "flashcards_update_authenticated"
  on flashcards for update
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.flashcard_set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no delete access
create policy "flashcards_delete_anon"
  on flashcards for delete
  to anon
  using (false);

-- authenticated role: users can only delete flashcards from their own sets
create policy "flashcards_delete_authenticated"
  on flashcards for delete
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.flashcard_set_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. FLASHCARD_PROGRESS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access progress data for their own flashcards
-- access is determined by checking ownership through flashcard -> flashcard_set chain
-- anon users have no access

-- anon role: no access to flashcard progress
create policy "flashcard_progress_select_anon"
  on flashcard_progress for select
  to anon
  using (false);

-- authenticated role: users can view progress for their own flashcards
create policy "flashcard_progress_select_authenticated"
  on flashcard_progress for select
  to authenticated
  using (
    exists (
      select 1 from flashcards
      join flashcard_sets on flashcard_sets.id = flashcards.flashcard_set_id
      where flashcards.id = flashcard_progress.flashcard_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no insert access
create policy "flashcard_progress_insert_anon"
  on flashcard_progress for insert
  to anon
  with check (false);

-- authenticated role: users can only insert progress for their own flashcards
create policy "flashcard_progress_insert_authenticated"
  on flashcard_progress for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcards
      join flashcard_sets on flashcard_sets.id = flashcards.flashcard_set_id
      where flashcards.id = flashcard_progress.flashcard_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no update access
create policy "flashcard_progress_update_anon"
  on flashcard_progress for update
  to anon
  using (false);

-- authenticated role: users can only update progress for their own flashcards
create policy "flashcard_progress_update_authenticated"
  on flashcard_progress for update
  to authenticated
  using (
    exists (
      select 1 from flashcards
      join flashcard_sets on flashcard_sets.id = flashcards.flashcard_set_id
      where flashcards.id = flashcard_progress.flashcard_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- anon role: no delete access
create policy "flashcard_progress_delete_anon"
  on flashcard_progress for delete
  to anon
  using (false);

-- authenticated role: users can only delete progress for their own flashcards
create policy "flashcard_progress_delete_authenticated"
  on flashcard_progress for delete
  to authenticated
  using (
    exists (
      select 1 from flashcards
      join flashcard_sets on flashcard_sets.id = flashcards.flashcard_set_id
      where flashcards.id = flashcard_progress.flashcard_id
      and flashcard_sets.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. GENERATION_SESSIONS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access their own generation sessions
-- anon users have no access

-- anon role: no access to generation sessions
create policy "generation_sessions_select_anon"
  on generation_sessions for select
  to anon
  using (false);

-- authenticated role: users can only view their own generation sessions
create policy "generation_sessions_select_authenticated"
  on generation_sessions for select
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no insert access
create policy "generation_sessions_insert_anon"
  on generation_sessions for insert
  to anon
  with check (false);

-- authenticated role: users can only create their own generation sessions
create policy "generation_sessions_insert_authenticated"
  on generation_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon role: no update access
create policy "generation_sessions_update_anon"
  on generation_sessions for update
  to anon
  using (false);

-- authenticated role: users can only update their own generation sessions
create policy "generation_sessions_update_authenticated"
  on generation_sessions for update
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no delete access
create policy "generation_sessions_delete_anon"
  on generation_sessions for delete
  to anon
  using (false);

-- authenticated role: users can only delete their own generation sessions
create policy "generation_sessions_delete_authenticated"
  on generation_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 7. STUDY_SESSIONS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access their own study sessions
-- anon users have no access

-- anon role: no access to study sessions
create policy "study_sessions_select_anon"
  on study_sessions for select
  to anon
  using (false);

-- authenticated role: users can only view their own study sessions
create policy "study_sessions_select_authenticated"
  on study_sessions for select
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no insert access
create policy "study_sessions_insert_anon"
  on study_sessions for insert
  to anon
  with check (false);

-- authenticated role: users can only create their own study sessions
create policy "study_sessions_insert_authenticated"
  on study_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- anon role: no update access
create policy "study_sessions_update_anon"
  on study_sessions for update
  to anon
  using (false);

-- authenticated role: users can only update their own study sessions
create policy "study_sessions_update_authenticated"
  on study_sessions for update
  to authenticated
  using (auth.uid() = user_id);

-- anon role: no delete access
create policy "study_sessions_delete_anon"
  on study_sessions for delete
  to anon
  using (false);

-- authenticated role: users can only delete their own study sessions
create policy "study_sessions_delete_authenticated"
  on study_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 8. STUDY_REVIEWS TABLE POLICIES
-- ============================================================================
-- rationale: users can only access reviews from their own study sessions
-- access is determined by checking ownership of the parent study_session
-- anon users have no access

-- anon role: no access to study reviews
create policy "study_reviews_select_anon"
  on study_reviews for select
  to anon
  using (false);

-- authenticated role: users can view reviews from their own study sessions
create policy "study_reviews_select_authenticated"
  on study_reviews for select
  to authenticated
  using (
    exists (
      select 1 from study_sessions
      where study_sessions.id = study_reviews.study_session_id
      and study_sessions.user_id = auth.uid()
    )
  );

-- anon role: no insert access
create policy "study_reviews_insert_anon"
  on study_reviews for insert
  to anon
  with check (false);

-- authenticated role: users can only insert reviews for their own study sessions
create policy "study_reviews_insert_authenticated"
  on study_reviews for insert
  to authenticated
  with check (
    exists (
      select 1 from study_sessions
      where study_sessions.id = study_reviews.study_session_id
      and study_sessions.user_id = auth.uid()
    )
  );

-- anon role: no update access
create policy "study_reviews_update_anon"
  on study_reviews for update
  to anon
  using (false);

-- authenticated role: users can only update reviews from their own study sessions
create policy "study_reviews_update_authenticated"
  on study_reviews for update
  to authenticated
  using (
    exists (
      select 1 from study_sessions
      where study_sessions.id = study_reviews.study_session_id
      and study_sessions.user_id = auth.uid()
    )
  );

-- anon role: no delete access
create policy "study_reviews_delete_anon"
  on study_reviews for delete
  to anon
  using (false);

-- authenticated role: users can only delete reviews from their own study sessions
create policy "study_reviews_delete_authenticated"
  on study_reviews for delete
  to authenticated
  using (
    exists (
      select 1 from study_sessions
      where study_sessions.id = study_reviews.study_session_id
      and study_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. SYSTEM_LOGS TABLE POLICIES
-- ============================================================================
-- rationale: system logs are insert-only for authenticated users
-- only admins should be able to read system logs (not implemented in this migration)
-- anon users have no access
-- WARNING: consider implementing admin-only read access in a future migration

-- anon role: no access to system logs
create policy "system_logs_select_anon"
  on system_logs for select
  to anon
  using (false);

-- authenticated role: no read access (consider adding admin role check in future)
create policy "system_logs_select_authenticated"
  on system_logs for select
  to authenticated
  using (false);

-- anon role: no insert access
create policy "system_logs_insert_anon"
  on system_logs for insert
  to anon
  with check (false);

-- authenticated role: users can insert system logs (append-only)
create policy "system_logs_insert_authenticated"
  on system_logs for insert
  to authenticated
  with check (true);

-- anon role: no update access
create policy "system_logs_update_anon"
  on system_logs for update
  to anon
  using (false);

-- authenticated role: no update access (logs are immutable)
create policy "system_logs_update_authenticated"
  on system_logs for update
  to authenticated
  using (false);

-- anon role: no delete access
create policy "system_logs_delete_anon"
  on system_logs for delete
  to anon
  using (false);

-- authenticated role: no delete access (logs are immutable)
create policy "system_logs_delete_authenticated"
  on system_logs for delete
  to authenticated
  using (false);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- all tables now have rls enabled with comprehensive security policies
-- policies ensure users can only access their own data (using auth.uid())
-- anon users are denied all access
-- system_logs are append-only for authenticated users
-- note: no users table policies needed - using auth.users directly
