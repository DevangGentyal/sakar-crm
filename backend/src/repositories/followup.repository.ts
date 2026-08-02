import { PoolClient } from 'pg';
import { query } from '../config/db';

export interface FollowupRow {
  id: string;
  company_id?: string | null;
  lead_id: string;
  followup_date: Date;
  notes: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_at: Date;
  status: string | null;
}

export async function completeFollowup(id: string, leadId: string, companyId: string, completed = true): Promise<FollowupRow | null> {
  const result = await query<FollowupRow>(
    `UPDATE lead_followups
     SET status = $3
     WHERE id = $1 AND lead_id = $2 AND company_id = $4
     RETURNING *`,
    [id, leadId, completed ? 'BOOKED' : null, companyId]
  );
  return result.rows[0] ?? null;
}

export async function createFollowup(client: PoolClient, input: {
  companyId: string;
  leadId: string;
  followupDate: string;
  notes?: string;
  createdBy: string;
  status?: string;
}): Promise<FollowupRow> {
  const result = await client.query<FollowupRow>(
    `INSERT INTO lead_followups (company_id, lead_id, followup_date, notes, created_by, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.companyId, input.leadId, input.followupDate, input.notes || null, input.createdBy, input.status || null]
  );
  return result.rows[0];
}

export async function listFollowups(leadId: string, companyId: string): Promise<FollowupRow[]> {
  const result = await query<FollowupRow>(
    `SELECT f.*, u.name AS created_by_name
     FROM lead_followups f
     LEFT JOIN users u ON u.id = f.created_by
     WHERE f.lead_id = $1 AND f.company_id = $2
    ORDER BY CASE WHEN f.status IS DISTINCT FROM 'BOOKED' THEN 0 ELSE 1 END,
          f.followup_date DESC, f.created_at DESC`,
    [leadId, companyId]
  );
  return result.rows;
}

export async function listAllFollowups(input: {
  filter?: string;
  userId?: string;
  userRole?: string;
  companyId: string;
}): Promise<FollowupRow[]> {
  const conditions = ['1 = 1'];
  const values: unknown[] = [];
  let index = 1;
  if (input.userRole === 'EXECUTIVE') {
    conditions.push(`l.assigned_user_id = $${index++}`);
    values.push(input.userId);
  }
  conditions.push(`f.company_id = $${index++}`);
  values.push(input.companyId);
  const filters: Record<string, string> = {
    today: `f.followup_date::date = CURRENT_DATE`,
    tomorrow: `f.followup_date::date = CURRENT_DATE + 1`,
    overdue: `f.followup_date < NOW() AND f.status IS DISTINCT FROM 'BOOKED'`,
    pending: `f.followup_date >= NOW() AND f.status IS DISTINCT FROM 'BOOKED'`,
    completed: `f.status = 'BOOKED'`,
    upcoming: `f.followup_date >= NOW() AND f.followup_date < NOW() + INTERVAL '7 days'`,
  };
  if (input.filter && filters[input.filter]) conditions.push(filters[input.filter]);
  const result = await query<FollowupRow & { customer_name: string; mobile: string; lead_status: string }>(
    `SELECT f.*, u.name AS created_by_name, l.customer_name, l.mobile, l.status AS lead_status
     FROM lead_followups f
     JOIN leads l ON l.id = f.lead_id
     LEFT JOIN users u ON u.id = f.created_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY f.followup_date DESC, f.created_at DESC`, values
  );
  return result.rows;
}
