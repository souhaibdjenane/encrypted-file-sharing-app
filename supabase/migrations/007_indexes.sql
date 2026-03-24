-- Performance indexes

-- Files: lookup by owner
CREATE INDEX idx_files_owner_id ON files(owner_id);

-- File keys: lookup by user and by file
CREATE INDEX idx_file_keys_user_id ON file_keys(user_id);
CREATE INDEX idx_file_keys_file_id ON file_keys(file_id);

-- Shares: lookup by recipient, file, and shared_by
CREATE INDEX idx_shares_shared_with ON shares(shared_with);
CREATE INDEX idx_shares_file_id ON shares(file_id);
CREATE INDEX idx_shares_shared_by ON shares(shared_by);
CREATE INDEX idx_shares_token ON shares(token);

-- Audit logs: lookup by user and file
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_file_id ON audit_logs(file_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
