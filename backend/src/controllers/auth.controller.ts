import { Request, Response, NextFunction } from "express";
import { validateRequest } from "../middleware/error.middleware";
import {
  register,
  login,
  changePassword,
  DuplicateEmailError,
  DuplicateMobileError,
  InvalidCredentialsError,
  AccountDisabledError,
  InvalidRegistrationPasswordError,
  InvalidCompanyCodeError,
  CompanyInactiveError,
  PasswordChangeRequiredError,
  AccountPendingApprovalError,
  AccountRejectedError,
} from "../services/auth.service";
import { listUsers } from "../repositories/auth.repository";
import { sendSuccess, sendError } from "../utils/apiResponse";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const {
      name,
      email,
      password,
      mobileNumber,
      registrationPassword,
      companyCode,
    } = req.body as {
      name: string;
      email: string;
      password: string;
      mobileNumber: string;
      registrationPassword: string;
      companyCode: string;
    };

    const result = await register({
      name,
      email,
      password,
      mobileNumber,
      registrationPassword,
      companyCode,
      role: "EXECUTIVE",
    });

    sendSuccess(res, result, {
      statusCode: 201,
      message: result.message,
    });
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      sendError(res, err.message, { statusCode: 409, code: "DUPLICATE_EMAIL" });
      return;
    }
    if (err instanceof DuplicateMobileError) {
      sendError(res, err.message, {
        statusCode: 409,
        code: "DUPLICATE_MOBILE",
      });
      return;
    }
    if (err instanceof InvalidRegistrationPasswordError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "INVALID_REGISTRATION_PASSWORD",
      });
      return;
    }
    if (err instanceof InvalidCompanyCodeError) {
      sendError(res, err.message, {
        statusCode: 404,
        code: "INVALID_COMPANY_CODE",
      });
      return;
    }
    if (err instanceof CompanyInactiveError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "COMPANY_INACTIVE",
      });
      return;
    }
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await login({ email, password });

    sendSuccess(res, result, { message: "Login successful" });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      sendError(res, err.message, {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
      });
      return;
    }
    if (err instanceof AccountDisabledError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "ACCOUNT_DISABLED",
      });
      return;
    }
    if (err instanceof PasswordChangeRequiredError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "PASSWORD_CHANGE_REQUIRED",
      });
      return;
    }
    if (err instanceof AccountPendingApprovalError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "ACCOUNT_PENDING_APPROVAL",
      });
      return;
    }
    if (err instanceof AccountRejectedError) {
      sendError(res, err.message, {
        statusCode: 403,
        code: "ACCOUNT_REJECTED",
      });
      return;
    }
    next(err);
  }
}

export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, req.user);
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!validateRequest(req, res)) return;

  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    await changePassword(
      req.user!.id,
      req.user!.companyId,
      currentPassword,
      newPassword,
    );
    sendSuccess(res, null, { message: "Password changed successfully" });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      sendError(res, err.message, {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
      });
      return;
    }
    next(err);
  }
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await listUsers(req.user?.companyId);
    sendSuccess(res, users);
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  // JWT is stateless; client-side token removal is the primary mechanism.
  // This endpoint exists for clients to signal logout intent and clear HttpOnly cookies if used in future.
  sendSuccess(res, null, { message: "Logged out successfully" });
}
