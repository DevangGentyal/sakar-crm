import { getClient } from "../config/db";
import {
  createLead,
  updateLead,
  insertHistory,
  findLeadById,
  findLeadHistoryByLeadId,
  resolveProjectId,
  listLeads,
  LeadRow,
  LeadHistoryRow,
  CreateLeadInput,
  UpdateLeadInput,
  LeadListParams,
} from "../repositories/lead.repository";
import { generateLeadCode } from "../utils/leadCode";
import { logDebug, logError } from "../utils/logger";

// ─── Error Types ──────────────────────────────────────────────────────────────

export class DuplicateMobileError extends Error {
  constructor() {
    super("A lead with this mobile number already exists");
    this.name = "DuplicateMobileError";
  }
}

export class LeadNotFoundError extends Error {
  constructor() {
    super("Lead not found");
    this.name = "LeadNotFoundError";
  }
}

export class TerminalStateError extends Error {
  constructor(status: string) {
    super(`Lead is in terminal state "${status}" and cannot be updated`);
    this.name = "TerminalStateError";
  }
}

export class UnauthorizedAssignError extends Error {
  constructor() {
    super("EXECUTIVE role cannot assign leads to other users");
    this.name = "UnauthorizedAssignError";
  }
}

export class UnauthorizedLeadAccessError extends Error {
  constructor() {
    super("You do not have access to this lead");
    this.name = "UnauthorizedLeadAccessError";
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(["BOOKED", "LOST"]);

const ALLOWED_STATUS_TRANSITIONS: Record<string, Set<string>> = {
  NEW: new Set(["CONTACTED", "LOST"]),
  CONTACTED: new Set(["FOLLOW_UP", "INTERESTED", "LOST"]),
  FOLLOW_UP: new Set(["FOLLOW_UP", "INTERESTED", "LOST"]),
  INTERESTED: new Set(["FOLLOW_UP", "SITE_VISIT", "LOST"]),
  SITE_VISIT: new Set(["FOLLOW_UP", "NEGOTIATION", "LOST"]),
  NEGOTIATION: new Set(["FOLLOW_UP", "BOOKED", "LOST"]),
};

export class InvalidStatusTransitionError extends Error {
  constructor(previous: string, next: string) {
    super(`Invalid lead status transition: ${previous} → ${next}`);
    this.name = "InvalidStatusTransitionError";
  }
}

export class NoLeadChangesError extends Error {
  constructor() {
    super("No lead fields changed");
    this.name = "NoLeadChangesError";
  }
}

// ─── Service Methods ─────────────────────────────────────────────────────────

export interface CreateLeadServiceInput extends Omit<
  CreateLeadInput,
  "leadCode" | "status" | "projectId"
> {
  companyId: string;
  projectId?: string;
  status?: string;
}

export async function createLeadService(
  input: CreateLeadServiceInput,
): Promise<LeadRow> {
  const client = await getClient();
  try {
    logDebug("Lead create transaction started", {
      userId: input.createdBy,
      customerNamePresent: Boolean(input.customerName),
      mobilePresent: Boolean(input.mobile),
      source: input.source,
      optionalFields: {
        alternateMobile: Boolean(input.alternateMobile),
        email: Boolean(input.email),
        city: Boolean(input.city),
        occupation: Boolean(input.occupation),
        budget: input.budget !== undefined,
        nextFollowupDate: Boolean(input.nextFollowupDate),
        remarks: Boolean(input.remarks),
      },
    });
    await client.query("BEGIN");

    const leadCode = await generateLeadCode(client);
    logDebug("Lead code generated", { leadCode });
    const status = input.status ?? "NEW";
    const projectId = await resolveProjectId(
      client,
      input.projectId,
      input.createdBy,
    );
    logDebug("Lead required values resolved", { status, projectId });

    const lead = await createLead(client, {
      ...input,
      projectId,
      leadCode,
      status,
    });
    logDebug("Lead row inserted", {
      leadId: lead.id,
      leadCode: lead.lead_code,
    });

    await insertHistory(client, {
      companyId: input.companyId,
      leadId: lead.id,
      previousStatus: null,
      newStatus: lead.status,
      remarks: input.remarks,
      updatedBy: input.createdBy,
      changedFields: { Status: status },
    });
    logDebug("Initial lead history inserted", { leadId: lead.id });

    await client.query("COMMIT");
    logDebug("Lead create transaction committed", { leadId: lead.id });
    return lead;
  } catch (err) {
    logError("Lead create transaction rolled back", {
      userId: input.createdBy,
      error: err,
    });
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export interface UpdateLeadServiceInput extends UpdateLeadInput {
  updatedBy: string;
  updatedByRole: string;
  companyId: string;
}

export async function updateLeadService(
  id: string,
  input: UpdateLeadServiceInput,
): Promise<{ lead: LeadRow; history: LeadHistoryRow }> {
  const existing = await findLeadById(id, input.companyId);
  if (!existing) {
    throw new LeadNotFoundError();
  }

  // Terminal state guard
  if (TERMINAL_STATUSES.has(existing.status)) {
    throw new TerminalStateError(existing.status);
  }

  if (input.status && input.status !== existing.status) {
    const allowed = ALLOWED_STATUS_TRANSITIONS[existing.status];
    if (!allowed?.has(input.status)) {
      throw new InvalidStatusTransitionError(existing.status, input.status);
    }
  }

  // Executives may edit leads they can access. Only admins/super-admins may
  // reassign leads to other users.
  if ("assignedUserId" in input && input.updatedByRole === "EXECUTIVE") {
    const requestedAssignedUserId =
      input.assignedUserId === "" ? null : input.assignedUserId;
    const currentAssignedUserId =
      existing.assigned_user_id === "" ? null : existing.assigned_user_id;

    if (
      requestedAssignedUserId !== null &&
      requestedAssignedUserId !== currentAssignedUserId
    ) {
      throw new UnauthorizedAssignError();
    }
  }

  const { updatedBy, updatedByRole: _role, ...requestedPatch } = input;

  // Forms submit their complete state. Convert that complete payload into a
  // real partial update by comparing every supplied value with the database
  // snapshot. This keeps unchanged fields out of SQL and history.
  const existingValues: Record<string, unknown> = {
    customerName: existing.customer_name,
    mobile: existing.mobile,
    alternateMobile: existing.alternate_mobile,
    email: existing.email,
    photoUrl: existing.photo_url,
    city: existing.city,
    occupation: existing.occupation,
    source: existing.source,
    status: existing.status,
    remarks: existing.remarks,
    assignedUserId: existing.assigned_user_id,
    budget: existing.budget === null ? null : Number(existing.budget),
    nextFollowupDate: existing.next_followup_date?.toISOString() ?? null,
  };
  const patch: UpdateLeadInput = {};
  const valuesEqual = (
    field: string,
    nextValue: unknown,
    currentValue: unknown,
  ): boolean => {
    if (nextValue === undefined) return true;
    const normalizedNext = nextValue === "" ? null : nextValue;
    const normalizedCurrent = currentValue === "" ? null : currentValue;
    if (field === "budget") {
      if (
        normalizedNext === null ||
        normalizedNext === undefined ||
        Number.isNaN(normalizedNext)
      ) {
        return normalizedCurrent === null || normalizedCurrent === undefined;
      }
      return Number(normalizedNext) === Number(normalizedCurrent);
    }
    if (field === "nextFollowupDate") {
      if (normalizedNext === null) return normalizedCurrent === null;
      return (
        new Date(String(normalizedNext)).getTime() ===
        new Date(String(normalizedCurrent)).getTime()
      );
    }
    return normalizedNext === normalizedCurrent;
  };

  for (const [field, value] of Object.entries(requestedPatch)) {
    if (
      field in existingValues &&
      !valuesEqual(field, value, existingValues[field])
    ) {
      (patch as Record<string, unknown>)[field] = value === "" ? null : value;
    }
  }
  if (Object.keys(patch).length === 0) {
    throw new NoLeadChangesError();
  }

  const changedFields: Record<string, unknown> = {};
  const fieldLabels: Record<string, string> = {
    customerName: "Customer Name",
    mobile: "Mobile",
    alternateMobile: "Alternate Mobile",
    email: "Email",
    photoUrl: "Photo",
    city: "City",
    occupation: "Occupation",
    source: "Source",
    status: "Status",
    remarks: "Remarks",
    assignedUserId: "Assigned To",
    budget: "Budget",
    nextFollowupDate: "New Followup",
  };
  for (const [field, value] of Object.entries(patch)) {
    if (value !== undefined && fieldLabels[field]) {
      changedFields[fieldLabels[field]] = value ?? null;
    }
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const lead = await updateLead(client, id, patch);

    const history = await insertHistory(client, {
      companyId: input.companyId,
      leadId: id,
      previousStatus: existing.status,
      newStatus: lead.status,
      remarks: patch.remarks,
      updatedBy,
      changedFields,
    });

    await client.query("COMMIT");
    return { lead, history };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getLeadDetailsService(
  id: string,
  userId?: string,
  userRole?: string,
  companyId?: string,
): Promise<{ lead: LeadRow; history: LeadHistoryRow[] }> {
  const lead = await findLeadById(id, companyId);
  if (!lead) {
    throw new LeadNotFoundError();
  }
  if (userRole === "EXECUTIVE" && lead.assigned_user_id !== userId) {
    throw new UnauthorizedLeadAccessError();
  }
  const history = await findLeadHistoryByLeadId(id, companyId);
  return { lead, history };
}

export async function listLeadsService(params: LeadListParams): Promise<{
  rows: LeadRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { rows, total } = await listLeads(params);
  const totalPages = Math.ceil(total / params.limit);
  return { rows, total, page: params.page, limit: params.limit, totalPages };
}
