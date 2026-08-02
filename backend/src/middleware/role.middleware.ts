import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

/**
 * RBAC guard factory.
 * Usage: requireRole('ADMIN')
 *
 * Must be placed AFTER the authenticate middleware so that req.user is populated.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', { statusCode: 401 });
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'You do not have permission to perform this action', {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
