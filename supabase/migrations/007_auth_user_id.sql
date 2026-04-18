-- ============================================================
-- War Room 2026 — Authentication: Add user_id columns
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- STEP 1 OF 2: Adds nullable user_id columns to all user-owned tables.
-- Run this BEFORE creating your user account.
-- After you sign up through the app, run 008_backfill_and_rls.sql
-- to assign existing data and lock down permissions.
-- ============================================================

-- Add user_id to all user-owned tables.
-- References auth.users(id) which Supabase Auth manages.
-- Nullable initially — will be made NOT NULL after backfill.

alter table goals add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table operations add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table phases add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table modules add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table theatres add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table recurrence_rules add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table user_stats add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table domain_streaks add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Indexes for RLS query performance.
-- Without these, every query with auth.uid() = user_id would do a full table scan.
create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_operations_user_id on operations(user_id);
create index if not exists idx_phases_user_id on phases(user_id);
create index if not exists idx_modules_user_id on modules(user_id);
create index if not exists idx_theatres_user_id on theatres(user_id);
create index if not exists idx_recurrence_rules_user_id on recurrence_rules(user_id);
create index if not exists idx_user_stats_user_id on user_stats(user_id);
create index if not exists idx_domain_streaks_user_id on domain_streaks(user_id);
