import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  code?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { statusCode?: number; message?: string; meta?: Record<string, unknown> } = {}
): Response {
  const { statusCode = 200, message, meta } = options;
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  options: { statusCode?: number; errors?: unknown; code?: string } = {}
): Response {
  const { statusCode = 500, errors, code } = options;
  const body: ApiErrorResponse = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  if (code) body.code = code;
  return res.status(statusCode).json(body);
}
