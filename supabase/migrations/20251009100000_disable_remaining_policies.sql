-- ==========================================================================
-- Migration: Disable Remaining Policies
-- Description: Drops any RLS policies that may have been missed by
--              20251008195901_disable_all_policies.sql so the DB is fully open
--              for MVP testing. This migration is intended to be temporary and
--              should be reverted before production deployment.
-- Author: Automated patch
-- Date: 2025-10-09
-- ===========================================================================

-- Use `drop policy if exists` for safety

-- users table (extra defensive names)
drop policy if exists users_select_policy_anon on users;
drop policy if exists users_select_policy_authenticated on users;
drop policy if exists users_update_policy_anon on users;
drop policy if exists users_update_policy_authenticated on users;
drop policy if exists users_delete_policy_anon on users;
drop policy if exists users_delete_policy_authenticated on users;

drop policy if exists users_select_policy on users;
drop policy if exists users_insert_policy on users;

-- flashcard_sets (extra)
drop policy if exists flashcard_sets_select_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_select_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_insert_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_insert_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_update_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_update_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_delete_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_delete_policy_authenticated on flashcard_sets;

drop policy if exists flashcard_sets_select_policy on flashcard_sets;

-- flashcards (extra)
drop policy if exists flashcards_select_policy_anon on flashcards;
drop policy if exists flashcards_select_policy_authenticated on flashcards;
drop policy if exists flashcards_insert_policy_anon on flashcards;
drop policy if exists flashcards_insert_policy_authenticated on flashcards;
drop policy if exists flashcards_update_policy_anon on flashcards;
drop policy if exists flashcards_update_policy_authenticated on flashcards;
drop policy if exists flashcards_delete_policy_anon on flashcards;
drop policy if exists flashcards_delete_policy_authenticated on flashcards;

drop policy if exists flashcards_select_policy on flashcards;

-- flashcard_progress (extra)
drop policy if exists flashcard_progress_select_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_select_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_insert_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_insert_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_update_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_update_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_delete_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_delete_policy_authenticated on flashcard_progress;

drop policy if exists flashcard_progress_select_policy on flashcard_progress;

-- generation_sessions (ensure all names removed)
drop policy if exists generation_sessions_select_policy_anon on generation_sessions;
drop policy if exists generation_sessions_select_policy_authenticated on generation_sessions;
drop policy if exists generation_sessions_insert_policy_anon on generation_sessions;
drop policy if exists generation_sessions_insert_policy_authenticated on generation_sessions;
-- possible temporary policy names
drop policy if exists generation_sessions_insert_policy_anon_mvp on generation_sessions;
drop policy if exists generation_sessions_insert_policy_mvp on generation_sessions;

drop policy if exists generation_sessions_select_policy on generation_sessions;

-- study_sessions
drop policy if exists study_sessions_select_policy_anon on study_sessions;
drop policy if exists study_sessions_select_policy_authenticated on study_sessions;
drop policy if exists study_sessions_insert_policy_anon on study_sessions;
drop policy if exists study_sessions_insert_policy_authenticated on study_sessions;
drop policy if exists study_sessions_update_policy_anon on study_sessions;
drop policy if exists study_sessions_update_policy_authenticated on study_sessions;
drop policy if exists study_sessions_delete_policy_anon on study_sessions;
drop policy if exists study_sessions_delete_policy_authenticated on study_sessions;

drop policy if exists study_sessions_select_policy on study_sessions;

-- study_reviews
drop policy if exists study_reviews_select_policy_anon on study_reviews;
drop policy if exists study_reviews_select_policy_authenticated on study_reviews;
drop policy if exists study_reviews_insert_policy_anon on study_reviews;
drop policy if exists study_reviews_insert_policy_authenticated on study_reviews;

drop policy if exists study_reviews_select_policy on study_reviews;

-- system_logs (ensure any extra policy names cleared)
drop policy if exists system_logs_select_policy_anon on system_logs;
drop policy if exists system_logs_select_policy_authenticated on system_logs;
drop policy if exists system_logs_insert_policy_anon on system_logs;
drop policy if exists system_logs_insert_policy_authenticated on system_logs;
-- possible RPC-created or temp names
drop policy if exists system_logs_insert_policy_anon_mvp on system_logs;

-- Final safety: ensure RLS disabled for these tables (optional in migration)
-- WARNING: disabling RLS entirely opens tables to all roles; only use for local MVP/testing.
-- Uncomment the lines below if you want to disable RLS completely for these tables.
-- alter table generation_sessions disable row level security;
-- alter table system_logs disable row level security;
-- alter table users disable row level security;

-- End of migration
