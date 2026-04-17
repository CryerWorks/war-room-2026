-- ============================================================
-- War Room 2026 — Recurring Modules
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Adds recurrence rules for auto-generating module instances.
-- Pattern: define once, generate many. Generated modules are
-- real rows in the modules table (not virtual).
-- ============================================================

-- ============================================================
-- RECURRENCE RULES — defines the repeat pattern
-- ============================================================
create table recurrence_rules (
  id              uuid primary key default uuid_generate_v4(),
  -- What to create each time
  title           text not null,
  description     text not null default '',
  domain_id       uuid not null references domains(id) on delete cascade,
  operation_id    uuid references operations(id) on delete set null,
  phase_id        uuid references phases(id) on delete set null,
  start_time      time,
  end_time        time,
  -- Recurrence pattern
  pattern         text not null default 'weekly',  -- 'daily', 'weekly', 'specific_days'
  days_of_week    integer[] default '{}',          -- 0=Sun, 1=Mon, ..., 6=Sat
  -- Date range
  start_date      date not null,
  end_date        date,                            -- null = indefinite
  -- Generation tracking
  last_generated   date,                           -- last date we generated up to
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_recurrence_rules_domain on recurrence_rules(domain_id);
create index idx_recurrence_rules_active on recurrence_rules(is_active);

-- Link generated modules back to their recurrence rule
alter table modules add column if not exists recurrence_id uuid references recurrence_rules(id) on delete set null;

-- RLS
alter table recurrence_rules enable row level security;
create policy "Allow all on recurrence_rules" on recurrence_rules for all using (true) with check (true);
