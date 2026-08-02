"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Edit2,
  PencilLine,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  User,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Tag,
  Hash,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  MessageSquare,
  Check,
  PhoneCall,
  Loader2,
  Play,
  Save,
  ChevronDown,
} from "lucide-react";
import {
  useLeadDetails,
  useLeadFollowups,
  useCreateFollowup,
  useCompleteFollowup,
  useLeadCalls,
  useInitiateLeadCall,
  useUpdateLeadCall,
} from "@/src/hooks";
import {
  Lead,
  LeadHistoryRecord,
  LeadFollowUp,
  LeadCall,
  LeadStatus,
  LeadSource,
} from "@/src/types";
import {
  getStatusLabel,
  getStatusColor,
  getSourceLabel,
  formatDate,
  formatRelativeTime,
} from "@/src/utils/helpers";
import { getApiErrorMessage } from "@/src/utils/api-error";
import { EditLeadDialog } from "@/src/components/leads/EditLeadDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusIcon = (status: LeadStatus) => {
  switch (status) {
    case "NEW":
      return <Tag className="w-3.5 h-3.5" />;
    case "CONTACTED":
      return <Phone className="w-3.5 h-3.5" />;
    case "FOLLOW_UP":
      return <RefreshCw className="w-3.5 h-3.5" />;
    case "INTERESTED":
      return <TrendingUp className="w-3.5 h-3.5" />;
    case "SITE_VISIT":
      return <Building2 className="w-3.5 h-3.5" />;
    case "NEGOTIATION":
      return <MessageSquare className="w-3.5 h-3.5" />;
    case "BOOKED":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "LOST":
      return <XCircle className="w-3.5 h-3.5" />;
    default:
      return <AlertCircle className="w-3.5 h-3.5" />;
  }
};

const getTimelineDotColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    NEW: "bg-blue-500 ring-blue-100",
    CONTACTED: "bg-purple-500 ring-purple-100",
    FOLLOW_UP: "bg-yellow-500 ring-yellow-100",
    INTERESTED: "bg-teal-500 ring-teal-100",
    SITE_VISIT: "bg-cyan-500 ring-cyan-100",
    NEGOTIATION: "bg-orange-500 ring-orange-100",
    BOOKED: "bg-green-500 ring-green-100",
    LOST: "bg-red-500 ring-red-100",
  };
  return colors[status] || "bg-slate-400 ring-slate-100";
};

const formatBudget = (budget?: number): string => {
  if (!budget) return "Not specified";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(budget);
};

const formatCallDuration = (duration?: number | null): string => {
  if (duration === null || duration === undefined || duration < 0) {
    return "—";
  }

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
};

const EMPTY_ARRAY: never[] = [];

// ─── Sub Components ────────────────────────────────────────────────────────────

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | undefined | null;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({
  icon,
  label,
  value,
  className,
}) => (
  <div className={`flex items-start gap-3 ${className || ""}`}>
    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
        {value || "—"}
      </p>
    </div>
  </div>
);

const CallStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    queued: "bg-slate-100 text-slate-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    busy: "bg-amber-100 text-amber-700",
    "no-answer": "bg-orange-100 text-orange-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status.toLowerCase()] || "bg-slate-100 text-slate-700"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

const callOutcomeOptions = [
  "Connected",
  "Busy",
  "No Answer",
  "Failed",
  "Follow-up Required",
];

const outcomeFromStatus = (status?: string | null): string => {
  switch ((status ?? "").toLowerCase()) {
    case "completed":
      return "Connected";
    case "busy":
      return "Busy";
    case "no-answer":
      return "No Answer";
    case "failed":
      return "Failed";
    case "in-progress":
    case "queued":
    case "ringing":
      return "Follow-up Required";
    default:
      return "";
  }
};

const formatCompactTime = (value?: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatTimeOnly = (value?: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const getCallDirection = (call: LeadCall): string | null => {
  const from = call.fromNumber?.trim();
  const to = call.toNumber?.trim();
  if (!from || !to) return null;
  return from === to ? null : `${from} → ${to}`;
};

const normalizeOutcome = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "connected") return "Connected";
  if (trimmed === "busy") return "Busy";
  if (trimmed === "no answer" || trimmed === "no-answer") return "No Answer";
  if (trimmed === "failed") return "Failed";
  if (trimmed === "follow-up required" || trimmed === "follow up required") {
    return "Follow-up Required";
  }
  return value.trim();
};

const OutcomeBadge: React.FC<{ value: string }> = ({ value }) => {
  const styles: Record<string, string> = {
    Connected: "bg-emerald-100 text-emerald-700",
    Busy: "bg-amber-100 text-amber-700",
    "No Answer": "bg-orange-100 text-orange-700",
    Failed: "bg-rose-100 text-rose-700",
    "Follow-up Required": "bg-sky-100 text-sky-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] || "bg-slate-100 text-slate-700"}`}
    >
      {value}
    </span>
  );
};

const CallActivityCard: React.FC<{
  call: LeadCall;
  notesValue: string;
  outcomeValue: string;
  isEditingNotes: boolean;
  isEditingOutcome: boolean;
  onNotesChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onStartEditingNotes: () => void;
  onCancelNotes: () => void;
  onSaveNotes: () => void;
  onStartEditingOutcome: () => void;
  onSelectOutcome: (value: string) => void;
  onCancelOutcome: () => void;
  onSave: () => void;
  saving: boolean;
}> = ({
  call,
  notesValue,
  outcomeValue,
  isEditingNotes,
  isEditingOutcome,
  onNotesChange,
  onOutcomeChange,
  onStartEditingNotes,
  onCancelNotes,
  onSaveNotes,
  onStartEditingOutcome,
  onSelectOutcome,
  onCancelOutcome,
  onSave,
  saving,
}) => {
  const callDirection = getCallDirection(call);
  const durationLabel = formatCallDuration(call.duration);
  const statusTone =
    (call.status || "").toLowerCase() === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : (call.status || "").toLowerCase() === "busy"
        ? "bg-amber-100 text-amber-700"
        : (call.status || "").toLowerCase() === "no-answer"
          ? "bg-orange-100 text-orange-700"
          : (call.status || "").toLowerCase() === "failed"
            ? "bg-rose-100 text-rose-700"
            : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-slate-900">
              {call.toNumber}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone}`}
            >
              {call.status ? call.status.replace(/_/g, " ") : "Unknown"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-slate-900">
            {durationLabel}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span className="font-medium text-slate-700">
          {call.initiatedByName || "System"}
        </span>
        <span>•</span>
        <span>{formatCompactTime(call.answeredAt)}</span>
        <span>•</span>
        <span>
          Ended{" "}
          {call.endedAt
            ? formatCompactTime(call.endedAt).split(", ").slice(1).join(", ") ||
              formatCompactTime(call.endedAt)
            : "—"}
        </span>
        <span>•</span>
        <span>{callDirection || "Outbound"}</span>
      </div>

      {/* <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Outcome
          </span>
          <OutcomeBadge
            value={
              outcomeValue ||
              outcomeFromStatus(call.status) ||
              "Follow-up Required"
            }
          />
          <button
            type="button"
            onClick={onStartEditingOutcome}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit outcome"
          >
            <PencilLine className="h-3.5 w-3.5" />
          </button>
        </div>
        {isEditingOutcome ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {callOutcomeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onSelectOutcome(option)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  option === outcomeValue
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              onClick={onCancelOutcome}
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div> */}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Notes
            </p>
            {isEditingNotes ? (
              <textarea
                value={notesValue}
                onChange={(event) => onNotesChange(event.target.value)}
                rows={4}
                className="mt-2 min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            ) : (
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {notesValue.trim() ? notesValue : "No notes added."}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isEditingNotes ? (
              <>
                <button
                  type="button"
                  onClick={onSaveNotes}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={onCancelNotes}
                  className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartEditingNotes}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <PencilLine className="h-3.5 w-3.5" />
                Edit Notes
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600"
          onClick={() => void 0}
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Recording {call.duration ? `(${durationLabel})` : ""}
        </button>
        {call.recordingUrl ? (
          <div className="mt-2">
            <audio controls preload="none" className="h-9 w-full">
              <source src={call.recordingUrl} />
            </audio>
          </div>
        ) : null}
      </div>

      {call.errorMessage ? (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-rose-600">
          {call.errorMessage}
        </div>
      ) : null}
    </div>
  );
};

// ─── History Timeline ──────────────────────────────────────────────────────────

const HistoryTimeline: React.FC<{ history: LeadHistoryRecord[] }> = ({
  history,
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock className="w-8 h-8 mb-3 opacity-40" />
        <p className="text-sm font-medium">No history yet</p>
        <p className="text-xs mt-1">Lead modifications will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent" />

      <div className="space-y-0">
        {history.map((event, index) => {
          const isLast = index === history.length - 1;
          const dotColor = getTimelineDotColor(event.newStatus as LeadStatus);

          return (
            <div key={event.id} className="relative flex gap-4 group">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full ${dotColor} ring-4 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110`}
                >
                  <span className="text-white">
                    {getStatusIcon(event.newStatus as LeadStatus)}
                  </span>
                </div>
              </div>

              {/* Event content */}
              <div className={`flex-1 pb-6 ${isLast ? "pb-2" : ""}`}>
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
                  {/* Changed fields */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {Object.entries(event.changedFields || {}).map(
                      ([field, value]) => (
                        <span
                          key={field}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
                        >
                          {field}: {String(value || "—")}
                        </span>
                      ),
                    )}
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-slate-500">
                        {event.updatedByName || "System"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-xs text-slate-400"
                      title={formatDate(event.updatedAt)}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(event.updatedAt)}</span>
                      <span className="text-slate-300">·</span>
                      <span>{formatDate(event.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const LeadDetailsSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-slate-200 rounded-lg w-48 mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 h-48" />
        <div className="bg-white rounded-2xl p-6 border border-slate-100 h-64" />
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 h-96" />
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [followupDate, setFollowupDate] = useState("");
  const [followupNotes, setFollowupNotes] = useState("");
  const [displayFollowups, setDisplayFollowups] = useState<LeadFollowUp[]>([]);
  const [selectedFollowupForCall, setSelectedFollowupForCall] = useState<
    string | null
  >(null);
  const [callNotesDrafts, setCallNotesDrafts] = useState<
    Record<string, string>
  >({});
  const [callOutcomeDrafts, setCallOutcomeDrafts] = useState<
    Record<string, string>
  >({});
  const [editingCallNotesId, setEditingCallNotesId] = useState<string | null>(
    null,
  );
  const [editingCallOutcomeId, setEditingCallOutcomeId] = useState<
    string | null
  >(null);
  const [pendingFollowupRefresh, setPendingFollowupRefresh] = useState(false);
  const [animatingFollowupId, setAnimatingFollowupId] = useState<string | null>(
    null,
  );
  const [callActionError, setCallActionError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const { data, isLoading, isError, refetch } = useLeadDetails(id);
  const { data: followupsData, refetch: refetchFollowups } =
    useLeadFollowups(id);
  const { data: callsData, refetch: refetchCalls } = useLeadCalls(id, {
    refetchInterval: (query) => {
      const items = (query.state.data as LeadCall[] | undefined) ?? [];
      const shouldPoll = items.some((call) => {
        const status = (call.status ?? "").toLowerCase();
        return (
          status === "queued" ||
          status === "ringing" ||
          status === "in-progress"
        );
      });

      return shouldPoll ? 5000 : false;
    },
  });
  const createFollowupMutation = useCreateFollowup();
  const completeFollowupMutation = useCompleteFollowup();
  const initiateCallMutation = useInitiateLeadCall();
  const updateCallMutation = useUpdateLeadCall();

  const lead = data?.lead;
  const history = data?.history ?? [];
  const followups = followupsData ?? EMPTY_ARRAY;
  const calls = callsData ?? EMPTY_ARRAY;

  useEffect(() => {
    setCallNotesDrafts((current) => {
      const next = { ...current };
      for (const call of calls) {
        if (next[call.id] === undefined && call.notes) {
          next[call.id] = call.notes;
        }
      }
      return next;
    });

    setCallOutcomeDrafts((current) => {
      const next = { ...current };
      for (const call of calls) {
        if (next[call.id] === undefined) {
          next[call.id] = call.outcome || outcomeFromStatus(call.status) || "";
        }
      }
      return next;
    });
  }, [calls]);

  const handleEditClose = () => {
    setShowEditDialog(false);
    refetch();
  };

  useEffect(() => {
    if (pendingFollowupRefresh) return;
    setDisplayFollowups(followups);
  }, [followups, pendingFollowupRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleCreateFollowup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!followupDate) return;
    await createFollowupMutation.mutateAsync({
      leadId: id,
      followupDate,
      notes: followupNotes || undefined,
    });
    setFollowupDate("");
    setFollowupNotes("");
    refetch();
  };

  const handleInitiateCall = async (followupId?: string | null) => {
    setSelectedFollowupForCall(followupId ?? null);
    setCallActionError(null);
    try {
      await initiateCallMutation.mutateAsync({
        leadId: id,
        followupId: followupId || null,
      });
      void refetchCalls();
    } catch (error) {
      setCallActionError(
        getApiErrorMessage(
          error,
          "Failed to start the call. Please try again.",
        ),
      );
    }
  };

  const handleSaveCallContext = async (call: LeadCall) => {
    const notes = (callNotesDrafts[call.id] ?? call.notes ?? "").trim();
    const outcome = (
      callOutcomeDrafts[call.id] ??
      call.outcome ??
      outcomeFromStatus(call.status) ??
      ""
    ).trim();

    await updateCallMutation.mutateAsync({
      leadId: id,
      callId: call.id,
      input: { notes: notes || null, outcome: outcome || null },
    });
    setEditingCallNotesId(null);
    setEditingCallOutcomeId(null);
  };

  const handleFollowupToggle = (followup: LeadFollowUp, completed: boolean) => {
    setDisplayFollowups((current) =>
      current.map((item) =>
        item.id === followup.id
          ? { ...item, status: completed ? "BOOKED" : undefined }
          : item,
      ),
    );
    setAnimatingFollowupId(followup.id);
    setPendingFollowupRefresh(true);

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = window.setTimeout(() => {
      setPendingFollowupRefresh(false);
      setAnimatingFollowupId(null);
      void refetchFollowups();
    }, 5000);

    completeFollowupMutation.mutate({
      leadId: id,
      followupId: followup.id,
      completed,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <LeadDetailsSkeleton />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Lead not found
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            This lead may have been deleted or doesn't exist.
          </p>
          <button
            onClick={() => router.push("/leads")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page background gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-slate-800 to-slate-700 -z-10" />

      <div className="relative px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* ── Top Navigation Bar ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/leads")}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditDialog(true)}
              disabled={lead.status === "BOOKED" || lead.status === "LOST"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Edit2 className="w-4 h-4" />
              Edit Lead
            </button>
          </div>
        </div>

        {/* ── Hero Header Card ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-6 shadow-lg border border-slate-600/30">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0 overflow-hidden ring-2 ring-white/20">
                {lead.photoUrl ? (
                  <img
                    src={lead.photoUrl}
                    alt={lead.customerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>
                    {lead.customerName?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {lead.customerName}
                </h1>
                {lead.occupation && (
                  <p className="text-sm text-slate-300 mt-0.5">
                    {lead.occupation}
                  </p>
                )}
                {lead.leadCode && (
                  <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-mono text-slate-300">
                      {lead.leadCode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusColor(lead.status)}`}
              >
                {getStatusIcon(lead.status)}
                {getStatusLabel(lead.status)}
              </span>

              {/* Source badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                <Tag className="w-3 h-3" />
                {getSourceLabel(lead.source as LeadSource)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column: Details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Contact Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem
                  icon={<Phone className="w-4 h-4" />}
                  label="Mobile"
                  value={lead.mobile}
                />
                {lead.alternateMobile && (
                  <InfoItem
                    icon={<Phone className="w-4 h-4" />}
                    label="Alternate Mobile"
                    value={lead.alternateMobile}
                  />
                )}
                <InfoItem
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={lead.email || undefined}
                />
                <InfoItem
                  icon={<MapPin className="w-4 h-4" />}
                  label="City"
                  value={lead.location}
                />
                <InfoItem
                  icon={<Briefcase className="w-4 h-4" />}
                  label="Occupation"
                  value={lead.occupation}
                />
              </div>
            </div>

            {/* Deal Information */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Deal Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoItem
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Budget"
                  value={formatBudget(lead.budget)}
                />
                <InfoItem
                  icon={<Tag className="w-4 h-4" />}
                  label="Lead Source"
                  value={getSourceLabel(lead.source as LeadSource)}
                />
                {/* <InfoItem
                  icon={<Building2 className="w-4 h-4" />}
                  label="Project ID"
                  value={lead.projectId}
                /> */}
                <InfoItem
                  icon={<User className="w-4 h-4" />}
                  label="Assigned To"
                  value={
                    lead.assignedUserName ||
                    (lead.assignedTo ? "Assigned" : "Unassigned")
                  }
                />
                {lead.nextFollowupDate && (
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Next Follow Up"
                    value={formatDate(lead.nextFollowupDate)}
                  />
                )}
              </div>

              {/* Remarks */}
              {lead.notes && (
                <div className="px-6 pb-6">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Remarks
                    </p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {lead.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Meta & History ── */}
          <div className="space-y-6">
            {/* Meta card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">
                  Timeline
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <InfoItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Created"
                  value={`${formatDate(lead.createdAt)} · ${formatRelativeTime(lead.createdAt)}`}
                />
                <InfoItem
                  icon={<RefreshCw className="w-4 h-4" />}
                  label="Last Updated"
                  value={`${formatDate(lead.updatedAt)} · ${formatRelativeTime(lead.updatedAt)}`}
                />
                {lead.createdByName && (
                  <InfoItem
                    icon={<User className="w-4 h-4" />}
                    label="Created By"
                    value={lead.createdByName}
                  />
                )}
              </div>
            </div>

            {/* History count stat */}
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Total History Events
              </p>
              <p className="text-4xl font-bold mt-1">{history.length}</p>
              <p className="text-sm text-indigo-200 mt-1">
                Modifications tracked
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-700">Follow-ups</h2>
          </div>
          <div className="p-6 space-y-4">
            <form
              onSubmit={handleCreateFollowup}
              className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 items-end"
            >
              <label className="text-xs font-medium text-slate-500">
                Follow-up date
                <input
                  required
                  type="datetime-local"
                  value={followupDate}
                  onChange={(event) => setFollowupDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Notes
                <input
                  value={followupNotes}
                  onChange={(event) => setFollowupNotes(event.target.value)}
                  placeholder="Add follow-up notes"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={createFollowupMutation.isPending}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Add Follow-up
              </button>
            </form>
            <div className="space-y-3">
              {displayFollowups.map((followup) => (
                <div
                  key={followup.id}
                  className={`rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 transition-all duration-300 ease-out ${
                    animatingFollowupId === followup.id ? "shadow-sm" : ""
                  }`}
                  style={{
                    animation:
                      animatingFollowupId === followup.id
                        ? "followupCardSlide 0.35s ease-out"
                        : undefined,
                  }}
                >
                  {/* <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatDate(followup.followupDate)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {followup.createdByName || "System"}
                    </span>
                  </div> */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold text-slate-700">
                        {formatDate(followup.followupDate)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={completeFollowupMutation.isPending}
                      onClick={() =>
                        handleFollowupToggle(
                          followup,
                          followup.status !== "BOOKED",
                        )
                      }
                      className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
                        followup.status === "BOOKED"
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                          : "border-slate-300 bg-white text-transparent hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500"
                      } ${
                        completeFollowupMutation.isPending
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                  {followup.notes && (
                    <p className="mt-1 text-sm text-slate-600">
                      {followup.notes}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>{followup.createdByName || "System"}</span>
                    <button
                      type="button"
                      disabled={initiateCallMutation.isPending}
                      onClick={() => void handleInitiateCall(followup.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
                    >
                      {initiateCallMutation.isPending &&
                      selectedFollowupForCall === followup.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PhoneCall className="h-3.5 w-3.5" />
                      )}
                      Call this follow-up
                    </button>
                  </div>
                </div>
              ))}

              {displayFollowups.length === 0 && (
                <p className="text-sm text-slate-400">
                  No follow-ups scheduled yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Call Activity
              </h2>
            </div>
            <span className="text-xs text-slate-400">Tracked via Exotel</span>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {callActionError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {callActionError}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleInitiateCall(null)}
              disabled={initiateCallMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            >
              {initiateCallMutation.isPending &&
              selectedFollowupForCall === null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Call Lead Now
            </button>
            {calls.length === 0 ? (
              <p className="text-sm text-slate-400">No calls recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <CallActivityCard
                    key={call.id}
                    call={call}
                    notesValue={callNotesDrafts[call.id] ?? call.notes ?? ""}
                    outcomeValue={
                      callOutcomeDrafts[call.id] ??
                      call.outcome ??
                      outcomeFromStatus(call.status)
                    }
                    isEditingNotes={editingCallNotesId === call.id}
                    isEditingOutcome={editingCallOutcomeId === call.id}
                    onNotesChange={(value) =>
                      setCallNotesDrafts((current) => ({
                        ...current,
                        [call.id]: value,
                      }))
                    }
                    onOutcomeChange={(value) =>
                      setCallOutcomeDrafts((current) => ({
                        ...current,
                        [call.id]: value,
                      }))
                    }
                    onStartEditingNotes={() => setEditingCallNotesId(call.id)}
                    onCancelNotes={() => setEditingCallNotesId(null)}
                    onSaveNotes={() => void handleSaveCallContext(call)}
                    onStartEditingOutcome={() =>
                      setEditingCallOutcomeId(call.id)
                    }
                    onSelectOutcome={(value) => {
                      setCallOutcomeDrafts((current) => ({
                        ...current,
                        [call.id]: normalizeOutcome(value),
                      }));
                      setEditingCallOutcomeId(null);
                    }}
                    onCancelOutcome={() => setEditingCallOutcomeId(null)}
                    onSave={() => void handleSaveCallContext(call)}
                    saving={updateCallMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Lead History Timeline (full width) ── */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Lead History
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-full">
                {history.length} events
              </span>
            </div>
            <span className="text-xs text-slate-400">Newest → Oldest</span>
          </div>
          <div className="p-6">
            <HistoryTimeline history={history} />
          </div>
        </div>
      </div>

      {/* ── Edit Dialog ── */}
      {lead && (
        <EditLeadDialog
          isOpen={showEditDialog}
          onClose={handleEditClose}
          lead={lead}
        />
      )}
    </div>
  );
}

<style jsx global>{`
  @keyframes followupCardSlide {
    0% {
      transform: translateY(6px);
      opacity: 0.75;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`}</style>;
