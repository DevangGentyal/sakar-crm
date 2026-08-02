import { query } from "../config/db";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserRow {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  mobile_number: string | null;
  password_hash: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  companyId?: string | null;
  name: string;
  email: string;
  mobileNumber: string;
  passwordHash: string;
  role: string;
  approvalStatus?: ApprovalStatus;
  mustChangePassword?: boolean;
}

const USER_COLUMNS = `
  id, company_id, name, email, mobile_number, password_hash, role, is_active,
  must_change_password, approval_status, approved_by, approved_at, rejection_reason,
  created_at, updated_at
`;

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserByMobile(
  mobileNumber: string,
  companyId?: string | null,
): Promise<UserRow | null> {
  const values: unknown[] = [mobileNumber];
  let where = "mobile_number = $1";
  if (companyId) {
    values.push(companyId);
    where += ` AND company_id = $2`;
  }
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE ${where}
     LIMIT 1`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const result = await query<UserRow>(
    `INSERT INTO users (
       company_id, name, email, mobile_number, password_hash, role, approval_status, is_active, must_change_password
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
     RETURNING ${USER_COLUMNS}`,
    [
      input.companyId ?? null,
      input.name,
      input.email,
      input.mobileNumber,
      input.passwordHash,
      input.role,
      input.approvalStatus ?? "PENDING",
      input.mustChangePassword ?? false,
    ],
  );
  return result.rows[0];
}

export async function listUsers(
  companyId?: string,
): Promise<
  Pick<
    UserRow,
    | "id"
    | "name"
    | "email"
    | "mobile_number"
    | "role"
    | "is_active"
    | "approval_status"
  >[]
> {
  const values: unknown[] = [];
  const conditions: string[] = [
    "role = 'EXECUTIVE'",
    "approval_status = 'APPROVED'",
    "is_active = TRUE",
  ];

  if (companyId) {
    conditions.push("company_id = $1");
    values.push(companyId);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await query<
    Pick<
      UserRow,
      | "id"
      | "name"
      | "email"
      | "mobile_number"
      | "role"
      | "is_active"
      | "approval_status"
    >
  >(
    `SELECT id, company_id, name, email, mobile_number, role, is_active, approval_status
     FROM users
     ${whereClause}
     ORDER BY name ASC`,
    values,
  );
  return result.rows;
}

export async function findUserByIdAndCompany(
  id: string,
  companyId: string,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE id = $1 AND company_id = $2
     LIMIT 1`,
    [id, companyId],
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmailAndCompany(
  email: string,
  companyId: string,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE email = $1 AND company_id = $2
     LIMIT 1`,
    [email, companyId],
  );
  return result.rows[0] ?? null;
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string,
  mustChangePassword = false,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET password_hash = $2,
         must_change_password = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, passwordHash, mustChangePassword],
  );
  return result.rows[0] ?? null;
}

export async function updateUserMobileNumber(
  userId: string,
  mobileNumber: string | null,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET mobile_number = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, mobileNumber],
  );
  return result.rows[0] ?? null;
}
