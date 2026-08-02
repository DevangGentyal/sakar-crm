ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS company_type TEXT;

UPDATE companies
   SET company_type = COALESCE(company_type, 'other')
 WHERE company_type IS NULL;

ALTER TABLE companies
  ALTER COLUMN company_type SET NOT NULL;

ALTER TABLE companies
  ALTER COLUMN company_type SET DEFAULT 'other';

