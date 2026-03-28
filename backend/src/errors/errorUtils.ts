import { Response } from 'express';
import { AppError, ValidationError, DatabaseError } from './AppError';

/**
 * Utility functions for error handling
 */

/**
 * Send a standardized error response
 */
export function sendErrorResponse(
  res: Response,
  error: AppError | Error,
  requestId?: string
) {
  const appError = error instanceof AppError
    ? error
    : new AppError(
        error.message || 'Internal Server Error',
        500,
        'INTERNAL_ERROR',
        { originalError: error.constructor.name }
      );

  const response: any = {
    success: false,
    error: {
      status: appError.statusCode,
      code: appError.code,
      message: appError.message,
    },
  };

  if (appError.details) {
    response.error.details = appError.details;
  }

  if (requestId) {
    response.requestId = requestId;
  }

  response.timestamp = new Date().toISOString();

  res.status(appError.statusCode).json(response);
}

/**
 * Wrap database operations with error handling
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`❌ Database operation failed: ${operationName}`, {
      error: error.message,
      code: error.code,
      detail: error.detail,
    });

    // Common database errors
    if (error.code === '23505') { // Unique constraint violation
      throw new ConflictError(
        'A record with this value already exists',
        { constraint: error.constraint, field: error.column }
      );
    }

    if (error.code === '23503') { // Foreign key violation
      throw new ValidationError(
        'Cannot delete or create this record due to related data',
        { constraint: error.constraint }
      );
    }

    throw new DatabaseError(
      error.message,
      operationName,
      { code: error.code, detail: error.detail }
    );
  }
}

/**
 * Validate request body and return errors or throw ValidationError
 */
export function validateRequestBody(
  body: any,
  requiredFields: string[],
  fieldTypes?: Record<string, string>
): string[] {
  const errors: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!body[field]) {
      errors.push(`${field} is required`);
    }
  }

  // Check field types if provided
  if (fieldTypes) {
    for (const [field, expectedType] of Object.entries(fieldTypes)) {
      if (body[field] !== undefined && typeof body[field] !== expectedType) {
        errors.push(`${field} must be of type ${expectedType}`);
      }
    }
  }

  return errors;
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback?: T): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ JSON parse error:', error instanceof Error ? error.message : 'Unknown error');
    return fallback || null;
  }
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: any, next: any) => Promise<any>
) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Import the ConflictError class that's used in this file
import { ConflictError } from './AppError';
