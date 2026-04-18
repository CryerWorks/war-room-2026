-- ============================================================
-- War Room 2026 — Authentication: Backfill + RLS Lockdown
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================
-- STEP 2 OF 2: Run this AFTER creating your user account.
-- This script:
--   1. Assigns all existing data to the first registered user
--   2. Makes user_id NOT NULL (no more anonymous data)
--   3. Drops the old "allow all" RLS policies
--   4. Creates new policies that scope data to the authenticated user
-- ============================================================

-- Step 1: Backfill existing data to the first user
DO $$
DECLARE
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM auth.users ORDER BY created_at LIMIT 1;

  IF first_user IS NULL THEN
    RAISE EXCEPTION 'No users found. Create an account first, then run this migration.';
  END IF;

  RAISE NOTICE 'Assigning all data to user: %', first_user;

  UPDATE goals SET user_id = first_user WHERE user_id IS NULL;
  UPDATE operations SET user_id = first_user WHERE user_id IS NULL;
  UPDATE phases SET user_id = first_user WHERE user_id IS NULL;
  UPDATE modules SET user_id = first_user WHERE user_id IS NULL;
  UPDATE theatres SET user_id = first_user WHERE user_id IS NULL;
  UPDATE recurrence_rules SET user_id = first_user WHERE user_id IS NULL;
  UPDATE user_stats SET user_id = first_user WHERE user_id IS NULL;
  UPDATE domain_streaks SET user_id = first_user WHERE user_id IS NULL;
END $$;

-- Step 2: Make user_id NOT NULL
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE operations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE phases ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE modules ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE theatres ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE recurrence_rules ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_stats ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE domain_streaks ALTER COLUMN user_id SET NOT NULL;

-- Unique constraints for per-user singleton tables
ALTER TABLE user_stats ADD CONSTRAINT user_stats_user_unique UNIQUE (user_id);
ALTER TABLE domain_streaks ADD CONSTRAINT domain_streaks_user_domain_unique UNIQUE (user_id, domain_id);

-- Step 3: Drop old permissive policies
DROP POLICY IF EXISTS "Allow all on goals" ON goals;
DROP POLICY IF EXISTS "Allow all on operations" ON operations;
DROP POLICY IF EXISTS "Allow all on phases" ON phases;
DROP POLICY IF EXISTS "Allow all on modules" ON modules;
DROP POLICY IF EXISTS "Allow all on module_notes" ON module_notes;
DROP POLICY IF EXISTS "Allow all on module_tags" ON module_tags;
DROP POLICY IF EXISTS "Allow all on module_dependencies" ON module_dependencies;
DROP POLICY IF EXISTS "Allow all on theatres" ON theatres;
DROP POLICY IF EXISTS "Allow all on recurrence_rules" ON recurrence_rules;
DROP POLICY IF EXISTS "Allow all on user_stats" ON user_stats;
DROP POLICY IF EXISTS "Allow all on domain_streaks" ON domain_streaks;
DROP POLICY IF EXISTS "Allow all on domains" ON domains;
DROP POLICY IF EXISTS "Allow all on tags" ON tags;

-- Step 4: Create secure RLS policies

-- User-owned tables: auth.uid() = user_id
CREATE POLICY "user_goals" ON goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_operations" ON operations FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_phases" ON phases FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_modules" ON modules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_theatres" ON theatres FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_recurrence_rules" ON recurrence_rules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats_own" ON user_stats FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_domain_streaks" ON domain_streaks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared tables: authenticated users can read, anyone can create tags
CREATE POLICY "read_domains" ON domains FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "read_tags" ON tags FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "create_tags" ON tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "delete_tags" ON tags FOR DELETE
  USING (auth.role() = 'authenticated');

-- Child tables: access based on parent module ownership
CREATE POLICY "notes_via_module" ON module_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_notes.module_id
    AND modules.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_notes.module_id
    AND modules.user_id = auth.uid()
  ));

CREATE POLICY "tags_via_module" ON module_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_tags.module_id
    AND modules.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_tags.module_id
    AND modules.user_id = auth.uid()
  ));

CREATE POLICY "deps_via_module" ON module_dependencies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_dependencies.module_id
    AND modules.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM modules WHERE modules.id = module_dependencies.module_id
    AND modules.user_id = auth.uid()
  ));
