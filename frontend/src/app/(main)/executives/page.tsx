"use client";

import React, { useMemo, useState } from "react";
import {
  useExecutives,
  useApproveExecutive,
  useRejectExecutive,
  useEnableExecutive,
  useDisableExecutive,
} from "@/src/hooks";
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableHeader,
  TableRow,
  Badge,
  Pagination,
} from "@/src/components/ui";
import {
  Plus,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Lock,
  Unlock,
} from "lucide-react";

const statuses = ["PENDING", "APPROVED", "REJECTED"] as const;

type ExecutiveStatus = (typeof statuses)[number];

export default function ExecutivesPage() {
  const [status, setStatus] = useState<ExecutiveStatus>("PENDING");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useExecutives({ status, page, limit });
  const approveMutation = useApproveExecutive();
  const rejectMutation = useRejectExecutive();
  const enableMutation = useEnableExecutive();
  const disableMutation = useDisableExecutive();

  const executives = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const isBusy = [
    approveMutation,
    rejectMutation,
    enableMutation,
    disableMutation,
  ].some((mutation) => mutation.isPending);

  const columns = useMemo(
    () => ["Name", "Email", "Mobile", "Status", "Active", "Actions"],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Executives</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage executive registration requests, approvals, and active
            status.
          </p>
        </div>
      </div>

      <Card padding="lg">
        <div className="flex flex-wrap gap-2 mb-4">
          {statuses.map((option) => (
            <Button
              key={option}
              variant={status === option ? "solid" : "outline"}
              size="sm"
              onClick={() => {
                setStatus(option);
                setPage(1);
              }}
            >
              {option}
            </Button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHeadCell key={column}>{column}</TableHeadCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell className="col-span-full py-12 text-center text-slate-500">
                    Loading executives...
                  </TableCell>
                </TableRow>
              ) : executives.length === 0 ? (
                <TableRow>
                  <TableCell className="col-span-full py-12 text-center text-slate-500">
                    No executives found.
                  </TableCell>
                </TableRow>
              ) : (
                executives.map((executive) => (
                  <TableRow key={executive.id}>
                    <TableCell>{executive.name}</TableCell>
                    <TableCell>{executive.email}</TableCell>
                    <TableCell>{executive.mobile_number ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          executive.approval_status === "APPROVED"
                            ? "success"
                            : executive.approval_status === "REJECTED"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {executive.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={executive.is_active ? "success" : "secondary"}
                      >
                        {executive.is_active ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {executive.approval_status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(executive.id)}
                            disabled={isBusy}
                            icon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = window.prompt(
                                "Optional rejection reason (leave blank to skip)",
                              );
                              rejectMutation.mutate({
                                id: executive.id,
                                reason: reason ?? undefined,
                              });
                            }}
                            disabled={isBusy}
                            icon={<XCircle className="w-4 h-4" />}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          {executive.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                disableMutation.mutate(executive.id)
                              }
                              disabled={isBusy}
                              icon={<Lock className="w-4 h-4" />}
                            >
                              Disable
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                enableMutation.mutate(executive.id)
                              }
                              disabled={isBusy}
                              icon={<Unlock className="w-4 h-4" />}
                            >
                              Enable
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          loading={isLoading}
        />
      </Card>
    </div>
  );
}
