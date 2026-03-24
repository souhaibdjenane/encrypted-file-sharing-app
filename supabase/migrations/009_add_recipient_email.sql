-- Add recipient_email to shares table for UI display purposes
-- since PostgREST cannot directly join auth.users

ALTER TABLE shares ADD COLUMN recipient_email TEXT;

COMMENT ON COLUMN shares.recipient_email IS 'Stores the email of the recipient for easy display in the UI without querying auth.users.';
