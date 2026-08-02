import morgan from 'morgan';
import { env } from '../config/env';

/**
 * HTTP request logger.
 * - Development: colorized 'dev' format
 * - Production:  machine-readable 'combined' format
 */
export const httpLogger = env.isProduction
  ? morgan('combined')
  : morgan('dev');

type LogContext = Record<string, unknown>;

function write(level: string, message: string, context?: LogContext): void {
  const suffix = context ? ` ${JSON.stringify(context, (_key, value) => value instanceof Error ? {
    name: value.name,
    message: value.message,
    stack: value.stack,
  } : value)}` : '';
  console.error(`[${level}] ${message}${suffix}`);
}

export function logInfo(message: string, context?: LogContext): void {
  write('INFO', message, context);
}

export function logDebug(message: string, context?: LogContext): void {
  if (env.isDevelopment) write('DEBUG', message, context);
}

export function logError(message: string, context?: LogContext): void {
  write('ERROR', message, context);
}
