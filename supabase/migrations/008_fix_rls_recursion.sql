-- Fix infinite recursion in RLS policies

-- The previous `shares_owner_all` policy queried the `files` table to check ownership.
-- However, the `files` table also queries the `shares` table in `files_shared_select` to check permissions.
-- This creates an infinite evaluation loop in PostgreSQL (Infinite recursion detected in policy).

DROP POLICY IF EXISTS shares_owner_all ON shares;

-- Since `shared_by` is stored directly on the `shares` table (and represents the person who created the share),
-- we can validate against `shared_by` to avoid querying the `files` table entirely.
CREATE POLICY shares_owner_all ON shares
  FOR ALL
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);
