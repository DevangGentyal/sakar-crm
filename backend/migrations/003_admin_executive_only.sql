-- Normalize the user's VARCHAR role column. No user_role enum is required.
UPDATE users SET role = 'EXECUTIVE'
WHERE UPPER(TRIM(role)) NOT IN ('ADMIN', 'EXECUTIVE');

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'EXECUTIVE';

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'EXECUTIVE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
