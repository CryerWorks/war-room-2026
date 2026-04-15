-- ============================================================
-- War Room 2026 — Initial Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation (Supabase usually has this, but just in case)
create extension if not exists "uuid-ossp";

-- ============================================================
-- DOMAINS — the three goal areas
-- ============================================================
create table domains (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text not null default '',
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- Seed the three domains
insert into domains (name, slug, description, color) values
  ('Linguistic',  'linguistic', 'Language learning and communication goals', '#6366f1'),
  ('Skill',       'skill',      'Technical and programming skill development', '#f59e0b'),
  ('Physical',    'physical',   'Physical fitness and health goals',          '#10b981');

-- ============================================================
-- GOALS — specific objectives within a domain
-- ============================================================
create table goals (
  id          uuid primary key default uuid_generate_v4(),
  domain_id   uuid not null references domains(id) on delete cascade,
  title       text not null,
  description text not null default '',
  target_date date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MODULES — scheduled activities on specific dates
-- ============================================================
create table modules (
  id             uuid primary key default uuid_generate_v4(),
  domain_id      uuid not null references domains(id) on delete cascade,
  goal_id        uuid references goals(id) on delete set null,
  title          text not null,
  description    text not null default '',
  scheduled_date date not null,
  start_time     time,
  end_time       time,
  is_completed   boolean not null default false,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Index for fast calendar lookups (most common query: "all modules for date X")
create index idx_modules_scheduled_date on modules(scheduled_date);

-- Index for domain filtering
create index idx_modules_domain_id on modules(domain_id);

-- ============================================================
-- MODULE NOTES — notes attached to a module
-- ============================================================
create table module_notes (
  id         uuid primary key default uuid_generate_v4(),
  module_id  uuid not null references modules(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index idx_module_notes_module_id on module_notes(module_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- For now, allow all operations (single-user app).
-- If you add auth later, tighten these policies.
-- ============================================================
alter table domains      enable row level security;
alter table goals        enable row level security;
alter table modules      enable row level security;
alter table module_notes enable row level security;

-- Public read/write policies (single-user, no auth)
create policy "Allow all on domains"      on domains      for all using (true) with check (true);
create policy "Allow all on goals"        on goals        for all using (true) with check (true);
create policy "Allow all on modules"      on modules      for all using (true) with check (true);
create policy "Allow all on module_notes" on module_notes for all using (true) with check (true);
