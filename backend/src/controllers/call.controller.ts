import { NextFunction, Request, Response } from "express";
import { getClient } from "../config/db";
import { env } from "../config/env";
import { findUserById } from "../repositories/auth.repository";
import { findLeadById } from "../repositories/lead.repository";
import {
  createLeadCall,
  findLeadCallBySid,
  listLeadCalls,
  updateLeadCall,
  updateLeadCallBySid,
} from "../repositories/call.repository";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { validateRequest } from "../middleware/error.middleware";
import {
  exotelConfigured,
  getExotelCallDetails,
  initiateExotelCall,
} from "../services/exotel.service";
import { getExotelConfigStatus } from "../services/exotel.service";
import { logDebug, logError } from "../utils/logger";

function normalizeIndianNumber(number: string): string {
  const digits = number.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  if (digits.length === 13 && digits.startsWith("91")) {
    return `+${digits.substring(1)}`;
  }

  throw new Error("Invalid mobile number");
}

async function resolveExecutiveMobile(req: Request): Promise<string | null> {
  if (!req.user?.id) return null;
  const user = await findUserById(req.user.id);
  const mobile = user?.mobile_number ?? null;
  if (!mobile) return null;
  const digits = mobile.replace(/\D/g, "");

  return digits ? normalizeIndianNumber(digits) : null;
}

function getExotelCallPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const nestedCall = payload.Call as Record<string, unknown> | undefined;
  if (
    nestedCall &&
    typeof nestedCall === "object" &&
    !Array.isArray(nestedCall)
  ) {
    return nestedCall;
  }
  return payload;
}

function getWebhookPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const callPayload = getExotelCallPayload(payload);
  const nestedCall = callPayload.Call as Record<string, unknown> | undefined;

  if (
    nestedCall &&
    typeof nestedCall === "object" &&
    !Array.isArray(nestedCall)
  ) {
    return nestedCall;
  }

  return callPayload;
}

function readStringValue(
  payload: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function readDurationSeconds(payload: Record<string, unknown>): number | null {
  const candidates = [
    "Duration",
    "duration",
    "ConversationDuration",
    "conversationDuration",
    "OnCallDuration",
    "onCallDuration",
  ];

  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return Math.trunc(parsed);
      }
    }
  }

  const legs = payload.Legs;
  if (Array.isArray(legs)) {
    for (const leg of legs) {
      if (!leg || typeof leg !== "object" || Array.isArray(leg)) continue;
      const legDuration = (leg as Record<string, unknown>).OnCallDuration;
      if (typeof legDuration === "number" && Number.isFinite(legDuration)) {
        return Math.trunc(legDuration);
      }
      if (typeof legDuration === "string") {
        const parsed = Number(legDuration.trim());
        if (Number.isFinite(parsed)) {
          return Math.trunc(parsed);
        }
      }
    }
  }

  return null;
}

function readDateValue(
  payload: Record<string, unknown>,
  keys: string[],
): Date | null {
  const value = readStringValue(payload, keys);
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function extractCallSid(payload: Record<string, unknown>): string | null {
  const callPayload = getExotelCallPayload(payload);
  return (
    readStringValue(callPayload, ["Sid", "sid", "CallSid", "callSid"]) ||
    readStringValue(payload, ["CallSid", "callSid", "sid"])
  );
}

const pendingCallDetailRefreshes = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

function shouldRetryCallDetailsRefresh(call: {
  status?: string | null;
  recording_url?: string | null;
  duration?: number | null;
}): boolean {
  const normalizedStatus = (call.status || "").toLowerCase();
  return (
    (normalizedStatus === "completed" ||
      normalizedStatus === "answered" ||
      normalizedStatus === "terminated") &&
    (!call.recording_url ||
      call.duration === null ||
      call.duration === undefined)
  );
}

async function refreshCallDetailsFromExotel(
  callSid: string,
  companyId?: string,
): Promise<void> {
  try {
    const call = await findLeadCallBySid(callSid, companyId);
    if (!call) return;

    const details = await getExotelCallDetails(callSid);
    const nextStatus = details.status || call.status;
    const updatedCall = await updateLeadCallBySid(
      callSid,
      {
        status: nextStatus,
        answeredAt: details.startTime ? new Date(details.startTime) : undefined,
        endedAt: details.endTime ? new Date(details.endTime) : undefined,
        duration:
          details.duration !== undefined && details.duration !== null
            ? Math.trunc(details.duration)
            : undefined,
        recordingUrl: details.recordingUrl ?? undefined,
      },
      details.rawPayload,
    );

    if (updatedCall && shouldRetryCallDetailsRefresh(updatedCall)) {
      const timeout = setTimeout(() => {
        pendingCallDetailRefreshes.delete(callSid);
        void refreshCallDetailsFromExotel(callSid, companyId);
      }, 60000);
      pendingCallDetailRefreshes.set(callSid, timeout);
    } else {
      pendingCallDetailRefreshes.delete(callSid);
    }
  } catch (error) {
    logError("Exotel call detail refresh failed", {
      callSid,
      error: error instanceof Error ? error.message : error,
    });
    pendingCallDetailRefreshes.delete(callSid);
  }
}

function scheduleCallDetailsRefresh(callSid: string): void {
  if (!callSid || pendingCallDetailRefreshes.has(callSid)) {
    return;
  }

  const timeout = setTimeout(() => {
    pendingCallDetailRefreshes.delete(callSid);
    void refreshCallDetailsFromExotel(callSid);
  }, 30000);

  pendingCallDetailRefreshes.set(callSid, timeout);
}

export async function createLeadCallHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;
  try {
    if (!exotelConfigured()) {
      const configStatus = getExotelConfigStatus();
      sendError(
        res,
        `Exotel is not configured: missing ${configStatus.missing.join(", ")}`,
        { statusCode: 503, code: "EXOTEL_NOT_CONFIGURED" },
      );
      return;
    }

    const lead = await findLeadById(req.params.id as string);
    if (!lead) {
      sendError(res, "Lead not found", {
        statusCode: 404,
        code: "LEAD_NOT_FOUND",
      });
      return;
    }
    const toNumber = normalizeIndianNumber(lead.mobile);
    const fromNumber = await resolveExecutiveMobile(req);
    if (!fromNumber) {
      sendError(res, "Your account does not have a mobile number configured", {
        statusCode: 422,
        code: "EXECUTIVE_MOBILE_MISSING",
      });
      return;
    }
    const followupId =
      typeof req.body?.followupId === "string" ? req.body.followupId : null;
    const client = await getClient();
    try {
      logDebug("Lead call request received", {
        leadId: lead.id,
        followupId,
        leadMobilePresent: Boolean(lead.mobile),
        fromNumber,
        callerId: env.EXOTEL_CALLER_ID,
        accountSid: env.EXOTEL_ACCOUNT_SID,
        region: env.EXOTEL_REGION,
        userId: req.user!.id,
      });
      const customField = JSON.stringify({
        leadId: lead.id,
        followupId,
        initiatedBy: req.user!.id,
      });
      const response = await initiateExotelCall({
        to: toNumber,
        statusCallbackUrl:
          typeof req.body?.statusCallbackUrl === "string"
            ? req.body.statusCallbackUrl
            : null,
        from: fromNumber,
        customField,
      });
      const callSid = extractCallSid(response);
      logDebug("Lead call created in Exotel", {
        leadId: lead.id,
        followupId,
        callSid,
        exotelStatus: response.Call?.Status || null,
      });
      const callRow = await createLeadCall(client, {
        companyId: req.user!.companyId,
        leadId: lead.id,
        followupId,
        exotelCallSid: callSid,
        initiatedBy: req.user!.id,
        initiatedByName: req.user!.name ?? null,
        callerId: env.EXOTEL_CALLER_ID,
        fromNumber,
        toNumber,
        status: (response.Call?.Status as string) || "queued",
        statusCallbackUrl:
          typeof req.body?.statusCallbackUrl === "string"
            ? req.body.statusCallbackUrl
            : null,
        customField,
        rawPayload: response as Record<string, unknown>,
      });
      sendSuccess(
        res,
        { ...callRow, exotelResponse: response },
        { statusCode: 201, message: "Call initiated successfully" },
      );
    } finally {
      client.release();
    }
  } catch (error) {
    logError("Lead call initiation failed", {
      leadId: req.params.id,
      error: error instanceof Error ? error.message : error,
    });
    next(error);
  }
}

export async function updateLeadCallHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const lead = await findLeadById(
      req.params.id as string,
      req.user!.companyId,
    );
    if (!lead) {
      sendError(res, "Lead not found", {
        statusCode: 404,
        code: "LEAD_NOT_FOUND",
      });
      return;
    }

    const patch: Partial<{ notes: string | null; outcome: string | null }> = {};
    if (req.body && typeof req.body === "object") {
      if (Object.prototype.hasOwnProperty.call(req.body, "notes")) {
        patch.notes =
          typeof req.body.notes === "string" ? req.body.notes.trim() : null;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "outcome")) {
        patch.outcome =
          typeof req.body.outcome === "string" ? req.body.outcome.trim() : null;
      }
    }

    if (Object.keys(patch).length === 0) {
      sendError(res, "No updates provided", {
        statusCode: 400,
        code: "NO_UPDATES_PROVIDED",
      });
      return;
    }

    const updatedCall = await updateLeadCall(
      req.params.callId as string,
      lead.id,
      patch,
      req.user!.companyId,
    );
    if (!updatedCall) {
      sendError(res, "Call not found", {
        statusCode: 404,
        code: "CALL_NOT_FOUND",
      });
      return;
    }

    sendSuccess(res, updatedCall, { message: "Call updated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function listLeadCallsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const lead = await findLeadById(
      req.params.id as string,
      req.user!.companyId,
    );
    if (!lead) {
      sendError(res, "Lead not found", {
        statusCode: 404,
        code: "LEAD_NOT_FOUND",
      });
      return;
    }
    const calls = await listLeadCalls(lead.id, req.user!.companyId);
    sendSuccess(res, calls);
  } catch (error) {
    next(error);
  }
}

function deriveCallOutcome(payload: Record<string, unknown>): string | null {
  const status =
    typeof payload.Status === "string" ? payload.Status.toLowerCase() : "";

  const conversationDuration = Number(
    payload.ConversationDuration ?? payload.Duration ?? 0,
  );

  const legs = Array.isArray(payload.Legs)
    ? (payload.Legs as Array<Record<string, unknown>>)
    : [];

  const customerLeg = legs[1];

  const customerStatus =
    typeof customerLeg?.Status === "string"
      ? customerLeg.Status.toLowerCase()
      : "";

  const customerDuration = Number(
    customerLeg?.OnCallDuration ?? conversationDuration ?? 0,
  );

  // Customer actually talked
  if (customerDuration > 0) return "CONNECTED";

  // Customer busy
  if (customerStatus === "busy") return "BUSY";

  // Customer rejected / cancelled
  if (customerStatus === "canceled" || customerStatus === "cancelled")
    return "NO_ANSWER";

  // Overall failed
  if (status === "failed") return "FAILED";

  if (status === "busy") return "BUSY";

  if (status === "completed") return "CONNECTED";

  return null;
}

export async function exotelStatusCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const payload = (
      req.body && typeof req.body === "object" ? req.body : {}
    ) as Record<string, unknown>;
    const callSid = extractCallSid(payload);
    if (!callSid) {
      sendError(res, "Missing call SID", {
        statusCode: 400,
        code: "CALL_SID_MISSING",
      });
      return;
    }

    const call = await findLeadCallBySid(callSid);
    if (!call) {
      sendError(res, "Call not found", {
        statusCode: 404,
        code: "CALL_NOT_FOUND",
      });
      return;
    }

    const companyId = call.company_id ?? undefined;
    logDebug("Exotel status callback resolved call", {
      callSid,
      companyId,
    });

    const callPayload = getWebhookPayload(payload);
    const status =
      readStringValue(callPayload, ["Status", "status"]) || call.status;
    const answeredAt = readDateValue(callPayload, ["StartTime", "startTime"]);
    const endedAt = readDateValue(callPayload, ["EndTime", "endTime"]);
    const duration = readDurationSeconds(callPayload);
    const price = readStringValue(callPayload, ["Price", "price"]);
    const recordingUrl = readStringValue(callPayload, [
      "RecordingUrl",
      "recordingUrl",
    ]);
    const answeredBy = readStringValue(callPayload, [
      "AnsweredBy",
      "answeredBy",
    ]);

    const outcome = deriveCallOutcome(callPayload);

    const updatedCall = await updateLeadCallBySid(
      callSid,
      {
        status,
        answeredAt: answeredAt ?? undefined,
        endedAt: endedAt ?? undefined,
        duration:
          duration !== null && Number.isFinite(duration)
            ? Math.trunc(duration)
            : undefined,
        price: price ?? undefined,
        recordingUrl: recordingUrl ?? undefined,
        answeredBy: answeredBy ?? undefined,
        outcome: outcome ?? undefined,
      },
      payload,
    );

    if (updatedCall && shouldRetryCallDetailsRefresh(updatedCall)) {
      scheduleCallDetailsRefresh(callSid);
    }

    sendSuccess(res, { ok: true });
  } catch (error) {
    next(error);
  }
}
