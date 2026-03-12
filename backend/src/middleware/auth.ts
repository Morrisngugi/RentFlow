import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/AuthService';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get token from Authorization header
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'No authorization token provided',
          code: 'MISSING_TOKEN',
        },
      });
    }

    // Extract token from "Bearer <token>"
    const token = bearerToken.startsWith('Bearer ')
      ? bearerToken.slice(7)
      : bearerToken;

    // Verify token
    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error: any) {
    return res.status(401).json({
      error: {
        status: 401,
        message: error.message || 'Invalid token',
        code: 'INVALID_TOKEN',
      },
    });
  }
}

/**
 * Optional middleware - doesn't fail if token is missing
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
      const token = bearerToken.startsWith('Bearer ')
        ? bearerToken.slice(7)
        : bearerToken;
      req.user = authService.verifyToken(token);
    }
  } catch (error) {
    // Silently fail - user will be undefined
  }
  next();
}

/**
 * Validate request body against a DTO class
 */
export function validateDTO(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { validate } = await import('class-validator');
      const { plainToInstance } = await import('class-transformer');

      const instance = plainToInstance(dtoClass, req.body);
      const errors = await validate(instance);

      if (errors.length > 0) {
        const messages = errors
          .map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          }))
          .flat();

        return res.status(400).json({
          error: {
            status: 400,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: messages,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
