import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { dashboardService } from '@/src/services/services';
import { DashboardStats, DashboardRecentLead } from '../types';

const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useDashboardStats = (
  options?: { enabled?: boolean }
): UseQueryResult<DashboardStats, Error> => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardService.getStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
    retry: 1,
  });
};

// Convenience hook: derived from the main stats call (no extra network request)
export const useRecentLeads = (
  _limit: number = 5,
  options?: { enabled?: boolean }
): UseQueryResult<DashboardRecentLead[], Error> => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: dashboardService.getStats,
    select: (stats) => stats.recentLeads,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    enabled: options?.enabled !== false,
    retry: 1,
  });
};
