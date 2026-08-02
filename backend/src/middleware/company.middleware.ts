import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse";

export function requireCompany(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user?.companyId) {
    sendError(res, "Company context is required", {
      statusCode: 403,
      code: "COMPANY_REQUIRED",
    });
    return;
  }

  next();
}
