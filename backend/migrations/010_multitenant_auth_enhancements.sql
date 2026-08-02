ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS registration_password_hash TEXT;

UPDATE users
   SET must_change_password = COALESCE(must_change_password, FALSE)
 WHERE must_change_password IS NULL;
