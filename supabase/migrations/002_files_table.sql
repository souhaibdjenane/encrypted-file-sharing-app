CREATE TABLE files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  encrypted_metadata JSONB, -- { ciphertext: string, iv: string }
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type     TEXT,
  iv            TEXT NOT NULL, -- base64-encoded IV used for file encryption
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  download_limit INT,
  download_count INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE files IS 'Encrypted files stored in Supabase Storage. Only encrypted blobs are stored server-side.';
COMMENT ON COLUMN files.encrypted_metadata IS 'AES-256-GCM encrypted metadata (filename, type, etc.) as {ciphertext, iv} in base64.';
COMMENT ON COLUMN files.iv IS 'Base64-encoded 12-byte IV used for AES-256-GCM file encryption.';
