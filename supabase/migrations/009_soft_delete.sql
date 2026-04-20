-- 009_soft_delete.sql
-- Add soft delete support to goals, operations, phases, and modules.
-- Records are marked with a deleted_at timestamp instead of being removed.
-- A cleanup function purges records older than 30 days.

-- Add deleted_at column to each entity table
ALTER TABLE goals ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE operations ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE phases ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE modules ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial indexes: only index non-deleted rows (the common query path)
-- and rows that ARE deleted (for cleanup queries).
CREATE INDEX idx_goals_not_deleted ON goals (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_operations_not_deleted ON operations (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_phases_not_deleted ON phases (id) WHERE deleted_at IS NULL;
CREATE INDEX idx_modules_not_deleted ON modules (id) WHERE deleted_at IS NULL;

-- Index for cleanup: find records deleted more than 30 days ago
CREATE INDEX idx_goals_deleted_at ON goals (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_operations_deleted_at ON operations (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_phases_deleted_at ON phases (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_modules_deleted_at ON modules (deleted_at) WHERE deleted_at IS NOT NULL;

-- Cleanup function: permanently remove soft-deleted records older than 30 days.
-- Call via: SELECT purge_soft_deleted();
-- Can be wired to pg_cron or called manually.
CREATE OR REPLACE FUNCTION purge_soft_deleted()
RETURNS TABLE(
  goals_purged BIGINT,
  operations_purged BIGINT,
  phases_purged BIGINT,
  modules_purged BIGINT
) AS $$
DECLARE
  cutoff TIMESTAMPTZ := now() - interval '30 days';
  g BIGINT;
  o BIGINT;
  p BIGINT;
  m BIGINT;
BEGIN
  -- Delete in leaf-first order to respect foreign keys
  DELETE FROM modules WHERE deleted_at < cutoff;
  GET DIAGNOSTICS m = ROW_COUNT;

  DELETE FROM phases WHERE deleted_at < cutoff;
  GET DIAGNOSTICS p = ROW_COUNT;

  DELETE FROM operations WHERE deleted_at < cutoff;
  GET DIAGNOSTICS o = ROW_COUNT;

  DELETE FROM goals WHERE deleted_at < cutoff;
  GET DIAGNOSTICS g = ROW_COUNT;

  goals_purged := g;
  operations_purged := o;
  phases_purged := p;
  modules_purged := m;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
