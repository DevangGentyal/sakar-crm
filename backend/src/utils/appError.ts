export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "FILE_TYPE_NOT_ALLOWED"
  | "STORAGE_ERROR"
  | "DATABASE_ERROR"
  | "NO_LEAD_CHANGES"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly expose: boolean;
  readonly details?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code?: AppErrorCode;
      expose?: boolean;
      details?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.expose = options.expose ?? this.statusCode < 500;
    this.details = options.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
