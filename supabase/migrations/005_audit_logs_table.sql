CREATE TABLE audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_id     UUID REFERENCES files(id) ON DELETE SET NULL,
  action      TEXT NOT NULL, -- e.g. 'upload', 'download', 'share', 'revoke', 'delete'
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all user actions.';
