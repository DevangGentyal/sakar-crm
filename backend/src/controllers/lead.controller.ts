import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middleware/error.middleware";
import {
  createLeadService,
  updateLeadService,
  getLeadDetailsService,
  listLeadsService,
  DuplicateMobileError,
  LeadNotFoundError,
  TerminalStateError,
  UnauthorizedAssignError,
  InvalidStatusTransitionError,
  UnauthorizedLeadAccessError,
  NoLeadChangesError,
} from "../services/lead.service";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { logDebug, logError } from "../utils/logger";
import { getPublicImageUrl } from "../services/storage/public-url";

export async function createLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const body = req.body as {
      customer_name: string;
      mobile: string;
      alternate_mobile?: string;
      email?: string;
      photo_url?: string;
      city?: string;
      occupation?: string;
      budget?: number;
      source: string;
      project_id?: string;
      assigned_user_id?: string;
      remarks?: string;
      next_followup_date?: string;
    };

    logDebug("Lead create request received", {
      userId: req.user?.id,
      fields: Object.keys(req.body ?? {}),
      mobilePresent: Boolean(body.mobile),
      source: body.source,
      projectIdProvided: Boolean(body.project_id),
    });

    const lead = await createLeadService({
      companyId: req.user!.companyId,
      customerName: body.customer_name,
      mobile: body.mobile,
      alternateMobile: body.alternate_mobile,
      email: body.email,
      photoUrl: body.photo_url,
      city: body.city,
      occupation: body.occupation,
      budget: body.budget,
      source: body.source,
      projectId: body.project_id,
      assignedUserId: body.assigned_user_id,
      remarks: body.remarks,
      nextFollowupDate: body.next_followup_date,
      createdBy: req.user!.id,
    });

    sendSuccess(res, lead, {
      statusCode: 201,
      message: "Lead created successfully",
    });
  } catch (err) {
    logError("Lead create request failed", {
      userId: req.user?.id,
      error: err,
    });
    if (err instanceof DuplicateMobileError) {
      sendError(res, err.message, {
        statusCode: 409,
        code: "DUPLICATE_MOBILE",
      });
      return;
    }
    next(err);
  }
}

export async function listLeadsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = parseInt((req.query.limit as string) ?? "20", 10);

    const result = await listLeadsService({
      page,
      limit,
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      source: req.query.source as string | undefined,
      projectId: req.query.project_id as string | undefined,
      // ADMIN and SUPER_ADMIN have unrestricted visibility. Never apply an
      // assignment scope to those requests, even if a stale query parameter is
      // present.
      assignedUserId:
        req.user!.role === "ADMIN" || req.user!.role === "SUPER_ADMIN"
          ? undefined
          : (req.query.assigned_user_id as string | undefined),
      userId: req.user!.id,
      userRole: req.user!.role,
      companyId: req.user!.companyId,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as "ASC" | "DESC") ?? "DESC",
    });

    logDebug("Lead list access scope applied", {
      userId: req.user!.id,
      role: req.user!.role,
      total: result.total,
      assignmentScope:
        req.user!.role === "EXECUTIVE" ? req.user!.id : "ALL_LEADS",
    });

    // Map snake_case DB columns to camelCase for the frontend
    const mappedRows = result.rows.map((row: any) => ({
      id: row.id,
      leadCode: row.lead_code,
      customerName: row.customer_name,
      email: row.email ?? "",
      photoUrl: getPublicImageUrl(row.photo_url) ?? undefined,
      mobile: row.mobile,
      status: row.status,
      source: row.source,
      projectId: row.project_id,
      budget: row.budget ? parseFloat(row.budget) : undefined,
      location: row.city ?? undefined,
      notes: row.remarks ?? undefined,
      assignedTo: row.assigned_user_id ?? undefined,
      assignedUserName: row.assigned_user_name ?? undefined,
      occupation: row.occupation ?? undefined,
      alternateMobile: row.alternate_mobile ?? undefined,
      nextFollowupDate: row.next_followup_date
        ? row.next_followup_date.toISOString()
        : undefined,
      latestFollowupDate: row.latest_followup_date
        ? row.latest_followup_date.toISOString()
        : undefined,
      latestFollowupNotes: row.latest_followup_notes ?? undefined,
      latestStatusChangeAt: row.latest_status_change_at
        ? row.latest_status_change_at.toISOString()
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      companyId: row.company_id ?? undefined,
      companyName: row.company_name ?? undefined,
    }));

    // Send in PaginatedResponse<Lead> format that the frontend expects
    sendSuccess(res, {
      data: mappedRows,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { lead: row, history: historyRows } = await getLeadDetailsService(
      id,
      req.user?.id,
      req.user?.role,
      req.user?.companyId,
    );

    const lead = {
      id: row.id,
      leadCode: row.lead_code,
      customerName: row.customer_name,
      email: row.email ?? "",
      photoUrl: getPublicImageUrl(row.photo_url) ?? undefined,
      mobile: row.mobile,
      alternateMobile: row.alternate_mobile ?? undefined,
      status: row.status,
      source: row.source,
      budget: row.budget ? parseFloat(row.budget) : undefined,
      location: row.city ?? undefined,
      occupation: row.occupation ?? undefined,
      notes: row.remarks ?? undefined,
      assignedTo: row.assigned_user_id ?? undefined,
      assignedUserName: row.assigned_user_name ?? undefined,
      createdByName: row.created_by_name ?? undefined,
      nextFollowupDate: row.next_followup_date
        ? row.next_followup_date.toISOString()
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      companyId: row.company_id ?? undefined,
      companyName: row.company_name ?? undefined,
    };

    const history = historyRows.map((h) => ({
      id: h.id,
      leadId: h.lead_id,
      previousStatus: h.previous_status ?? null,
      newStatus: h.new_status,
      remarks: h.remarks ?? undefined,
      updatedBy: h.updated_by,
      updatedByName: h.updated_by_name ?? undefined,
      updatedAt: h.updated_at,
      changedFields: h.changed_fields ?? {},
    }));

    sendSuccess(res, { lead, history });
  } catch (err) {
    if (err instanceof LeadNotFoundError) {
      sendError(res, err.message, { statusCode: 404, code: "LEAD_NOT_FOUND" });
      return;
    }
    if (err instanceof UnauthorizedLeadAccessError) {
      sendError(res, err.message, { statusCode: 403, code: "FORBIDDEN" });
      return;
    }
    if (err instanceof NoLeadChangesError) {
      sendError(res, err.message, { statusCode: 422, code: "NO_LEAD_CHANGES" });
      return;
    }
    next(err);
  }
}

export async function updateLeadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const id = req.params.id as string;
    const body = req.body as {
      customer_name?: string;
      mobile?: string;
      alternate_mobile?: string | null;
      email?: string | null;
      photo_url?: string | null;
      city?: string | null;
      occupation?: string | null;
      source?: string;
      status?: string;
      remarks?: string;
      assigned_user_id?: string | null;
      budget?: number;
      next_followup_date?: string | null;
    };

    const { lead, history } = await updateLeadService(id, {
      ...("customer_name" in body && { customerName: body.customer_name }),
      ...("mobile" in body && { mobile: body.mobile }),
      ...("alternate_mobile" in body && {
        alternateMobile: body.alternate_mobile,
      }),
      ...("email" in body && { email: body.email }),
      ...("photo_url" in body && { photoUrl: body.photo_url }),
      ...("city" in body && { city: body.city }),
      ...("occupation" in body && { occupation: body.occupation }),
      ...("source" in body && { source: body.source }),
      ...("status" in body && { status: body.status }),
      remarks: body.remarks,
      ...("assigned_user_id" in body && {
        assignedUserId: body.assigned_user_id,
      }),
      budget: body.budget,
      ...("next_followup_date" in body && {
        nextFollowupDate: body.next_followup_date,
      }),
      updatedBy: req.user!.id,
      updatedByRole: req.user!.role,
      companyId: req.user!.companyId,
    });

    sendSuccess(
      res,
      { lead, history },
      { message: "Lead updated successfully" },
    );
  } catch (err) {
    if (err instanceof LeadNotFoundError) {
      sendError(res, err.message, { statusCode: 404, code: "LEAD_NOT_FOUND" });
      return;
    }
    if (err instanceof TerminalStateError) {
      sendError(res, err.message, { statusCode: 422, code: "TERMINAL_STATE" });
      return;
    }
    if (err instanceof UnauthorizedAssignError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "UNAUTHORIZED_ASSIGN",
      });
      return;
    }
    if (err instanceof InvalidStatusTransitionError) {
      sendError(res, err.message, {
        statusCode: 422,
        code: "INVALID_STATUS_TRANSITION",
      });
      return;
    }
    if (err instanceof UnauthorizedLeadAccessError) {
      sendError(res, err.message, { statusCode: 403, code: "FORBIDDEN" });
      return;
    }
    next(err);
  }
}
