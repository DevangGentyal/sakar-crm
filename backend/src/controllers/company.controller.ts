import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../middleware/error.middleware";
import {
  activateCompany,
  createCompanyWithAdminAccount,
  deactivateCompany,
  getCompanies,
  getPublicCompanies,
  resetCompanyAdminPassword,
  updateCompanyRegistrationPassword,
} from "../services/company.service";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { verifyToken } from "../utils/jwt";

export async function listCompaniesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let isSuperAdmin = false;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const payload = verifyToken(authHeader.slice(7));
        isSuperAdmin = payload.role === "SUPER_ADMIN";
      } catch {
        isSuperAdmin = false;
      }
    }

    const companies = isSuperAdmin
      ? await getCompanies()
      : await getPublicCompanies();
    sendSuccess(res, companies);
  } catch (error) {
    next(error);
  }
}

export async function createCompanyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;
  try {
    const body = req.body as {
      companyName: string;
      companyCode: string;
      companyType: string;
      email: string;
      mobile?: string;
      address?: string;
      logoUrl?: string;
      theme?: Record<string, unknown>;
      adminName: string;
      adminEmail: string;
      adminMobile?: string;
      adminPassword: string;
      executiveRegistrationPassword?: string;
    };

    const result = await createCompanyWithAdminAccount(body);
    sendSuccess(res, result, {
      statusCode: 201,
      message: "Company created successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function activateCompanyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const company = await activateCompany(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    if (!company) {
      sendError(res, "Company not found", {
        statusCode: 404,
        code: "COMPANY_NOT_FOUND",
      });
      return;
    }
    sendSuccess(res, company, { message: "Company activated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function deactivateCompanyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const company = await deactivateCompany(
      Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
    );
    if (!company) {
      sendError(res, "Company not found", {
        statusCode: 404,
        code: "COMPANY_NOT_FOUND",
      });
      return;
    }
    sendSuccess(res, company, { message: "Company deactivated successfully" });
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyRegistrationPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      sendError(res, "Company context is required", {
        statusCode: 403,
        code: "COMPANY_REQUIRED",
      });
      return;
    }
    const { registrationPassword } = req.body as {
      registrationPassword: string;
    };
    const company = await updateCompanyRegistrationPassword(
      companyId,
      registrationPassword,
    );
    if (!company) {
      sendError(res, "Company not found", {
        statusCode: 404,
        code: "COMPANY_NOT_FOUND",
      });
      return;
    }
    sendSuccess(res, company, {
      message: "Executive registration password updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetCompanyAdminPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await resetCompanyAdminPassword(companyId);
    sendSuccess(res, result, {
      message: "Company admin password reset successfully",
    });
  } catch (error) {
    next(error);
  }
}
