-- ============================================================================
-- Migration: Initial Flashcard Schema
-- Description: Creates the complete database schema for AI-powered flashcard
--              generation and spaced repetition learning system using FSRS
-- Tables affected: users, flashcard_sets, flashcards, flashcard_progress,
--                  generation_sessions, study_sessions, study_reviews, system_logs
-- Author: Database Migration System
-- Date: 2025-01-08
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- user role type for access control
create type user_role as enum ('user', 'admin');

-- flashcard state for fsrs spaced repetition algorithm
create type flashcard_state as enum ('New', 'Learning', 'Review', 'Relearning');

-- log level type for system logging
create type log_level_type as enum ('INFO', 'WARNING', 'ERROR');

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 users
-- ----------------------------------------------------------------------------
-- extends supabase auth with role-based access control
-- managed by supabase auth, but extended with custom role field
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role user_role not null default 'user',
  created_at timestamptz not null default now()
);

comment on table users is 'user profiles extended from supabase auth with role-based access control';
comment on column users.id is 'unique user identifier (managed by supabase auth)';
comment on column users.email is 'user email address (unique)';
comment on column users.role is 'user role for access control (user/admin)';
comment on column users.created_at is 'account creation timestamp';

-- ----------------------------------------------------------------------------
-- 2.2 flashcard_sets
-- ----------------------------------------------------------------------------
-- collections of flashcards owned by users
create table flashcard_sets (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  cards_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table flashcard_sets is 'flashcard collections owned by users';
comment on column flashcard_sets.id is 'unique set identifier';
comment on column flashcard_sets.user_id is 'owner of the flashcard set';
comment on column flashcard_sets.title is 'name of the flashcard set';
comment on column flashcard_sets.cards_count is 'cached count of flashcards (maintained by trigger)';
comment on column flashcard_sets.created_at is 'set creation timestamp';
comment on column flashcard_sets.updated_at is 'last modification timestamp';

-- ----------------------------------------------------------------------------
-- 2.3 flashcards
-- ----------------------------------------------------------------------------
-- individual flashcards belonging to sets
create table flashcards (
  id bigserial primary key,
  flashcard_set_id bigint not null references flashcard_sets(id) on delete cascade,
  front text not null check (char_length(front) <= 200),
  back text not null check (char_length(back) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table flashcards is 'individual flashcards with question and answer';
comment on column flashcards.id is 'unique flashcard identifier';
comment on column flashcards.flashcard_set_id is 'parent set this flashcard belongs to';
comment on column flashcards.front is 'question side of the flashcard (max 200 characters)';
comment on column flashcards.back is 'answer side of the flashcard (max 500 characters)';
comment on column flashcards.created_at is 'flashcard creation timestamp';
comment on column flashcards.updated_at is 'last modification timestamp';

-- ----------------------------------------------------------------------------
-- 2.4 flashcard_progress
-- ----------------------------------------------------------------------------
-- learning progress data for fsrs spaced repetition algorithm (1:1 with flashcards)
create table flashcard_progress (
  id bigserial primary key,
  flashcard_id bigint unique not null references flashcards(id) on delete cascade,
  stability decimal(10, 4),
  difficulty decimal(10, 4),
  elapsed_days int,
  scheduled_days int,
  reps int not null default 0,
  lapses int not null default 0,
  state flashcard_state not null default 'New',
  last_review timestamptz,
  due timestamptz not null default now()
);

comment on table flashcard_progress is 'fsrs learning progress tracking for each flashcard';
comment on column flashcard_progress.id is 'unique progress record identifier';
comment on column flashcard_progress.flashcard_id is 'flashcard this progress belongs to (1:1 relationship)';
comment on column flashcard_progress.stability is 'fsrs stability parameter (memory strength)';
comment on column flashcard_progress.difficulty is 'fsrs difficulty parameter';
comment on column flashcard_progress.elapsed_days is 'days since last review';
comment on column flashcard_progress.scheduled_days is 'days until next review';
comment on column flashcard_progress.reps is 'total number of reviews';
comment on column flashcard_progress.lapses is 'number of failed reviews';
comment on column flashcard_progress.state is 'current learning state (new/learning/review/relearning)';
comment on column flashcard_progress.last_review is 'timestamp of last review';
comment on column flashcard_progress.due is 'when this flashcard is due for next review';

-- ----------------------------------------------------------------------------
-- 2.5 generation_sessions
-- ----------------------------------------------------------------------------
-- immutable metrics for ai flashcard generation sessions
create table generation_sessions (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  input_text text not null,
  input_length int not null,
  generated_count int not null default 0,
  accepted_count int not null default 0,
  model_name text not null,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  cost_usd decimal(10, 6),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table generation_sessions is 'immutable ai generation session metrics and metadata';
comment on column generation_sessions.id is 'unique session identifier';
comment on column generation_sessions.user_id is 'user who initiated generation';
comment on column generation_sessions.input_text is 'source text used for generation';
comment on column generation_sessions.input_length is 'length of input text in characters';
comment on column generation_sessions.generated_count is 'number of flashcards generated by ai';
comment on column generation_sessions.accepted_count is 'number of flashcards accepted by user';
comment on column generation_sessions.model_name is 'ai model used for generation';
comment on column generation_sessions.prompt_tokens is 'tokens used in prompt';
comment on column generation_sessions.completion_tokens is 'tokens used in completion';
comment on column generation_sessions.total_tokens is 'total tokens used';
comment on column generation_sessions.cost_usd is 'estimated cost in usd';
comment on column generation_sessions.started_at is 'when generation started';
comment on column generation_sessions.completed_at is 'when generation completed';

-- ----------------------------------------------------------------------------
-- 2.6 study_sessions
-- ----------------------------------------------------------------------------
-- user study sessions for tracking learning activity
create table study_sessions (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  flashcard_set_id bigint not null references flashcard_sets(id) on delete cascade,
  cards_studied int not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

comment on table study_sessions is 'user study sessions for tracking learning activity';
comment on column study_sessions.id is 'unique session identifier';
comment on column study_sessions.user_id is 'user who studied';
comment on column study_sessions.flashcard_set_id is 'flashcard set being studied';
comment on column study_sessions.cards_studied is 'number of cards reviewed in this session';
comment on column study_sessions.started_at is 'when study session started';
comment on column study_sessions.completed_at is 'when study session completed (null if active)';

-- ----------------------------------------------------------------------------
-- 2.7 study_reviews
-- ----------------------------------------------------------------------------
-- immutable individual flashcard review records
create table study_reviews (
  id bigserial primary key,
  study_session_id bigint not null references study_sessions(id) on delete cascade,
  flashcard_id bigint not null references flashcards(id) on delete cascade,
  rating int not null check (rating >= 1 and rating <= 5),
  reviewed_at timestamptz not null default now()
);

comment on table study_reviews is 'immutable individual flashcard review records';
comment on column study_reviews.id is 'unique review record identifier';
comment on column study_reviews.study_session_id is 'study session this review belongs to';
comment on column study_reviews.flashcard_id is 'flashcard that was reviewed';
comment on column study_reviews.rating is 'user rating (1-5) for recall quality';
comment on column study_reviews.reviewed_at is 'when this review occurred';

-- ----------------------------------------------------------------------------
-- 2.8 system_logs
-- ----------------------------------------------------------------------------
-- system event and error logging for monitoring and debugging
create table system_logs (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  level log_level_type not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table system_logs is 'system event and error logging for monitoring';
comment on column system_logs.id is 'unique log entry identifier';
comment on column system_logs.user_id is 'user associated with this log (null for system events)';
comment on column system_logs.level is 'log severity level (info/warning/error)';
comment on column system_logs.message is 'log message describing the event';
comment on column system_logs.metadata is 'flexible json data for additional context';
comment on column system_logs.created_at is 'when this log entry was created';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- foreign key indexes for join performance
create index idx_flashcard_sets_user_id on flashcard_sets(user_id);
create index idx_flashcards_flashcard_set_id on flashcards(flashcard_set_id);
create index idx_flashcard_progress_flashcard_id on flashcard_progress(flashcard_id);
create index idx_generation_sessions_user_id on generation_sessions(user_id);
create index idx_study_sessions_user_id on study_sessions(user_id);
create index idx_study_sessions_flashcard_set_id on study_sessions(flashcard_set_id);
create index idx_study_reviews_study_session_id on study_reviews(study_session_id);
create index idx_study_reviews_flashcard_id on study_reviews(flashcard_id);
create index idx_system_logs_user_id on system_logs(user_id);

-- composite index for sorted user flashcard sets
create index idx_flashcard_sets_user_created on flashcard_sets(user_id, created_at desc);

-- simple index on due column for filtering due flashcards
-- note: partial index with now() is not possible as now() is not immutable
create index idx_flashcard_progress_due on flashcard_progress(due);

-- gin index for jsonb queries in system logs
create index idx_system_logs_metadata on system_logs using gin(metadata);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 is_admin() - helper function for rls policies
-- ----------------------------------------------------------------------------
-- security definer function to check if current user has admin role
-- used in rls policies to grant admin access
create or replace function is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from users
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

comment on function is_admin() is 'checks if current user has admin role (used in rls policies)';

-- ----------------------------------------------------------------------------
-- 4.2 update_updated_at_column() - trigger function for updated_at
-- ----------------------------------------------------------------------------
-- automatically updates the updated_at column when a row is modified
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function update_updated_at_column() is 'automatically updates updated_at timestamp on row modification';

-- ----------------------------------------------------------------------------
-- 4.3 update_flashcard_set_cards_count() - maintain denormalized count
-- ----------------------------------------------------------------------------
-- maintains the cards_count field in flashcard_sets when flashcards are added/removed
create or replace function update_flashcard_set_cards_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- increment count when flashcard is added
    update flashcard_sets
    set cards_count = cards_count + 1
    where id = new.flashcard_set_id;
  elsif tg_op = 'DELETE' then
    -- decrement count when flashcard is removed
    update flashcard_sets
    set cards_count = cards_count - 1
    where id = old.flashcard_set_id;
  end if;
  return null;
end;
$$;

comment on function update_flashcard_set_cards_count() is 'maintains denormalized cards_count in flashcard_sets';

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- auto-update updated_at on flashcard_sets modifications
create trigger trigger_flashcard_sets_updated_at
  before update on flashcard_sets
  for each row
  execute function update_updated_at_column();

-- auto-update updated_at on flashcards modifications
create trigger trigger_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

-- maintain cards_count when flashcards are inserted
create trigger trigger_flashcards_insert_count
  after insert on flashcards
  for each row
  execute function update_flashcard_set_cards_count();

-- maintain cards_count when flashcards are deleted
create trigger trigger_flashcards_delete_count
  after delete on flashcards
  for each row
  execute function update_flashcard_set_cards_count();

-- ============================================================================
-- 6. VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 flashcard_sets_with_due_count
-- ----------------------------------------------------------------------------
-- enriches flashcard_sets with count of due flashcards for each set
-- provides efficient access to sets with pending reviews
create view flashcard_sets_with_due_count as
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

comment on view flashcard_sets_with_due_count is 'flashcard sets with count of cards due for review';

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- enable rls on all application tables
alter table users enable row level security;
alter table flashcard_sets enable row level security;
alter table flashcards enable row level security;
alter table flashcard_progress enable row level security;
alter table generation_sessions enable row level security;
alter table study_sessions enable row level security;
alter table study_reviews enable row level security;
alter table system_logs enable row level security;

-- ----------------------------------------------------------------------------
-- 7.1 users policies
-- ----------------------------------------------------------------------------

-- anon users cannot view users
create policy users_select_policy_anon on users
  for select
  to anon
  using (false);

-- authenticated users can view own profile
create policy users_select_policy_authenticated on users
  for select
  to authenticated
  using (id = auth.uid() or is_admin());

-- no insert policy (users created by supabase auth)

-- users can update own profile, admins can update any
create policy users_update_policy_anon on users
  for update
  to anon
  using (false);

create policy users_update_policy_authenticated on users
  for update
  to authenticated
  using (id = auth.uid() or is_admin());

-- users cannot delete own account, admins can delete any
create policy users_delete_policy_anon on users
  for delete
  to anon
  using (false);

create policy users_delete_policy_authenticated on users
  for delete
  to authenticated
  using (is_admin());

-- ----------------------------------------------------------------------------
-- 7.2 flashcard_sets policies
-- ----------------------------------------------------------------------------

-- anon users cannot view flashcard sets
create policy flashcard_sets_select_policy_anon on flashcard_sets
  for select
  to anon
  using (false);

-- authenticated users can view own sets, admins can view all
create policy flashcard_sets_select_policy_authenticated on flashcard_sets
  for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- anon users cannot create flashcard sets
create policy flashcard_sets_insert_policy_anon on flashcard_sets
  for insert
  to anon
  with check (false);

-- authenticated users can create own sets
create policy flashcard_sets_insert_policy_authenticated on flashcard_sets
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- anon users cannot update flashcard sets
create policy flashcard_sets_update_policy_anon on flashcard_sets
  for update
  to anon
  using (false);

-- authenticated users can update own sets, admins can update all
create policy flashcard_sets_update_policy_authenticated on flashcard_sets
  for update
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- anon users cannot delete flashcard sets
create policy flashcard_sets_delete_policy_anon on flashcard_sets
  for delete
  to anon
  using (false);

-- authenticated users can delete own sets, admins can delete all
create policy flashcard_sets_delete_policy_authenticated on flashcard_sets
  for delete
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- ----------------------------------------------------------------------------
-- 7.3 flashcards policies
-- ----------------------------------------------------------------------------

-- anon users cannot view flashcards
create policy flashcards_select_policy_anon on flashcards
  for select
  to anon
  using (false);

-- authenticated users can view flashcards from own sets, admins can view all
create policy flashcards_select_policy_authenticated on flashcards
  for select
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id
        and (user_id = auth.uid() or is_admin())
    )
  );

-- anon users cannot create flashcards
create policy flashcards_insert_policy_anon on flashcards
  for insert
  to anon
  with check (false);

-- authenticated users can add flashcards to own sets
create policy flashcards_insert_policy_authenticated on flashcards
  for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id and user_id = auth.uid()
    )
  );

-- anon users cannot update flashcards
create policy flashcards_update_policy_anon on flashcards
  for update
  to anon
  using (false);

-- authenticated users can update flashcards in own sets, admins can update all
create policy flashcards_update_policy_authenticated on flashcards
  for update
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id
        and (user_id = auth.uid() or is_admin())
    )
  );

-- anon users cannot delete flashcards
create policy flashcards_delete_policy_anon on flashcards
  for delete
  to anon
  using (false);

-- authenticated users can delete flashcards from own sets, admins can delete all
create policy flashcards_delete_policy_authenticated on flashcards
  for delete
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where id = flashcard_set_id
        and (user_id = auth.uid() or is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- 7.4 flashcard_progress policies
-- ----------------------------------------------------------------------------

-- anon users cannot view progress
create policy flashcard_progress_select_policy_anon on flashcard_progress
  for select
  to anon
  using (false);

-- authenticated users can view progress for own flashcards, admins can view all
create policy flashcard_progress_select_policy_authenticated on flashcard_progress
  for select
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id
        and (fs.user_id = auth.uid() or is_admin())
    )
  );

-- anon users cannot create progress records
create policy flashcard_progress_insert_policy_anon on flashcard_progress
  for insert
  to anon
  with check (false);

-- authenticated users can create progress for own flashcards
create policy flashcard_progress_insert_policy_authenticated on flashcard_progress
  for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id and fs.user_id = auth.uid()
    )
  );

-- anon users cannot update progress
create policy flashcard_progress_update_policy_anon on flashcard_progress
  for update
  to anon
  using (false);

-- authenticated users can update progress for own flashcards, admins can update all
create policy flashcard_progress_update_policy_authenticated on flashcard_progress
  for update
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id
        and (fs.user_id = auth.uid() or is_admin())
    )
  );

-- anon users cannot delete progress
create policy flashcard_progress_delete_policy_anon on flashcard_progress
  for delete
  to anon
  using (false);

-- authenticated users can delete progress for own flashcards, admins can delete all
create policy flashcard_progress_delete_policy_authenticated on flashcard_progress
  for delete
  to authenticated
  using (
    exists (
      select 1 from flashcards f
      join flashcard_sets fs on fs.id = f.flashcard_set_id
      where f.id = flashcard_id
        and (fs.user_id = auth.uid() or is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- 7.5 generation_sessions policies (immutable)
-- ----------------------------------------------------------------------------

-- anon users cannot view generation sessions
create policy generation_sessions_select_policy_anon on generation_sessions
  for select
  to anon
  using (false);

-- authenticated users can view own sessions, admins can view all
create policy generation_sessions_select_policy_authenticated on generation_sessions
  for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- anon users cannot create generation sessions
create policy generation_sessions_insert_policy_anon on generation_sessions
  for insert
  to anon
  with check (false);

-- authenticated users can create own sessions
create policy generation_sessions_insert_policy_authenticated on generation_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- no update policy (sessions are immutable)
-- no delete policy (sessions are immutable)

-- ----------------------------------------------------------------------------
-- 7.6 study_sessions policies
-- ----------------------------------------------------------------------------

-- anon users cannot view study sessions
create policy study_sessions_select_policy_anon on study_sessions
  for select
  to anon
  using (false);

-- authenticated users can view own sessions, admins can view all
create policy study_sessions_select_policy_authenticated on study_sessions
  for select
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- anon users cannot create study sessions
create policy study_sessions_insert_policy_anon on study_sessions
  for insert
  to anon
  with check (false);

-- authenticated users can create own sessions
create policy study_sessions_insert_policy_authenticated on study_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- anon users cannot update study sessions
create policy study_sessions_update_policy_anon on study_sessions
  for update
  to anon
  using (false);

-- authenticated users can update own sessions, admins can update all
create policy study_sessions_update_policy_authenticated on study_sessions
  for update
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- anon users cannot delete study sessions
create policy study_sessions_delete_policy_anon on study_sessions
  for delete
  to anon
  using (false);

-- authenticated users can delete own sessions, admins can delete all
create policy study_sessions_delete_policy_authenticated on study_sessions
  for delete
  to authenticated
  using (user_id = auth.uid() or is_admin());

-- ----------------------------------------------------------------------------
-- 7.7 study_reviews policies (immutable)
-- ----------------------------------------------------------------------------

-- anon users cannot view study reviews
create policy study_reviews_select_policy_anon on study_reviews
  for select
  to anon
  using (false);

-- authenticated users can view reviews from own sessions, admins can view all
create policy study_reviews_select_policy_authenticated on study_reviews
  for select
  to authenticated
  using (
    exists (
      select 1 from study_sessions
      where id = study_session_id
        and (user_id = auth.uid() or is_admin())
    )
  );

-- anon users cannot create study reviews
create policy study_reviews_insert_policy_anon on study_reviews
  for insert
  to anon
  with check (false);

-- authenticated users can add reviews to own active sessions
create policy study_reviews_insert_policy_authenticated on study_reviews
  for insert
  to authenticated
  with check (
    exists (
      select 1 from study_sessions
      where id = study_session_id
        and user_id = auth.uid()
        and completed_at is null
    )
  );

-- no update policy (reviews are immutable)
-- no delete policy (reviews are immutable)

-- ----------------------------------------------------------------------------
-- 7.8 system_logs policies (admin only)
-- ----------------------------------------------------------------------------

-- anon users cannot view system logs
create policy system_logs_select_policy_anon on system_logs
  for select
  to anon
  using (false);

-- only admins can view system logs
create policy system_logs_select_policy_authenticated on system_logs
  for select
  to authenticated
  using (is_admin());

-- system can create logs (no restriction for service_role)
create policy system_logs_insert_policy_anon on system_logs
  for insert
  to anon
  with check (true);

create policy system_logs_insert_policy_authenticated on system_logs
  for insert
  to authenticated
  with check (true);

-- no update policy (logs are immutable)
-- no delete policy (logs are immutable)
