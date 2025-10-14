-- ============================================================================
-- Migration: Migrate from custom users table to auth.users
-- Description: Removes the custom users table and migrates all foreign keys
--              to reference auth.users directly. Simplifies RLS policies.
-- Tables affected: users (dropped), flashcard_sets, generation_sessions,
--                  study_sessions, system_logs
-- Author: Database Migration System
-- Date: 2025-10-14
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING POLICIES THAT DEPEND ON is_admin()
-- ============================================================================

-- Drop users policies
drop policy if exists users_select_policy_anon on users;
drop policy if exists users_select_policy_authenticated on users;
drop policy if exists users_update_policy_anon on users;
drop policy if exists users_update_policy_authenticated on users;
drop policy if exists users_delete_policy_anon on users;
drop policy if exists users_delete_policy_authenticated on users;

-- Drop flashcard_sets policies that use is_admin()
drop policy if exists flashcard_sets_select_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_update_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_delete_policy_authenticated on flashcard_sets;

-- Drop flashcards policies that use is_admin()
drop policy if exists flashcards_select_policy_authenticated on flashcards;
drop policy if exists flashcards_update_policy_authenticated on flashcards;
drop policy if exists flashcards_delete_policy_authenticated on flashcards;

-- Drop flashcard_progress policies that use is_admin()
drop policy if exists flashcard_progress_select_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_update_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_delete_policy_authenticated on flashcard_progress;

-- Drop generation_sessions policies that use is_admin()
drop policy if exists generation_sessions_select_policy_authenticated on generation_sessions;

-- Drop study_sessions policies that use is_admin()
drop policy if exists study_sessions_select_policy_authenticated on study_sessions;
drop policy if exists study_sessions_update_policy_authenticated on study_sessions;
drop policy if exists study_sessions_delete_policy_authenticated on study_sessions;

-- Drop study_reviews policies that use is_admin()
drop policy if exists study_reviews_select_policy_authenticated on study_reviews;

-- Drop system_logs policies that use is_admin()
drop policy if exists system_logs_select_policy_authenticated on system_logs;

-- ============================================================================
-- 2. DROP FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Drop foreign key constraints that reference users table
alter table flashcard_sets drop constraint if exists flashcard_sets_user_id_fkey;
alter table generation_sessions drop constraint if exists generation_sessions_user_id_fkey;
alter table study_sessions drop constraint if exists study_sessions_user_id_fkey;
alter table system_logs drop constraint if exists system_logs_user_id_fkey;

-- ============================================================================
-- 3. DROP INDEXES ON user_id COLUMNS
-- ============================================================================

-- Drop indexes that will be recreated
drop index if exists idx_flashcard_sets_user_id;
drop index if exists idx_flashcard_sets_user_created;
drop index if exists idx_generation_sessions_user_id;
drop index if exists idx_study_sessions_user_id;
drop index if exists idx_system_logs_user_id;

-- ============================================================================
-- 4. DROP CUSTOM users TABLE AND RELATED OBJECTS
-- ============================================================================

-- Drop is_admin function (no longer needed without roles)
drop function if exists is_admin();

-- Drop users table (CASCADE will drop all dependent objects)
drop table if exists users cascade;

-- Drop user_role enum (now safe since users table is gone)
drop type if exists user_role;

-- ============================================================================
-- 5. ADD FOREIGN KEY CONSTRAINTS TO auth.users
-- ============================================================================

-- Add foreign key constraints referencing auth.users
-- Note: ON DELETE CASCADE ensures cleanup when users are deleted from auth

alter table flashcard_sets
  add constraint flashcard_sets_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table generation_sessions
  add constraint generation_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table study_sessions
  add constraint study_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table system_logs
  add constraint system_logs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- ============================================================================
-- 6. RECREATE INDEXES
-- ============================================================================

-- Recreate indexes for query performance
create index idx_flashcard_sets_user_id on flashcard_sets(user_id);
create index idx_flashcard_sets_user_created on flashcard_sets(user_id, created_at desc);
create index idx_generation_sessions_user_id on generation_sessions(user_id);
create index idx_study_sessions_user_id on study_sessions(user_id);
create index idx_system_logs_user_id on system_logs(user_id);

-- ============================================================================
-- 7. RECREATE SIMPLIFIED RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 flashcard_sets policies (simplified - no admin role)
-- ----------------------------------------------------------------------------

-- Authenticated users can view own sets only
create policy flashcard_sets_select_policy_authenticated on flashcard_sets
  for select
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can update own sets only
create policy flashcard_sets_update_policy_authenticated on flashcard_sets
  for update
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can delete own sets only
create policy flashcard_sets_delete_policy_authenticated on flashcard_sets
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 7.2 flashcards policies (simplified)
-- ----------------------------------------------------------------------------

-- Authenticated users can view flashcards from own sets
create policy flashcards_select_policy_authenticated on flashcards
  for select
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id and user_id = auth.uid()
    )
  );

-- Authenticated users can update flashcards in own sets
create policy flashcards_update_policy_authenticated on flashcards
  for update
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id and user_id = auth.uid()
    )
  );

-- Authenticated users can delete flashcards from own sets
create policy flashcards_delete_policy_authenticated on flashcards
  for delete
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id and user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7.3 flashcard_progress policies (simplified)
-- ----------------------------------------------------------------------------

-- Authenticated users can view progress for own flashcards
create policy flashcard_progress_select_policy_authenticated on flashcard_progress
  for select
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id and fs.user_id = auth.uid()
    )
  );

-- Authenticated users can update progress for own flashcards
create policy flashcard_progress_update_policy_authenticated on flashcard_progress
  for update
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id and fs.user_id = auth.uid()
    )
  );

-- Authenticated users can delete progress for own flashcards
create policy flashcard_progress_delete_policy_authenticated on flashcard_progress
  for delete
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id and fs.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7.4 generation_sessions policies (simplified)
-- ----------------------------------------------------------------------------

-- Authenticated users can view own sessions
create policy generation_sessions_select_policy_authenticated on generation_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 7.5 study_sessions policies (simplified)
-- ----------------------------------------------------------------------------

-- Authenticated users can view own sessions
create policy study_sessions_select_policy_authenticated on study_sessions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can update own sessions
create policy study_sessions_update_policy_authenticated on study_sessions
  for update
  to authenticated
  using (user_id = auth.uid());

-- Authenticated users can delete own sessions
create policy study_sessions_delete_policy_authenticated on study_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 7.6 study_reviews policies (simplified)
-- ----------------------------------------------------------------------------

-- Authenticated users can view reviews from own sessions
create policy study_reviews_select_policy_authenticated on study_reviews
  for select
  to authenticated
  using (
    exists (
      select 1 from study_sessions
      where id = study_session_id and user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7.7 system_logs policies (simplified - all authenticated users can view)
-- ----------------------------------------------------------------------------

-- All authenticated users can view system logs (simplified from admin-only)
-- Note: In production, you may want to restrict this further
create policy system_logs_select_policy_authenticated on system_logs
  for select
  to authenticated
  using (true);

-- ============================================================================
-- 8. UPDATE TABLE COMMENTS
-- ============================================================================

comment on table flashcard_sets is 'flashcard collections owned by authenticated users (auth.users)';
comment on table generation_sessions is 'ai generation session metrics for authenticated users (auth.users)';
comment on table study_sessions is 'study sessions for authenticated users (auth.users)';
comment on table system_logs is 'system event and error logging (references auth.users)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- All tables now reference auth.users directly
-- No more custom users table or role management
-- RLS policies simplified to only check auth.uid()
