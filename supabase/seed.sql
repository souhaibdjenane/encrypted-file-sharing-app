-- Seed data for local development
-- Creates a test user via Supabase Auth
-- NOTE: This user is for local development only.
-- Password: TestPassword123!

-- Insert a test user into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'testuser@vaultshare.dev',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  '{"public_key": null}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Insert identity for the test user
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'testuser@vaultshare.dev',
  'email',
  '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "testuser@vaultshare.dev"}'::jsonb,
  now(),
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Create the encrypted-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('encrypted-files', 'encrypted-files', false, 524288000)
ON CONFLICT (id) DO NOTHING;
