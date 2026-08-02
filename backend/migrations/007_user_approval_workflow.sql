-- Executive approval workflow and Exotel readiness fields

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exotel_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exotel_user_id TEXT;

-- Existing users were provisioned directly — treat them as approved
UPDATE users
SET approval_status = 'APPROVED'
WHERE approval_status = 'PENDING';

-- Admins are always approved
UPDATE users
SET approval_status = 'APPROVED'
WHERE role = 'ADMIN';

CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users (approval_status);
CREATE INDEX IF NOT EXISTS idx_users_role_approval ON users (role, approval_status);
