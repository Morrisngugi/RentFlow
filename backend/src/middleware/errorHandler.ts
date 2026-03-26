import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  details?: any;
}

interface AppErrorInterface extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

/**
 * Global error handler middleware
 * Must be the last middleware in the app
 */
export function errorHandler(
  error: CustomError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Extract request ID if available
  const requestId = (req as any).id || 'unknown';

  // Determine if this is an AppError or generic error
  const isAppError = error instanceof AppError;
  const statusCode = isAppError
    ? (error as unknown as AppErrorInterface).statusCode
    : (error as CustomError).status || (error as CustomError).statusCode || 500;
  const code = isAppError
    ? (error as unknown as AppErrorInterface).code
    : (error as CustomError).code || 'INTERNAL_ERROR';
  const details = isAppError ? (error as unknown as AppErrorInterface).details : undefined;

  // Log error with context
  console.error('❌ [ERROR HANDLER]', {
    requestId,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode,
    code,
    message: error.message,
    details,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      status: statusCode,
      code,
      message: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    },
  };

  // Add details if present (for development)
  if (details) {
    errorResponse.error.details = details;
  }

  // Add request ID for tracking
  if (requestId !== 'unknown') {
    errorResponse.requestId = requestId;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
}

export default errorHandler;
