import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStatus, LeadSource } from "@/src/types";
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeadCell,
  TableCell,
  Badge,
  Pagination,
  SkeletonTable,
  EmptyState,
  Button,
} from "@/src/components/ui";
import {
  Edit2,
  Phone,
  Users,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import {
  getStatusLabel,
  getStatusColor,
  formatRelativeTime,
} from "@/src/utils/helpers";
import { EditLeadDialog } from "./EditLeadDialog";
import { useCurrentUser, useInitiateLeadCall } from "@/src/hooks";

interface ColumnFilter {
  field: string;
  value?: string;
}

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  page,
  totalPages,
  onPageChange,
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Map<string, Set<string>>>(
    new Map(),
  );
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const initiateLeadCallMutation = useInitiateLeadCall();
  const columnCount = currentUser?.role === "SUPER_ADMIN" ? 8 : 7;

  // Follow-up notes are expanded by default so the latest activity is visible
  // immediately when the table loads.
  useEffect(() => {
    setExpandedNotes((current) => {
      const next = new Set(current);
      leads.forEach((lead) => {
        if (lead.latestFollowupNotes) next.add(lead.id);
      });
      return next;
    });
  }, [leads]);

  // Status options
  const statusOptions: LeadStatus[] = [
    "NEW",
    "CONTACTED",
    "FOLLOW_UP",
    "INTERESTED",
    "SITE_VISIT",
    "NEGOTIATION",
    "BOOKED",
    "LOST",
  ];
  const sourceOptions: LeadSource[] = [
    "WEBSITE",
    "FACEBOOK",
    "INSTAGRAM",
    "WHATSAPP",
    "GOOGLE",
    "REFERRAL",
    "WALK_IN",
    "OTHER",
  ];

  // Filter and sort leads
  const processedLeads = useMemo(() => {
    let result = [...leads];

    // Apply column filters
    if (columnFilters.size > 0) {
      result = result.filter((lead) => {
        for (const [field, values] of columnFilters) {
          if (values.size === 0) continue;

          if (field === "status" && !values.has(lead.status)) {
            return false;
          }
          if (field === "source" && !values.has(lead.source)) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aVal: any = a[sortConfig.field as keyof Lead];
        let bVal: any = b[sortConfig.field as keyof Lead];

        if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal as string).toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, columnFilters, sortConfig]);

  // Toggle column filter
  const toggleColumnFilter = (field: string, value: string) => {
    const newFilters = new Map(columnFilters);
    const fieldValues = newFilters.get(field) || new Set<string>();

    if (fieldValues.has(value)) {
      fieldValues.delete(value);
    } else {
      fieldValues.add(value);
    }

    if (fieldValues.size === 0) {
      newFilters.delete(field);
    } else {
      newFilters.set(field, fieldValues);
    }

    setColumnFilters(newFilters);
  };

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortConfig?.field === field) {
      setSortConfig(
        sortConfig.direction === "asc" ? { field, direction: "desc" } : null,
      );
    } else {
      setSortConfig({ field, direction: "asc" });
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setShowEditDialog(true);
  };

  const handleCall = async (lead: Lead, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!lead.mobile) return;

    setCallingLeadId(lead.id);
    try {
      await initiateLeadCallMutation.mutateAsync({ leadId: lead.id });
    } finally {
      setCallingLeadId(null);
    }
  };

  // Column Filter Menu Component
  const ColumnFilterMenu: React.FC<{
    field: string;
    options: string[];
    label: string;
    position: { top: number; left: number };
  }> = ({ field, options, label, position }) => {
    const selectedValues = columnFilters.get(field) || new Set<string>();

    return (
      <div
        className="fixed bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-48 z-[60]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">
          Filter {label}
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedValues.has(option)}
                onChange={() => toggleColumnFilter(field, option)}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <span className="text-sm capitalize text-slate-600">
                {option.replace(/_/g, " ")}
              </span>
            </label>
          ))}
        </div>
        {selectedValues.size > 0 && (
          <button
            onClick={() => {
              const newFilters = new Map(columnFilters);
              newFilters.delete(field);
              setColumnFilters(newFilters);
            }}
            className="w-full mt-3 text-xs text-slate-500 hover:text-slate-700 py-2 border-t border-slate-200"
          >
            Clear filter
          </button>
        )}
      </div>
    );
  };

  // Sortable Header Cell Component
  const SortableHeaderCell: React.FC<{
    children: React.ReactNode;
    field?: string;
    sortable?: boolean;
  }> = ({ children, field, sortable }) => {
    const isActive = sortConfig?.field === field;
    const isAsc = sortConfig?.direction === "asc";

    return (
      <div className="flex items-center gap-2 relative">
        {children}
        {sortable && field && (
          <button
            onClick={() => toggleSort(field)}
            className={`p-1 rounded hover:bg-slate-100 transition-colors ${
              isActive ? "text-slate-700 bg-slate-50" : "text-slate-400"
            }`}
            title="Sort"
          >
            {isActive ? (
              isAsc ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )
            ) : (
              <ArrowUp className="w-4 h-4 opacity-30" />
            )}
          </button>
        )}
      </div>
    );
  };

  // Filterable Header Cell Component
  const FilterableHeaderCell: React.FC<{
    label: string;
    field: string;
    options: string[];
  }> = ({ label, field, options }) => {
    const selectedCount = columnFilters.get(field)?.size || 0;
    const isOpen = openFilterMenu === field;

    return (
      <div className="relative">
        <button
          onClick={(event) => {
            if (isOpen) {
              setOpenFilterMenu(null);
              setFilterMenuPosition(null);
              return;
            }

            const rect = event.currentTarget.getBoundingClientRect();
            const menuWidth = 192;
            const horizontalPadding = 12;
            setFilterMenuPosition({
              top: rect.bottom + 8,
              left: Math.max(
                horizontalPadding,
                Math.min(
                  rect.right - menuWidth,
                  window.innerWidth - menuWidth - horizontalPadding,
                ),
              ),
            });
            setOpenFilterMenu(field);
          }}
          className="flex items-center gap-2 hover:text-slate-700 transition-colors"
        >
          {label}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
          {selectedCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">
              {selectedCount}
            </span>
          )}
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpenFilterMenu(null);
                setFilterMenuPosition(null);
              }}
            />
            {filterMenuPosition && (
              <ColumnFilterMenu
                field={field}
                options={options}
                label={label}
                position={filterMenuPosition}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Card
        padding="none"
        bordered={false}
        className="overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <Table columns={columnCount}>
            <TableHeader>
              <TableRow>
                <TableHeadCell style={{ minWidth: "140px" }}>
                  <SortableHeaderCell field="customerName" sortable>
                    Name
                  </SortableHeaderCell>
                </TableHeadCell>
                {/* <TableHeadCell style={{ minWidth: '180px' }}>Email</TableHeadCell> */}
                <TableHeadCell style={{ minWidth: "170px" }}>
                  Mobile
                </TableHeadCell>
                <TableHeadCell style={{ minWidth: "120px" }}>
                  <FilterableHeaderCell
                    label="Status"
                    field="status"
                    options={statusOptions}
                  />
                </TableHeadCell>
                <TableHeadCell style={{ minWidth: "110px" }}>
                  <SortableHeaderCell field="source" sortable>
                    Source
                  </SortableHeaderCell>
                </TableHeadCell>
                {currentUser?.role === "SUPER_ADMIN" && (
                  <TableHeadCell style={{ minWidth: "170px" }}>
                    Company
                  </TableHeadCell>
                )}
                <TableHeadCell style={{ minWidth: "150px" }}>
                  Assigned To
                </TableHeadCell>
                <TableHeadCell style={{ minWidth: "100px" }}>
                  <SortableHeaderCell field="updatedAt" sortable>
                    Updated
                  </SortableHeaderCell>
                </TableHeadCell>
                <TableHeadCell style={{ minWidth: "110px" }}>
                  Actions
                </TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell className="col-span-full justify-center py-12">
                    <SkeletonTable />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && processedLeads.length === 0 && (
                <TableRow>
                  <TableCell className="col-span-full justify-center py-12">
                    <EmptyState
                      icon={Users}
                      title={
                        columnFilters.size > 0
                          ? "No leads match your filters"
                          : "No leads found"
                      }
                      description={
                        columnFilters.size > 0
                          ? "Try adjusting your filters to see more results."
                          : "Create your first lead to get started managing your real estate pipeline."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                processedLeads.map((lead) => {
                  const hasNote = Boolean(lead.latestFollowupNotes);
                  const isNoteExpanded = expandedNotes.has(lead.id);

                  const toggleNote = (
                    event: React.MouseEvent | React.KeyboardEvent,
                  ) => {
                    event.stopPropagation();
                    setExpandedNotes((current) => {
                      const next = new Set(current);
                      if (next.has(lead.id)) next.delete(lead.id);
                      else next.add(lead.id);
                      return next;
                    });
                  };

                  return (
                    <React.Fragment key={lead.id}>
                      <TableRow
                        onClick={() => router.push(`/leads/${lead.id}`)}
                        role="link"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/leads/${lead.id}`);
                          }
                        }}
                        className={`cursor-pointer border-x border-t border-slate-200 ${hasNote ? "rounded-t-lg" : "rounded-lg border-b"}`}
                      >
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(`/leads/${lead.id}`);
                              }}
                              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors group text-left"
                            >
                              <span className="group-hover:underline">
                                {lead.customerName}
                              </span>
                            </button>

                            {hasNote && (
                              <button
                                onClick={toggleNote}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  )
                                    toggleNote(event);
                                }}
                                aria-label={
                                  isNoteExpanded
                                    ? "Hide follow-up note"
                                    : "Show follow-up note"
                                }
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isNoteExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div>{lead.mobile}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="primary"
                            size="sm"
                            fixedWidth
                            className={getStatusColor(lead.status)}
                          >
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm capitalize">
                          {lead.source.replace(/_/g, " ")}
                        </TableCell>
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <TableCell className="text-slate-600 text-sm">
                            {lead.companyName || "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-slate-600 text-sm">
                          {lead.assignedUserName || "Unassigned"}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {formatRelativeTime(lead.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(event) => void handleCall(lead, event)}
                              aria-label="Call lead"
                              disabled={
                                !lead.mobile ||
                                initiateLeadCallMutation.isPending
                              }
                              title={
                                lead.mobile
                                  ? `Call ${lead.mobile}`
                                  : "No phone number"
                              }
                            >
                              {callingLeadId === lead.id &&
                              initiateLeadCallMutation.isPending ? (
                                <span className="inline-flex items-center">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                </span>
                              ) : (
                                <Phone className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                lead.status === "BOOKED" ||
                                lead.status === "LOST"
                              }
                              onClick={(event) => {
                                if (
                                  lead.status === "BOOKED" ||
                                  lead.status === "LOST"
                                )
                                  return;
                                event.stopPropagation();
                                handleEdit(lead);
                              }}
                              aria-label="Edit lead"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {hasNote && isNoteExpanded && (
                        <TableRow className="rounded-b-lg border-x border-b border-slate-200 bg-slate-50">
                          <TableCell
                            className={
                              currentUser?.role === "SUPER_ADMIN"
                                ? "col-span-8 rounded-b-lg px-6 py-2.5 text-xs text-slate-600"
                                : "col-span-7 rounded-b-lg px-6 py-2.5 text-xs text-slate-600"
                            }
                          >
                            <span className="font-semibold text-slate-500">
                              Followup:
                            </span>{" "}
                            &quot;{lead.latestFollowupNotes}&quot;
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          loading={isLoading}
        />
      )}

      {/* Edit Dialog */}
      {selectedLead && (
        <EditLeadDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />
      )}
    </>
  );
};
