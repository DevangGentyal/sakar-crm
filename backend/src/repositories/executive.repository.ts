import { query } from "../config/db";
import { ApprovalStatus, UserRow } from "./auth.repository";

export interface ExecutiveListParams {
  status?: ApprovalStatus;
  search?: string;
  page: number;
  limit: number;
  sortBy: "name" | "email" | "created_at";
  sortOrder: "asc" | "desc";
  companyId?: string;
}

export interface ExecutiveListItem {
  id: string;
  name: string;
  email: string;
  mobile_number: string | null;
  role: string;
  is_active: boolean;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
}

const SORT_COLUMNS: Record<ExecutiveListParams["sortBy"], string> = {
  name: "name",
  email: "email",
  created_at: "created_at",
};

export async function listExecutives(
  params: ExecutiveListParams,
): Promise<{ rows: ExecutiveListItem[]; total: number }> {
  const conditions = ["role = 'EXECUTIVE'"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.companyId) {
    conditions.push(`company_id = $${paramIndex++}`);
    values.push(params.companyId);
  }

  if (params.status) {
    conditions.push(`approval_status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params.search) {
    conditions.push(
      `(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR mobile_number ILIKE $${paramIndex})`,
    );
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const sortColumn = SORT_COLUMNS[params.sortBy] ?? "created_at";
  const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";
  const offset = (params.page - 1) * params.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users ${whereClause}`,
    values,
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0", 10);

  const listValues = [...values, params.limit, offset];
  const result = await query<ExecutiveListItem>(
    `SELECT
       id, company_id, name, email, mobile_number, role, is_active,
       approval_status, approved_by, approved_at, rejection_reason,
       created_at
     FROM users
     ${whereClause}
     ORDER BY ${sortColumn} ${sortOrder}
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    listValues,
  );

  return { rows: result.rows, total };
}

export async function findExecutiveById(id: string, companyId?: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT
       id, name, email, mobile_number, password_hash, role, is_active,
       approval_status, approved_by, approved_at, rejection_reason,
       created_at, updated_at
     FROM users
     WHERE id = $1 AND role = 'EXECUTIVE'${companyId ? " AND company_id = $2" : ""}
     LIMIT 1`,
    companyId ? [id, companyId] : [id],
  );
  return result.rows[0] ?? null;
}

export async function approveExecutive(
  id: string,
  approvedBy: string,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  const result = await query<ExecutiveListItem>(
    `UPDATE users
     SET approval_status = 'APPROVED',
         approved_by = $2,
         approved_at = NOW(),
         rejection_reason = NULL,
         is_active = TRUE,
         updated_at = NOW()
     WHERE id = $1 AND role = 'EXECUTIVE'${companyId ? " AND company_id = $3" : ""}
     RETURNING
       id, name, email, mobile_number, role, is_active,
       approval_status, approved_by, approved_at, rejection_reason,
       created_at`,
    companyId ? [id, approvedBy, companyId] : [id, approvedBy],
  );
  return result.rows[0] ?? null;
}

export async function rejectExecutive(
  id: string,
  approvedBy: string,
  reason: string,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  const result = await query<ExecutiveListItem>(
    `UPDATE users
     SET approval_status = 'REJECTED',
         approved_by = $2,
         approved_at = NOW(),
         rejection_reason = $3,
         updated_at = NOW()
     WHERE id = $1 AND role = 'EXECUTIVE'${companyId ? " AND company_id = $4" : ""}
     RETURNING
       id, name, email, mobile_number, role, is_active,
       approval_status, approved_by, approved_at, rejection_reason,
       created_at`,
    companyId ? [id, approvedBy, reason, companyId] : [id, approvedBy, reason],
  );
  return result.rows[0] ?? null;
}

export async function setExecutiveActive(
  id: string,
  isActive: boolean,
  companyId?: string,
): Promise<ExecutiveListItem | null> {
  const result = await query<ExecutiveListItem>(
    `UPDATE users
     SET is_active = $2,
         updated_at = NOW()
     WHERE id = $1 AND role = 'EXECUTIVE' AND approval_status = 'APPROVED'${companyId ? " AND company_id = $3" : ""}
     RETURNING
       id, name, email, mobile_number, role, is_active,
       approval_status, approved_by, approved_at, rejection_reason,
       created_at`,
    companyId ? [id, isActive, companyId] : [id, isActive],
  );
  return result.rows[0] ?? null;
}
