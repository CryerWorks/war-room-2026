-- ============================================================
-- War Room 2026 — Module Dependencies
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- Models prerequisite relationships between modules.
-- "Module A depends on Module B" means A is blocked until B is completed.
--
-- This is a directed acyclic graph (DAG) — edges go from dependent
-- to prerequisite. A module can have multiple dependencies and can
-- be a prerequisite for multiple others.
--
-- The constraint is enforced in the application layer (soft block)
-- rather than at the database level, because there may be legitimate
-- reasons to override it (e.g., skipping ahead in a learning path).
-- ============================================================

create table module_dependencies (
  id            uuid primary key default uuid_generate_v4(),
  module_id     uuid not null references modules(id) on delete cascade,
  depends_on_id uuid not null references modules(id) on delete cascade,
  created_at    timestamptz not null default now(),
  -- Prevent duplicate dependency relationships
  unique(module_id, depends_on_id)
);

-- Prevent self-dependencies at the database level
alter table module_dependencies
  add constraint no_self_dependency
  check (module_id != depends_on_id);

create index idx_module_deps_module on module_dependencies(module_id);
create index idx_module_deps_depends_on on module_dependencies(depends_on_id);

-- RLS
alter table module_dependencies enable row level security;
create policy "Allow all on module_dependencies" on module_dependencies for all using (true) with check (true);
