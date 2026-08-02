ALTER TABLE lead_history
  ADD COLUMN IF NOT EXISTS changed_fields JSONB NOT NULL DEFAULT '{}'::jsonb;