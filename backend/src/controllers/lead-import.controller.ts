import { Request, Response, NextFunction } from "express";
import { importLeads } from "../services/lead-import.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

export async function importLeadsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "An .xlsx or .xls file is required", {
        statusCode: 422,
        code: "FILE_REQUIRED",
      });
      return;
    }
    const result = await importLeads(
      req.file.buffer,
      req.user!.id,
      req.user!.companyId,
    );
    sendSuccess(res, result, { message: "Lead import completed" });
  } catch (error) {
    if (
      error instanceof Error &&
      /mandatory columns|worksheet/.test(error.message)
    ) {
      sendError(res, error.message, {
        statusCode: 422,
        code: "INVALID_IMPORT_FILE",
      });
      return;
    }
    next(error);
  }
}
