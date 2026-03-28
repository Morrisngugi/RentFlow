/**
 * Custom Error Classes for consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation Error - for input validation failures
 * HTTP Status: 400
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error - for auth failures (missing token, invalid token)
 * HTTP Status: 401
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization Error - for insufficient permissions
 * HTTP Status: 403
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error - for missing resources
 * HTTP Status: 404
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: any) {
    super(`${resource} not found`, 404, `${resource.toUpperCase()}_NOT_FOUND`, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error - for duplicate resources or business logic conflicts
 * HTTP Status: 409
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Database Error - for database operation failures
 * HTTP Status: 500
 */
export class DatabaseError extends AppError {
  constructor(message: string, operation: string, details?: any) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      { operation, ...details }
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Business Logic Error - for application business rule violations
 * HTTP Status: 422
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR', details);
    Object.setPrototypeOf(this, BusinessLogicError.prototype);
  }
}

/**
 * External Service Error - for third-party service failures
 * HTTP Status: 502
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(
      `${service} service error: ${message}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      { service, ...details }
    );
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}
