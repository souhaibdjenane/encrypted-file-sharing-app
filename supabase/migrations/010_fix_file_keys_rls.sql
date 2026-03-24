-- Allow file owners to insert wrapped keys for other users when sharing
CREATE POLICY file_keys_insert_shared ON file_keys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files f WHERE f.id = file_keys.file_id AND f.owner_id = auth.uid()
    )
  );
