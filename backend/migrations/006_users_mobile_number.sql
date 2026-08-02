ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mobile_number TEXT;

CREATE INDEX IF NOT EXISTS idx_users_mobile_number
  ON users (mobile_number);

-- Optional backfill for known existing executives.
-- Replace these placeholder values with the real mobile numbers before applying.
-- UPDATE users SET mobile_number = '9876543210' WHERE email = 'rahul@example.com';