CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_code TEXT NOT NULL UNIQUE,
  email TEXT,
  mobile TEXT,
  address TEXT,
  logo_url TEXT,
  theme JSONB,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (id, company_name, company_code, email, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Company',
  'DEFAULT',
  NULL,
  'ACTIVE'
)
ON CONFLICT (company_code) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE lead_history
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE lead_followups
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE lead_calls
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

ALTER TABLE plots
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_history_company_id ON lead_history(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_company_id ON lead_followups(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_company_id ON lead_calls(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);

UPDATE users
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE leads
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE lead_history
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE lead_followups
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE lead_calls
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE projects
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;

UPDATE plots
   SET company_id = COALESCE(company_id, '00000000-0000-0000-0000-000000000001')
 WHERE company_id IS NULL;
