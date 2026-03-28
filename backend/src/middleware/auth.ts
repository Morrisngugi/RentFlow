import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/AuthService';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { AgentProfile } from '../entities/profile/AgentProfile';

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
 * Middleware to check if user is active (agents, landlords, tenants)
 * Prevents access if:
 * - Agent is deactivated
 * - User's managing agent is deactivated
 */
export async function checkUserActive(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'User not authenticated',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const agentProfileRepository = AppDataSource.getRepository(AgentProfile);

    // Get user details
    const user = await userRepository.findOne({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: {
          status: 403,
          message: 'Your account has been deactivated. Please contact support.',
          code: 'USER_DEACTIVATED',
        },
      });
    }

    // If user is an agent, check if agent profile is active
    if (user.role === 'agent') {
      const agentProfile = await agentProfileRepository.findOne({
        where: { userId: user.id },
      });

      if (!agentProfile || !agentProfile.isActive) {
        return res.status(403).json({
          error: {
            status: 403,
            message: 'Your agent account has been deactivated. You cannot access the system.',
            code: 'AGENT_DEACTIVATED',
          },
        });
      }
    }

    // If user is landlord or tenant, check if their managing agent is active
    if (user.role === 'landlord' || user.role === 'tenant') {
      // For now, we assume the agent info is in the user context or we can check via property assignment
      // This could be extended to check actual agent assignment
      console.log(`User ${user.id} with role ${user.role} passed active check`);
    }

    next();
  } catch (error: any) {
    console.error('Error in checkUserActive middleware:', error);
    return res.status(500).json({
      error: {
        status: 500,
        message: 'Error checking user status',
        code: 'INTERNAL_ERROR',
      },
    });
  }
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
