import {
  getStatusCounts,
  getSourceBreakdown,
  getMonthlyLeadTrend,
  getRecentLeads,
  getFollowupsDue,
  getTotalLeadsCount,
  getFollowupMetrics,
} from '../repositories/dashboard.repository';

export interface DashboardStats {
  totalLeads: number;
  statusBreakdown: { status: string; count: number }[];
  sourceBreakdown: { source: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
  recentLeads: {
    id: string;
    lead_code: string;
    customer_name: string;
    mobile: string;
    status: string;
    source: string;
    created_at: Date;
  }[];
  followupsDue: {
    id: string;
    lead_code: string;
    customer_name: string;
    mobile: string;
    status: string;
    next_followup_date: Date;
    assigned_user_name: string | null;
  }[];
  followupMetrics: {
    today: number;
    tomorrow: number;
    pending: number;
    overdue: number;
    completed: number;
    upcoming: number;
  };
}

export async function getDashboardStats(userId?: string, userRole?: string, companyId?: string): Promise<DashboardStats> {
  // Run all aggregated queries in parallel for efficiency
  const [
    totalLeads,
    statusBreakdown,
    sourceBreakdown,
    monthlyTrend,
    recentLeads,
    followupsDue,
    followupMetrics,
  ] = await Promise.all([
    getTotalLeadsCount(userId, userRole, companyId),
    getStatusCounts(userId, userRole, companyId),
    getSourceBreakdown(userId, userRole, companyId),
    getMonthlyLeadTrend(userId, userRole, companyId),
    getRecentLeads(10, userId, userRole, companyId),
    getFollowupsDue(companyId),
    getFollowupMetrics(userId, userRole, companyId),
  ]);

  return {
    totalLeads,
    statusBreakdown,
    sourceBreakdown,
    monthlyTrend,
    recentLeads,
    followupsDue,
    followupMetrics,
  };
}
