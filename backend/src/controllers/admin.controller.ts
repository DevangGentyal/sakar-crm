import { Request, Response, NextFunction } from "express";
import {
  approveExecutive,
  listExecutives,
  rejectExecutive,
  setExecutiveActive,
} from "../services/admin.service";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { validateRequest } from "../middleware/error.middleware";

export async function listExecutivesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const {
      status,
      page = "1",
      limit = "50",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;
    const result = await listExecutives(
      status ? (String(status) as any) : undefined,
      Number(page),
      Number(limit),
      String(sortBy) as any,
      String(sortOrder) as any,
      req.user?.companyId,
    );

    sendSuccess(res, result, { message: "Executives retrieved successfully" });
  } catch (err) {
    next(err);
  }
}

export async function approveExecutiveHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const executiveId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const adminId = Array.isArray(req.user?.id)
      ? req.user.id[0]
      : (req.user?.id ?? "");
    const executive = await approveExecutive(executiveId, adminId, req.user?.companyId);
    if (!executive) {
      sendError(res, "Executive not found", {
        statusCode: 404,
        code: "EXECUTIVE_NOT_FOUND",
      });
      return;
    }

    sendSuccess(res, executive, { message: "Executive approved successfully" });
  } catch (err) {
    next(err);
  }
}

export async function rejectExecutiveHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const executiveId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const adminId = Array.isArray(req.user?.id)
      ? req.user.id[0]
      : (req.user?.id ?? "");
    const reason = req.body.reason ? String(req.body.reason).trim() : "";
    const executive = await rejectExecutive(executiveId, adminId, reason, req.user?.companyId);
    if (!executive) {
      sendError(res, "Executive not found", {
        statusCode: 404,
        code: "EXECUTIVE_NOT_FOUND",
      });
      return;
    }

    sendSuccess(res, executive, { message: "Executive rejected successfully" });
  } catch (err) {
    next(err);
  }
}

export async function enableExecutiveHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const executiveId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const executive = await setExecutiveActive(executiveId, true, req.user?.companyId);
    if (!executive) {
      sendError(res, "Executive not found or not approved", {
        statusCode: 404,
        code: "EXECUTIVE_NOT_FOUND",
      });
      return;
    }

    sendSuccess(res, executive, { message: "Executive enabled successfully" });
  } catch (err) {
    next(err);
  }
}

export async function disableExecutiveHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const executiveId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const executive = await setExecutiveActive(executiveId, false, req.user?.companyId);
    if (!executive) {
      sendError(res, "Executive not found or not approved", {
        statusCode: 404,
        code: "EXECUTIVE_NOT_FOUND",
      });
      return;
    }

    sendSuccess(res, executive, { message: "Executive disabled successfully" });
  } catch (err) {
    next(err);
  }
}
