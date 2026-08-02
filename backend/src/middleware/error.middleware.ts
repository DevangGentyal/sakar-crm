import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { logError } from '../utils/logger';
import multer from 'multer';
import { AppError, isAppError } from '../utils/appError';

// ─── Validation Result Extractor ─────────────────────────────────────────────
/**
 * Call this at the top of any controller handler to extract express-validator
 * errors and return a 422 immediately if any exist.
 */
export function validateRequest(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, 'Validation failed', {
      statusCode: 422,
      errors: errors.array(),
      code: 'VALIDATION_ERROR',
    });
    return false;
  }
  return true;
}

// ─── Centralized Error Handler ────────────────────────────────────────────────
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (isAppError(err)) {
    logError('Handled app error', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    });
    sendError(res, err.expose ? err.message : 'Internal server error', {
      statusCode: err.statusCode,
      code: err.code,
      errors: err.details,
    });
    return;
  }

  if (err instanceof Error && err.name === "NoLeadChangesError") {
    sendError(res, err.message, {
      statusCode: 400,
      code: "BAD_REQUEST",
    });
    return;
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    sendError(res, 'Token has expired', { statusCode: 401, code: 'TOKEN_EXPIRED' });
    return;
  }
  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid token', { statusCode: 401, code: 'INVALID_TOKEN' });
    return;
  }

  // pg unique violation (duplicate mobile/email if unique constraint is hit at DB level)
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const pgErr = err as { code: string; message: string; detail?: string; constraint?: string; table?: string; column?: string };
    logError('PostgreSQL request error', {
      code: pgErr.code,
      message: pgErr.message,
      detail: pgErr.detail,
      constraint: pgErr.constraint,
      table: pgErr.table,
      column: pgErr.column,
    });
    if (pgErr.code === '23505') {
      sendError(res, 'Duplicate entry — a record with this value already exists', {
        statusCode: 409,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }
    if (pgErr.code === '23503') {
      sendError(res, 'Referenced record does not exist', {
        statusCode: 422,
        code: 'FOREIGN_KEY_VIOLATION',
      });
      return;
    }
  }

  if (err instanceof multer.MulterError) {
    const messageByCode: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum size is 5 MB.',
      LIMIT_FILE_COUNT: 'Too many files were uploaded.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload request.',
    };
    const message = messageByCode[err.code] ?? err.message;
    logError('Multer upload error', { code: err.code, message });
    sendError(res, message, {
      statusCode: err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      code: err.code === 'LIMIT_FILE_SIZE' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
    });
    return;
  }

  // Generic Error
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred';

  const stack = err instanceof Error ? err.stack : undefined;

  logError('Unhandled request error', { message, stack });

  sendError(res, env.isProduction ? 'Internal server error' : message, {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
  });
}

// ─── 404 Handler ─────────────────────────────────────────────────────────────
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, {
    statusCode: 404,
    code: 'NOT_FOUND',
  });
}
