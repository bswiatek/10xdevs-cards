-- ============================================================================
-- Migration: Disable All Policies
-- Description: Disables all Row Level Security policies defined in the
--              initial flashcard schema migration (20251008174200)
-- Author: Database Migration System
-- Date: 2025-01-08
-- ============================================================================

-- ============================================================================
-- DROP POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- users table policies
-- ----------------------------------------------------------------------------
drop policy if exists users_select_policy_anon on users;
drop policy if exists users_select_policy_authenticated on users;
drop policy if exists users_update_policy_anon on users;
drop policy if exists users_update_policy_authenticated on users;
drop policy if exists users_delete_policy_anon on users;
drop policy if exists users_delete_policy_authenticated on users;

-- ----------------------------------------------------------------------------
-- flashcard_sets table policies
-- ----------------------------------------------------------------------------
drop policy if exists flashcard_sets_select_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_select_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_insert_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_insert_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_update_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_update_policy_authenticated on flashcard_sets;
drop policy if exists flashcard_sets_delete_policy_anon on flashcard_sets;
drop policy if exists flashcard_sets_delete_policy_authenticated on flashcard_sets;

-- ----------------------------------------------------------------------------
-- flashcards table policies
-- ----------------------------------------------------------------------------
drop policy if exists flashcards_select_policy_anon on flashcards;
drop policy if exists flashcards_select_policy_authenticated on flashcards;
drop policy if exists flashcards_insert_policy_anon on flashcards;
drop policy if exists flashcards_insert_policy_authenticated on flashcards;
drop policy if exists flashcards_update_policy_anon on flashcards;
drop policy if exists flashcards_update_policy_authenticated on flashcards;
drop policy if exists flashcards_delete_policy_anon on flashcards;
drop policy if exists flashcards_delete_policy_authenticated on flashcards;

-- ----------------------------------------------------------------------------
-- flashcard_progress table policies
-- ----------------------------------------------------------------------------
drop policy if exists flashcard_progress_select_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_select_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_insert_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_insert_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_update_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_update_policy_authenticated on flashcard_progress;
drop policy if exists flashcard_progress_delete_policy_anon on flashcard_progress;
drop policy if exists flashcard_progress_delete_policy_authenticated on flashcard_progress;

-- ----------------------------------------------------------------------------
-- generation_sessions table policies
-- ----------------------------------------------------------------------------
drop policy if exists generation_sessions_select_policy_anon on generation_sessions;
drop policy if exists generation_sessions_select_policy_authenticated on generation_sessions;
drop policy if exists generation_sessions_insert_policy_anon on generation_sessions;
drop policy if exists generation_sessions_insert_policy_authenticated on generation_sessions;

-- ----------------------------------------------------------------------------
-- study_sessions table policies
-- ----------------------------------------------------------------------------
drop policy if exists study_sessions_select_policy_anon on study_sessions;
drop policy if exists study_sessions_select_policy_authenticated on study_sessions;
drop policy if exists study_sessions_insert_policy_anon on study_sessions;
drop policy if exists study_sessions_insert_policy_authenticated on study_sessions;
drop policy if exists study_sessions_update_policy_anon on study_sessions;
drop policy if exists study_sessions_update_policy_authenticated on study_sessions;
drop policy if exists study_sessions_delete_policy_anon on study_sessions;
drop policy if exists study_sessions_delete_policy_authenticated on study_sessions;

-- ----------------------------------------------------------------------------
-- study_reviews table policies
-- ----------------------------------------------------------------------------
drop policy if exists study_reviews_select_policy_anon on study_reviews;
drop policy if exists study_reviews_select_policy_authenticated on study_reviews;
drop policy if exists study_reviews_insert_policy_anon on study_reviews;
drop policy if exists study_reviews_insert_policy_authenticated on study_reviews;

-- ----------------------------------------------------------------------------
-- system_logs table policies
-- ----------------------------------------------------------------------------
drop policy if exists system_logs_select_policy_anon on system_logs;
drop policy if exists system_logs_select_policy_authenticated on system_logs;
drop policy if exists system_logs_insert_policy_anon on system_logs;
drop policy if exists system_logs_insert_policy_authenticated on system_logs;
