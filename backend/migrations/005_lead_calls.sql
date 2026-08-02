CREATE TABLE IF NOT EXISTS lead_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  followup_id UUID REFERENCES lead_followups(id) ON DELETE SET NULL,
  exotel_call_sid TEXT UNIQUE,
  initiated_by UUID NOT NULL REFERENCES users(id),
  initiated_by_name TEXT,
  caller_id TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  status_callback_url TEXT,
  custom_field TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration INTEGER,
  price NUMERIC(12, 2),
  recording_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_calls_lead_created_at
  ON lead_calls (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_calls_followup_id
  ON lead_calls (followup_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_call_sid
  ON lead_calls (exotel_call_sid);