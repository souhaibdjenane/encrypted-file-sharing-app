CREATE TABLE file_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wrapped_key TEXT NOT NULL, -- AES file key wrapped with user's RSA-OAEP public key (base64)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_id, user_id)
);

COMMENT ON TABLE file_keys IS 'Per-user wrapped file encryption keys. Each row stores an AES-256-GCM file key wrapped with the target user RSA-OAEP public key.';
