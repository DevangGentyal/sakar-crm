import { query } from '../config/db';

export interface StatusCount {
  status: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface MonthlyTrend {
  month: string; // e.g. "2026-01"
  count: number;
}

export interface RecentLead {
  id: string;
  lead_code: string;
  customer_name: string;
  mobile: string;
  status: string;
  source: string;
  created_at: Date;
}

export interface FollowupLead {
  id: string;
  lead_code: string;
  customer_name: string;
  mobile: string;
  status: string;
  next_followup_date: Date;
  assigned_user_name: string | null;
}

export interface FollowupMetrics {
  today: number;
  tomorrow: number;
  pending: number;
  overdue: number;
  completed: number;
  upcoming: number;
}

function accessCondition(userId?: string, userRole?: string, companyId?: string): { sql: string; params: string[] } {
  const conditions: string[] = [];
  const params: string[] = [];
  if (companyId) {
    conditions.push(`l.company_id = $${params.length + 1}`);
    params.push(companyId);
  }
  if (userId && userRole === 'EXECUTIVE') {
    conditions.push(`l.assigned_user_id = $${params.length + 1}`);
    params.push(userId);
  }
  return { sql: conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '', params };
}

// No is_deleted column in actual schema - removed from all queries
// No projects table - removed project JOIN

export async function getStatusCounts(userId?: string, userRole?: string, companyId?: string): Promise<StatusCount[]> {
  const access = accessCondition(userId, userRole, companyId);
  const result = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*) AS count
    FROM leads l
     ${access.sql}
     GROUP BY status ORDER BY count DESC`, access.params
  );
  return result.rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) }));
}

export async function getSourceBreakdown(userId?: string, userRole?: string, companyId?: string): Promise<SourceCount[]> {
  const access = accessCondition(userId, userRole, companyId);
  const result = await query<{ source: string; count: string }>(
    `SELECT source, COUNT(*) AS count
    FROM leads l${access.sql}
    GROUP BY source ORDER BY count DESC`, access.params
  );
  return result.rows.map((r) => ({ source: r.source, count: parseInt(r.count, 10) }));
}

export async function getMonthlyLeadTrend(userId?: string, userRole?: string, companyId?: string): Promise<MonthlyTrend[]> {
  const access = accessCondition(userId, userRole, companyId);
  const result = await query<{ month: string; count: string }>(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', l.created_at), 'YYYY-MM') AS month,
       COUNT(*) AS count
     FROM leads l
    ${access.sql ? `${access.sql} AND l.created_at >= NOW() - INTERVAL '6 months'` : `WHERE l.created_at >= NOW() - INTERVAL '6 months'`}
    GROUP BY DATE_TRUNC('month', l.created_at)
    ORDER BY DATE_TRUNC('month', l.created_at) ASC`, access.params
  );
  return result.rows.map((r) => ({ month: r.month, count: parseInt(r.count, 10) }));
}

export async function getRecentLeads(limit: number = 10, userId?: string, userRole?: string, companyId?: string): Promise<RecentLead[]> {
  const access = accessCondition(userId, userRole, companyId);
  const result = await query<RecentLead>(
    `SELECT
       l.id,
       l.lead_code,
       l.customer_name,
       l.mobile,
       l.status,
       l.source,
       l.created_at
    FROM leads l${access.sql}
    ORDER BY l.created_at DESC
    LIMIT $${access.params.length + 1}`,
      [...access.params, limit]
  );
  return result.rows;
}

export async function getFollowupsDue(companyId?: string): Promise<FollowupLead[]> {
  const result = await query<FollowupLead>(
    `SELECT
       l.id,
       l.lead_code,
       l.customer_name,
       l.mobile,
       l.status,
       l.next_followup_date,
       u.name AS assigned_user_name
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_user_id
     WHERE l.next_followup_date IS NOT NULL
       AND l.next_followup_date::DATE <= CURRENT_DATE
       AND l.status NOT IN ('BOOKED', 'LOST')
       ${companyId ? 'AND l.company_id = $1' : ''}
     ORDER BY l.next_followup_date ASC`
      ,
      companyId ? [companyId] : []
  );
  return result.rows;
}

export async function getTotalLeadsCount(userId?: string, userRole?: string, companyId?: string): Promise<number> {
  const access = accessCondition(userId, userRole, companyId);
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM leads l${access.sql}`, access.params
  );
  return parseInt(result.rows[0].count, 10);
}

export async function getFollowupMetrics(userId?: string, userRole?: string, companyId?: string): Promise<FollowupMetrics> {
  const access = accessCondition(userId, userRole, companyId);
  try {
    const result = await query<FollowupMetrics & Record<string, string>>(
      `SELECT
      COUNT(*) FILTER (WHERE f.followup_date::date = CURRENT_DATE) AS today,
      COUNT(*) FILTER (WHERE f.followup_date::date = CURRENT_DATE + 1) AS tomorrow,
      COUNT(*) FILTER (WHERE f.followup_date >= NOW() AND f.status IS DISTINCT FROM 'BOOKED') AS pending,
      COUNT(*) FILTER (WHERE f.followup_date < NOW() AND f.status IS DISTINCT FROM 'BOOKED') AS overdue,
      COUNT(*) FILTER (WHERE f.status = 'BOOKED') AS completed,
      COUNT(*) FILTER (WHERE f.followup_date >= NOW() AND f.followup_date < NOW() + INTERVAL '7 days') AS upcoming
     FROM lead_followups f
     JOIN leads l ON l.id = f.lead_id${access.sql}`,
      access.params
    );
    const row = result.rows[0];
    return { today: Number(row.today), tomorrow: Number(row.tomorrow), pending: Number(row.pending), overdue: Number(row.overdue), completed: Number(row.completed), upcoming: Number(row.upcoming) };
  } catch (error) {
    // The follow-up migration is optional for existing installations. Keep the
    // dashboard usable until lead_followups has been created.
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '42P01') {
      return { today: 0, tomorrow: 0, pending: 0, overdue: 0, completed: 0, upcoming: 0 };
    }
    throw error;
  }
}
