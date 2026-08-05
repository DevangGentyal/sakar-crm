import { query } from "../config/db";

export interface CompanyRow {
  id: string;
  company_name: string;
  company_code: string;
  company_type: string | null;
  email: string | null;
  mobile: string | null;
  address: string | null;
  logo_url: string | null;
  theme: Record<string, unknown> | null;
  registration_password_hash: string | null;
  status: "ACTIVE" | "INACTIVE";
  created_at: Date;
  updated_at: Date;
}

export async function listCompanies(): Promise<CompanyRow[]> {
  const result = await query<CompanyRow>(
    `SELECT *
     FROM companies
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function listPublicCompanies(): Promise<CompanyRow[]> {
  const result = await query<CompanyRow>(
    `SELECT id, company_name, company_code, company_type, email, mobile, address, logo_url, theme, status, created_at, updated_at
     FROM companies
     WHERE status = 'ACTIVE'
     ORDER BY company_name ASC`,
  );
  return result.rows;
}

export async function createCompany(input: {
  companyName: string;
  companyCode: string;
  companyType: string;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  theme?: Record<string, unknown> | null;
  registrationPasswordHash?: string | null;
}): Promise<CompanyRow> {
  const result = await query<CompanyRow>(
    `INSERT INTO companies (
       company_name, company_code, company_type, email, mobile, address, logo_url, theme, registration_password_hash, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE')
     RETURNING *`,
    [
      input.companyName,
      input.companyCode,
      input.companyType,
      input.email ?? null,
      input.mobile ?? null,
      input.address ?? null,
      input.logoUrl ?? null,
      input.theme ? JSON.stringify(input.theme) : null,
      input.registrationPasswordHash ?? null,
    ],
  );
  return result.rows[0];
}

export async function setCompanyStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<CompanyRow | null> {
  const result = await query<CompanyRow>(
    `UPDATE companies
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status],
  );
  return result.rows[0] ?? null;
}

export async function findCompanyByCode(
  companyCode: string,
): Promise<CompanyRow | null> {
  const result = await query<CompanyRow>(
    `SELECT *
     FROM companies
     WHERE LOWER(company_code) = LOWER($1)
     LIMIT 1`,
    [companyCode],
  );
  return result.rows[0] ?? null;
}

export async function setCompanyRegistrationPassword(
  companyId: string,
  registrationPasswordHash: string,
): Promise<CompanyRow | null> {
  const result = await query<CompanyRow>(
    `UPDATE companies
     SET registration_password_hash = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [companyId, registrationPasswordHash],
  );
  return result.rows[0] ?? null;
}

export async function resetAdminPassword(
  companyId: string,
  passwordHash: string,
): Promise<void> {
  await query(
    `UPDATE users
     SET password_hash = $2,
         must_change_password = TRUE,
         updated_at = NOW()
     WHERE company_id = $1 AND role = 'ADMIN'`,
    [companyId, passwordHash],
  );
}

export async function createCompanyWithAdmin(input: {
  companyName: string;
  companyCode: string;
  companyType: string;
  email: string;
  mobile?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  theme?: Record<string, unknown> | null;
  adminName: string;
  adminEmail: string;
  adminMobile?: string | null;
  adminPasswordHash: string;
  executiveRegistrationPasswordHash?: string | null;
}): Promise<CompanyRow> {
  const company = await createCompany({
    companyName: input.companyName,
    companyCode: input.companyCode,
    companyType: input.companyType,
    email: input.email,
    mobile: input.mobile,
    address: input.address,
    logoUrl: input.logoUrl,
    theme: input.theme,
    registrationPasswordHash: input.executiveRegistrationPasswordHash ?? null,
  });

  await query(
    `INSERT INTO users (
       company_id, name, email, mobile_number, password_hash, role, approval_status, is_active, must_change_password
     ) VALUES ($1, $2, $3, $4, $5, 'ADMIN', 'APPROVED', TRUE, TRUE)`,
    [
      company.id,
      input.adminName,
      input.adminEmail,
      input.adminMobile ?? null,
      input.adminPasswordHash,
    ],
  );

  return company;
}
