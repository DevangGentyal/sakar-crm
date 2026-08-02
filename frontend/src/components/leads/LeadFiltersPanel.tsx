import React, { useState } from 'react';
import { LeadFilters } from '@/src/types';
import { Button, Select, Dialog } from '@/src/components/ui';
import { Filter, X } from 'lucide-react';

interface LeadFiltersPanelProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export const LeadFiltersPanel: React.FC<LeadFiltersPanelProps> = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters = {
      status: undefined,
      source: undefined,
      propertyType: undefined,
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined).length;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        icon={<Filter className="w-4 h-4" />}
      >
        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filter Leads"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Status"
            placeholder="All Statuses"
            value={localFilters.status || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as any || undefined })}
            options={[
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'negotiating', label: 'Negotiating' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
            ]}
          />

          <Select
            label="Source"
            placeholder="All Sources"
            value={localFilters.source || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, source: e.target.value as any || undefined })}
            options={[
              { value: 'website', label: 'Website' },
              { value: 'referral', label: 'Referral' },
              { value: 'cold_call', label: 'Cold Call' },
              { value: 'email', label: 'Email' },
              { value: 'social', label: 'Social Media' },
              { value: 'other', label: 'Other' },
            ]}
          />

          <Select
            label="Property Type"
            placeholder="All Property Types"
            value={localFilters.propertyType || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, propertyType: e.target.value as any || undefined })}
            options={[
              { value: 'residential', label: 'Residential' },
              { value: 'commercial', label: 'Commercial' },
              { value: 'industrial', label: 'Industrial' },
              { value: 'land', label: 'Land' },
            ]}
          />

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handleReset}
              icon={<X className="w-4 h-4" />}
            >
              Reset
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
