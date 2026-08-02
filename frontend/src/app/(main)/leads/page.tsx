'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useLeads, useCurrentUser } from '@/src/hooks';
import { leadService } from '@/src/services/services';
import { LeadListParams } from '@/src/types';
import { Button, Input } from '@/src/components/ui';
import { LeadsTable } from '@/src/components/leads/LeadsTable';
import { CreateLeadDialog } from '@/src/components/leads/CreateLeadDialog';
import { Plus, Search } from 'lucide-react';

export default function LeadsPage() {
  const [params, setParams] = useState<LeadListParams>({ page: 1, limit: 10 });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status') as LeadListParams['status'] | null;
    if (status) setParams((prev) => ({ ...prev, status, page: 1 }));
  }, [searchParams]);

  const { data, isLoading } = useLeads(params);
  const { data: currentUser } = useCurrentUser();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportMessage('');
    try {
      const result = await leadService.importLeads(file);
      setImportMessage(`Imported ${result.imported} of ${result.totalRows} rows. Duplicates: ${result.duplicates}, failed: ${result.failed}.`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error: any) {
      setImportMessage(error.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setParams((prev) => ({
        ...prev,
        search: searchTerm.trim() || undefined,
        page: 1,
      }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">Manage and track your lead pipeline</p>
        </div>
        {currentUser?.role === 'ADMIN' && <div className="flex gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {importing ? 'Importing...' : 'Import Excel'}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importing} className="hidden" />
          </label>
          <Button onClick={() => setShowCreateDialog(true)}><Plus className="w-4 h-4 mr-2" />Add Lead</Button>
        </div>}
      </div>

      {importMessage && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{importMessage}</div>}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search leads by name, email, or phone..."
            className="pl-9"
          />
        </div>
      </div>

      <LeadsTable
        leads={data?.data ?? []}
        isLoading={isLoading}
        page={params.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
      />

      <CreateLeadDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  );
}
