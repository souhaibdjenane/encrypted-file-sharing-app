-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- FILES -------------------------------------------------------
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Owners have full access to their own files
CREATE POLICY files_owner_all ON files
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Shared users can SELECT files shared with them (non-revoked, non-expired)
CREATE POLICY files_shared_select ON files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shares s
      WHERE s.file_id = files.id
        AND s.shared_with = auth.uid()
        AND s.revoked = false
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  );

-- FILE KEYS ---------------------------------------------------
ALTER TABLE file_keys ENABLE ROW LEVEL SECURITY;

-- Users can only access their own wrapped keys
CREATE POLICY file_keys_own ON file_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SHARES ------------------------------------------------------
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- File owners can manage (CRUD) share records for their files
CREATE POLICY shares_owner_all ON shares
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM files f WHERE f.id = shares.file_id AND f.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files f WHERE f.id = shares.file_id AND f.owner_id = auth.uid()
    )
  );

-- Recipients can only SELECT shares directed to them
CREATE POLICY shares_recipient_select ON shares
  FOR SELECT
  USING (auth.uid() = shared_with);

-- AUDIT LOGS --------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit log entries
CREATE POLICY audit_logs_own_select ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);
