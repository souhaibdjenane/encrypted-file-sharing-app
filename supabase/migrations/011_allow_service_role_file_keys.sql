-- Allow service role to manage file_keys (for edge function operations)
-- This policy bypasses normal RLS restrictions when using SERVICE_ROLE_KEY

CREATE POLICY file_keys_service_all ON file_keys
  FOR ALL
  USING (
    -- Allow service role (indicated by null auth.uid()) to access all rows
    auth.role() = 'service_role'
  )
  WITH CHECK (
    -- Allow service role to modify all rows
    auth.role() = 'service_role'
  );
