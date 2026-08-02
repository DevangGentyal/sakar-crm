import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, SkeletonTable, EmptyState } from '@/src/components/ui';
import { Users } from 'lucide-react';
import { getStatusLabel, getStatusColor, getSourceLabel, formatRelativeTime } from '@/src/utils/helpers';
import { Table, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from '@/src/components/ui';

import { DashboardRecentLead } from '@/src/types';

interface RecentLeadsCardProps {
  leads?: DashboardRecentLead[];
  isLoading: boolean;
}

export const RecentLeadsCard: React.FC<RecentLeadsCardProps> = ({ leads, isLoading }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card padding="md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Leads</h3>
        <SkeletonTable />
      </Card>
    );
  }

  if (!leads || leads.length === 0) {
    return (
      <Card padding="md">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Leads</h3>
        <EmptyState icon={Users} title="No leads yet" description="Create your first lead to get started" />
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Leads</h3>
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        <Table columns={5}>
          <TableHeader>
            <TableRow>
              <TableHeadCell style={{ minWidth: '140px' }}>Name</TableHeadCell>
              <TableHeadCell style={{ minWidth: '130px' }}>Mobile</TableHeadCell>
              <TableHeadCell style={{ minWidth: '120px' }}>Source</TableHeadCell>
              <TableHeadCell style={{ minWidth: '120px' }}>Status</TableHeadCell>
              <TableHeadCell style={{ minWidth: '100px' }}>Added</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/leads/${lead.id}`);
                  }
                }}
                role="link"
                tabIndex={0}
                className="cursor-pointer"
              >
                <TableCell className="font-medium text-slate-900">{lead.customer_name}</TableCell>
                <TableCell className="text-slate-600 text-sm">{lead.mobile}</TableCell>
                <TableCell className="text-slate-600 text-sm">{getSourceLabel(lead.source as any)}</TableCell>
                <TableCell>
                  <Badge
                    variant="primary"
                    size="sm"
                    fixedWidth
                    className={getStatusColor(lead.status as any)}
                  >
                    {getStatusLabel(lead.status as any)}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">{formatRelativeTime(lead.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
