import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { findUserById, findUserByIdAndCompany } from "../repositories/auth.repository";
import { sendError } from "../utils/apiResponse";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        companyId: string;
        name: string;
        email: string;
        mobile_number: string | null;
        role: string;
        is_active: boolean;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    sendError(res, "Authentication required", {
      statusCode: 401,
      code: "MISSING_TOKEN",
    });
    return;
  }

  const token = authHeader.slice(7);

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    sendError(res, "Invalid or expired token", {
      statusCode: 401,
      code: "INVALID_TOKEN",
    });
    return;
  }

  const user = payload.companyId
    ? await findUserByIdAndCompany(payload.userId, payload.companyId)
    : await findUserById(payload.userId);
  if (!user) {
    sendError(res, "User not found", {
      statusCode: 401,
      code: "USER_NOT_FOUND",
    });
    return;
  }

  if (user.role === "EXECUTIVE") {
    if (user.approval_status === "PENDING") {
      sendError(res, "Your account is awaiting administrator approval.", {
        statusCode: 403,
        code: "ACCOUNT_PENDING_APPROVAL",
      });
      return;
    }
    if (user.approval_status === "REJECTED") {
      sendError(res, "Your registration request has been rejected.", {
        statusCode: 403,
        code: "ACCOUNT_REJECTED",
      });
      return;
    }
  }

  if (!user.is_active) {
    sendError(res, "Account is disabled", {
      statusCode: 403,
      code: "ACCOUNT_DISABLED",
    });
    return;
  }

  req.user = {
    id: user.id,
    companyId:
      payload.companyId || (user as { company_id?: string | null }).company_id || "",
    name: user.name,
    email: user.email,
    mobile_number: user.mobile_number,
    role: user.role,
    is_active: user.is_active,
  };

  next();
}
