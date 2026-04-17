-- ============================================================
-- War Room 2026 — Theatres (Cross-Domain Strategic Supergroups)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- A Theatre groups related goals across multiple domains into
-- a unified strategic objective. Example: "Become a Professional
-- Developer" can contain backend goals (Skill), language goals
-- (Linguistic), and fitness goals (Physical).
-- ============================================================

create table theatres (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text not null default '',
  icon        text,                              -- emoji icon
  color       text not null default '#8b5cf6',   -- purple default (distinct from domain colors)
  status      text not null default 'active',    -- 'active', 'completed', 'archived'
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Link goals to theatres (optional — a goal can exist without a theatre)
alter table goals add column if not exists theatre_id uuid references theatres(id) on delete set null;
create index idx_goals_theatre_id on goals(theatre_id);

-- RLS
alter table theatres enable row level security;
create policy "Allow all on theatres" on theatres for all using (true) with check (true);
