-- ============================================================
-- War Room 2026 — Hierarchy & Progress Tracking
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Adds: operations, phases, user_stats, domain_streaks
-- Alters: goals (icon, status, completion), modules (phase/operation linking)
-- ============================================================

-- ============================================================
-- ALTER GOALS — add icon, status tracking, completion
-- ============================================================
alter table goals add column if not exists icon text;
alter table goals add column if not exists status text not null default 'active';
alter table goals add column if not exists completed_at timestamptz;
alter table goals add column if not exists sort_order integer not null default 0;

-- ============================================================
-- OPERATIONS — structured programs of work under a goal
-- ============================================================
create table operations (
  id            uuid primary key default uuid_generate_v4(),
  goal_id       uuid not null references goals(id) on delete cascade,
  domain_id     uuid not null references domains(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  status        text not null default 'active',
  completed_at  timestamptz,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_operations_goal_id on operations(goal_id);
create index idx_operations_domain_id on operations(domain_id);

-- ============================================================
-- PHASES — sequential stages within an operation
-- ============================================================
create table phases (
  id            uuid primary key default uuid_generate_v4(),
  operation_id  uuid not null references operations(id) on delete cascade,
  title         text not null,
  description   text not null default '',
  sort_order    integer not null default 0,
  status        text not null default 'pending',
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_phases_operation_id on phases(operation_id);

-- ============================================================
-- ALTER MODULES — add optional phase/operation linking
-- ============================================================
alter table modules add column if not exists phase_id uuid references phases(id) on delete set null;
alter table modules add column if not exists operation_id uuid references operations(id) on delete set null;

create index idx_modules_phase_id on modules(phase_id);
create index idx_modules_operation_id on modules(operation_id);

-- ============================================================
-- USER STATS — global streak tracking (single-row table)
-- ============================================================
create table user_stats (
  id              uuid primary key default uuid_generate_v4(),
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_active_date date,
  updated_at      timestamptz not null default now()
);

-- Seed the single user row
insert into user_stats (current_streak, longest_streak) values (0, 0);

-- ============================================================
-- DOMAIN STREAKS — per-domain streak tracking
-- ============================================================
create table domain_streaks (
  id              uuid primary key default uuid_generate_v4(),
  domain_id       uuid not null references domains(id) on delete cascade,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_active_date date,
  updated_at      timestamptz not null default now(),
  unique(domain_id)
);

-- Seed one row per domain
insert into domain_streaks (domain_id)
  select id from domains;

-- ============================================================
-- ROW LEVEL SECURITY — allow all (single-user app)
-- ============================================================
alter table operations    enable row level security;
alter table phases        enable row level security;
alter table user_stats    enable row level security;
alter table domain_streaks enable row level security;

create policy "Allow all on operations"     on operations     for all using (true) with check (true);
create policy "Allow all on phases"         on phases         for all using (true) with check (true);
create policy "Allow all on user_stats"     on user_stats     for all using (true) with check (true);
create policy "Allow all on domain_streaks" on domain_streaks for all using (true) with check (true);
