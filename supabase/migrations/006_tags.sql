-- ============================================================
-- War Room 2026 — Tags / Labels
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Tags are cross-cutting labels that span the hierarchy.
-- A module can have multiple tags, a tag applies to many modules.
-- This enables analysis like "how many hours on practice vs theory?"
-- ============================================================

-- ============================================================
-- TAGS — the label definitions
-- ============================================================
create table tags (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  color       text not null default '#71717a',
  created_at  timestamptz not null default now()
);

-- Seed useful starter tags
insert into tags (name, color) values
  ('practice',  '#3b82f6'),   -- blue
  ('theory',    '#8b5cf6'),   -- purple
  ('reading',   '#6366f1'),   -- indigo
  ('project',   '#f59e0b'),   -- amber
  ('review',    '#10b981'),   -- emerald
  ('exercise',  '#ef4444'),   -- red
  ('listening', '#06b6d4'),   -- cyan
  ('writing',   '#ec4899');   -- pink

-- ============================================================
-- MODULE_TAGS — many-to-many join table
-- ============================================================
create table module_tags (
  id         uuid primary key default uuid_generate_v4(),
  module_id  uuid not null references modules(id) on delete cascade,
  tag_id     uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(module_id, tag_id)
);

create index idx_module_tags_module on module_tags(module_id);
create index idx_module_tags_tag on module_tags(tag_id);

-- RLS
alter table tags enable row level security;
alter table module_tags enable row level security;
create policy "Allow all on tags" on tags for all using (true) with check (true);
create policy "Allow all on module_tags" on module_tags for all using (true) with check (true);
