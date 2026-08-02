ALTER TABLE lead_calls
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT;

CREATE INDEX IF NOT EXISTS idx_lead_calls_outcome
  ON lead_calls (outcome);
