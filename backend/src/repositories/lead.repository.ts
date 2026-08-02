import { query, getClient } from "../config/db";
import { PoolClient } from "pg";
import { AppError } from "../utils/appError";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadRow {
  mobile_number: string;
  id: string;
  company_id: string | null;
  company_name?: string | null;
  lead_code: string;
  customer_name: string;
  mobile: string;
  alternate_mobile: string | null;
  email: string | null;
  photo_url: string | null;
  city: string | null;
  occupation: string | null;
  budget: string | null;
  source: string;
  project_id: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  status: string;
  remarks: string | null;
  next_followup_date: Date | null;
  created_by: string;
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
  latest_followup_date?: Date | null;
  latest_followup_notes?: string | null;
  latest_status_change_at?: Date | null;
}

export interface LeadHistoryRow {
  id: string;
  lead_id: string;
  previous_status: string | null;
  new_status: string;
  remarks: string | null;
  updated_by: string;
  updated_by_name: string | null;
  updated_at: Date;
  changed_fields: Record<string, unknown> | null;
}

export interface CreateLeadInput {
  companyId?: string | null;
  leadCode: string;
  customerName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  photoUrl?: string | null;
  city?: string;
  occupation?: string;
  budget?: number;
  source: string;
  projectId: string;
  assignedUserId?: string;
  status: string;
  remarks?: string;
  nextFollowupDate?: string;
  createdBy: string;
}

export interface UpdateLeadInput {
  customerName?: string;
  mobile?: string;
  alternateMobile?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  occupation?: string | null;
  source?: string;
  status?: string;
  remarks?: string;
  assignedUserId?: string | null;
  budget?: number;
  nextFollowupDate?: string | null;
}

export interface InsertHistoryInput {
  companyId?: string | null;
  leadId: string;
  previousStatus: string | null;
  newStatus: string;
  remarks?: string;
  updatedBy: string;
  changedFields?: Record<string, unknown>;
}

export interface LeadListParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  source?: string;
  projectId?: string;
  assignedUserId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  userId?: string;
  userRole?: string;
  companyId?: string;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// No projects table in DB - project_id stored as plain UUID
// No is_deleted column - using hard delete
const LEAD_SELECT = `
  SELECT
    l.id,
    l.company_id,
    c.company_name,
    l.lead_code,
    l.customer_name,
    l.mobile,
    l.alternate_mobile,
    l.email,
    l.photo_url,
    l.city,
    l.occupation,
    l.budget,
    l.source,
    l.project_id,
    l.assigned_user_id,
    au.name       AS assigned_user_name,
    l.status,
    l.remarks,
    l.next_followup_date,
    l.created_by,
    cu.name       AS created_by_name,
    l.created_at,
    l.updated_at
    ,(SELECT f.followup_date
      FROM lead_followups f
      WHERE f.lead_id = l.id
        AND f.status IS DISTINCT FROM 'BOOKED'
      ORDER BY ABS(EXTRACT(EPOCH FROM (f.followup_date - CURRENT_TIMESTAMP))) ASC,
               f.followup_date ASC,
               f.created_at DESC
      LIMIT 1) AS latest_followup_date
    ,(SELECT f.notes
      FROM lead_followups f
      WHERE f.lead_id = l.id
        AND f.status IS DISTINCT FROM 'BOOKED'
      ORDER BY ABS(EXTRACT(EPOCH FROM (f.followup_date - CURRENT_TIMESTAMP))) ASC,
               f.followup_date ASC,
               f.created_at DESC
      LIMIT 1) AS latest_followup_notes
    ,(SELECT h.updated_at FROM lead_history h WHERE h.lead_id = l.id ORDER BY h.updated_at DESC LIMIT 1) AS latest_status_change_at
  FROM leads l
  LEFT JOIN companies c ON c.id = l.company_id
  LEFT JOIN users     au ON au.id = l.assigned_user_id
  LEFT JOIN users     cu ON cu.id = l.created_by
`;

export async function findByMobile(
  mobile: string,
  companyId?: string,
): Promise<{ id: string } | null> {
  if (!companyId) return null;
  const result = await query<{ id: string }>(
    `SELECT id FROM leads WHERE mobile = $1 AND company_id = $2 LIMIT 1`,
    [mobile, companyId],
  );
  return result.rows[0] ?? null;
}

export async function createLead(
  client: PoolClient,
  input: CreateLeadInput,
): Promise<LeadRow> {
  const result = await client.query<LeadRow>(
    `INSERT INTO leads (
       company_id, lead_code, customer_name, mobile, alternate_mobile, email,
       photo_url, city, occupation, budget, source, project_id,
       assigned_user_id, status, remarks, next_followup_date, created_by
     ) VALUES (
       $1,  $2,  $3,  $4,  $5,
       $6,  $7,  $8,  $9,  $10,
       $11, $12, $13, $14, $15, $16, $17
     )
     RETURNING *`,
    [
      input.companyId ?? null,
      input.leadCode,
      input.customerName,
      input.mobile,
      input.alternateMobile ?? null,
      input.email || null,
      input.photoUrl ?? null,
      input.city || null,
      input.occupation || null,
      Number.isFinite(input.budget) ? input.budget : null,
      input.source,
      input.projectId,
      input.assignedUserId ?? null,
      input.status,
      input.remarks || null,
      input.nextFollowupDate || null,
      input.createdBy,
    ],
  );
  return result.rows[0];
}

// Project selection is not exposed by the current lead form. The user's schema
// stores project_id as a required UUID without a projects table or FK.
const DEFAULT_PROJECT_ID = "00000000-0000-0000-0000-000000000000";

export async function resolveProjectId(
  _client: PoolClient,
  requestedProjectId: string | undefined,
  _createdBy: string,
): Promise<string> {
  return requestedProjectId || DEFAULT_PROJECT_ID;
}

export async function insertHistory(
  client: PoolClient,
  input: InsertHistoryInput,
): Promise<LeadHistoryRow> {
  const result = await client.query<LeadHistoryRow>(
    `INSERT INTO lead_history (company_id, lead_id, previous_status, new_status, remarks, updated_by, changed_fields)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.companyId ?? null,
      input.leadId,
      input.previousStatus,
      input.newStatus,
      input.remarks ?? null,
      input.updatedBy,
      JSON.stringify(input.changedFields ?? {}),
    ],
  );
  return result.rows[0];
}

export async function updateLead(
  client: PoolClient,
  id: string,
  patch: UpdateLeadInput,
): Promise<LeadRow> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.customerName !== undefined) {
    fields.push(`customer_name = $${idx++}`);
    values.push(patch.customerName);
  }
  if (patch.mobile !== undefined) {
    fields.push(`mobile = $${idx++}`);
    values.push(patch.mobile);
  }
  if ("alternateMobile" in patch) {
    fields.push(`alternate_mobile = $${idx++}`);
    values.push(patch.alternateMobile);
  }
  if ("email" in patch) {
    fields.push(`email = $${idx++}`);
    values.push(patch.email);
  }
  if ("photoUrl" in patch) {
    fields.push(`photo_url = $${idx++}`);
    values.push(patch.photoUrl);
  }
  if ("city" in patch) {
    fields.push(`city = $${idx++}`);
    values.push(patch.city);
  }
  if ("occupation" in patch) {
    fields.push(`occupation = $${idx++}`);
    values.push(patch.occupation);
  }
  if (patch.source !== undefined) {
    fields.push(`source = $${idx++}`);
    values.push(patch.source);
  }

  if (patch.status !== undefined) {
    fields.push(`status = $${idx++}`);
    values.push(patch.status);
  }
  if (patch.remarks !== undefined) {
    fields.push(`remarks = $${idx++}`);
    values.push(patch.remarks);
  }
  if ("assignedUserId" in patch) {
    fields.push(`assigned_user_id = $${idx++}`);
    values.push(patch.assignedUserId);
  }
  if (patch.budget !== undefined) {
    fields.push(`budget = $${idx++}`);
    values.push(patch.budget);
  }
  if ("nextFollowupDate" in patch) {
    fields.push(`next_followup_date = $${idx++}`);
    values.push(patch.nextFollowupDate);
  }
  // Always update updated_at
  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) {
    throw new AppError("No lead fields changed", {
      statusCode: 422,
      code: "NO_LEAD_CHANGES",
    });
  }

  values.push(id);

  const result = await client.query<LeadRow>(
    `UPDATE leads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0];
}

export async function findLeadById(
  id: string,
  companyId?: string,
): Promise<LeadRow | null> {
  const queryText = companyId
    ? `${LEAD_SELECT} WHERE l.id = $1 AND l.company_id = $2`
    : `${LEAD_SELECT} WHERE l.id = $1`;
  const params = companyId ? [id, companyId] : [id];
  const result = await query<LeadRow>(queryText, params);
  return result.rows[0] ?? null;
}

export async function findLeadHistoryByLeadId(
  leadId: string,
  companyId?: string,
): Promise<LeadHistoryRow[]> {
  const queryText = companyId
    ? `SELECT
       lh.id,
       lh.lead_id,
       lh.previous_status,
       lh.new_status,
       lh.remarks,
       lh.updated_by,
       u.name AS updated_by_name,
      lh.updated_at,
      lh.changed_fields
     FROM lead_history lh
     LEFT JOIN users u ON u.id = lh.updated_by
     WHERE lh.lead_id = $1 AND lh.company_id = $2
    ORDER BY lh.updated_at DESC`
    : `SELECT
       lh.id,
       lh.lead_id,
       lh.previous_status,
       lh.new_status,
       lh.remarks,
       lh.updated_by,
       u.name AS updated_by_name,
      lh.updated_at,
      lh.changed_fields
     FROM lead_history lh
     LEFT JOIN users u ON u.id = lh.updated_by
     WHERE lh.lead_id = $1
    ORDER BY lh.updated_at DESC`;
  const params = companyId ? [leadId, companyId] : [leadId];
  const result = await query<LeadHistoryRow>(queryText, params);
  return result.rows;
}

export async function listLeads(
  params: LeadListParams,
): Promise<{ rows: LeadRow[]; total: number }> {
  const ALLOWED_SORT_COLUMNS: Record<string, string> = {
    created_at: "l.created_at",
    customer_name: "l.customer_name",
    status: "l.status",
    next_followup_date: "l.next_followup_date",
    budget: "l.budget",
  };

  const sortColumn =
    ALLOWED_SORT_COLUMNS[params.sortBy ?? "created_at"] ?? "l.created_at";
  const sortOrder = params.sortOrder === "ASC" ? "ASC" : "DESC";

  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(
      `(l.customer_name ILIKE $${idx} OR l.mobile ILIKE $${idx} OR l.lead_code ILIKE $${idx})`,
    );
    values.push(`%${params.search}%`);
    idx++;
  }
  if (params.status) {
    conditions.push(`l.status = $${idx++}`);
    values.push(params.status);
  }
  if (params.source) {
    conditions.push(`l.source = $${idx++}`);
    values.push(params.source);
  }
  if (params.projectId) {
    conditions.push(`l.project_id = $${idx++}`);
    values.push(params.projectId);
  }
  if (
    params.assignedUserId &&
    params.userRole !== "ADMIN" &&
    params.userRole !== "SUPER_ADMIN"
  ) {
    conditions.push(`l.assigned_user_id = $${idx++}`);
    values.push(params.assignedUserId);
  }
  if (params.userRole === "EXECUTIVE") {
    conditions.push(`l.assigned_user_id = $${idx++}`);
    values.push(params.userId);
  }
  if (params.userRole !== "SUPER_ADMIN" && params.companyId) {
    conditions.push(`l.company_id = $${idx++}`);
    values.push(params.companyId);
  }

  const WHERE =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM leads l ${WHERE}`,
    values,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (params.page - 1) * params.limit;
  values.push(params.limit, offset);

  const dataResult = await query<LeadRow>(
    `${LEAD_SELECT} ${WHERE} ORDER BY ${sortColumn} ${sortOrder} LIMIT $${idx++} OFFSET $${idx++}`,
    values,
  );

  return { rows: dataResult.rows, total };
}

export { getClient };
