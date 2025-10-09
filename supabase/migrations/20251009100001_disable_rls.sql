-- ============================================================================
-- Migration: Disable RLS for all tables
-- Description: Disables Row Level Security for all application tables as defined in the initial flashcard schema migration. This migration is used in MVP mode to allow unrestricted access to these tables.
-- Author: Database Migration System
-- Date: 2025-10-09
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards DISABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs DISABLE ROW LEVEL SECURITY;
