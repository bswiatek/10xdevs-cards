-- ============================================================================
-- Migration: Secure flashcard_sets_with_due_count view with RLS
-- Description: Recreates the flashcard_sets_with_due_count view as a security
--              invoker view to ensure it respects RLS policies from base tables.
--              Without this, the view runs with owner privileges and bypasses RLS.
-- Tables/Views affected: flashcard_sets_with_due_count (view)
-- Author: Database Migration System
-- Date: 2025-10-16
-- ============================================================================

-- ============================================================================
-- 1. DROP EXISTING VIEW
-- ============================================================================

-- drop the existing view that bypasses rls
drop view if exists flashcard_sets_with_due_count;

-- ============================================================================
-- 2. CREATE SECURITY INVOKER VIEW
-- ============================================================================

-- recreate view with security_invoker option
-- this ensures the view respects rls policies from base tables
-- and executes with the privileges of the user invoking the view
create view flashcard_sets_with_due_count
with (security_invoker = true)
as
  select 
    fs.id,
    fs.user_id,
    fs.title,
    fs.cards_count,
    fs.created_at,
    fs.updated_at,
    count(fp.id) filter (where fp.due <= now()) as due_cards_count
  from flashcard_sets fs
    left join flashcards f on f.flashcard_set_id = fs.id
    left join flashcard_progress fp on fp.flashcard_id = f.id
  group by fs.id, fs.user_id, fs.title, fs.cards_count, fs.created_at, fs.updated_at;

-- add comment to document the security model
comment on view flashcard_sets_with_due_count is 
  'flashcard sets with count of cards due for review. '
  'uses security_invoker to respect rls policies from base tables. '
  'users can only see their own flashcard sets through inherited rls policies.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- view now respects rls policies from flashcard_sets, flashcards, and flashcard_progress
-- authenticated users will only see their own data
-- anon users will see no data (blocked by base table policies)
