CREATE TABLE shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_by   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- nullable for public links
  token       TEXT UNIQUE NOT NULL, -- unique share token for link-based access
  can_download BOOLEAN NOT NULL DEFAULT true,
  can_reshare  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  revoked     BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE shares IS 'File sharing records. shared_with is NULL for public link shares.';
COMMENT ON COLUMN shares.token IS 'Unique token for share link URLs.';
