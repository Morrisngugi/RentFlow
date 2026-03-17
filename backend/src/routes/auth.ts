import { Router, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { authService } from '../services/AuthService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth.dto';

const router = Router();

/**
 * Validation helper
 */
async function validateRequest(data: any, dtoClass: any) {
  const instance = plainToInstance(dtoClass, data);
  return validate(instance);
}

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = await validateRequest(req.body, RegisterRequest);
    if (errors.length > 0) {
      const messages = errors
        .flatMap((err) => Object.values(err.constraints || {}));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const { email, phoneNumber, firstName, lastName, idNumber, password, role } = req.body;
    const result = await authService.register({
      email,
      phoneNumber,
      firstName,
      lastName,
      idNumber,
      password,
      role: role || 'tenant',
    });

    return res.status(201).json({
      message: 'User registered successfully',
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already') ? 400 : 500;
    return res.status(statusCode).json({
      error: {
        status: statusCode,
        message: error.message,
        code: 'REGISTRATION_ERROR',
      },
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = await validateRequest(req.body, LoginRequest);
    if (errors.length > 0) {
      const messages = errors
        .flatMap((err) => Object.values(err.constraints || {}));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    return res.status(200).json({
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    return res.status(401).json({
      error: {
        status: 401,
        message: error.message,
        code: 'LOGIN_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/auth/profile
 * Get authenticated user's profile
 */
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        idNumber: user.idNumber,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'PROFILE_FETCH_ERROR',
      },
    });
  }
});

/**
 * PUT /api/v1/auth/profile
 * Update authenticated user's profile
 */
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const errors = await validateRequest(req.body, UpdateProfileRequest);
    if (errors.length > 0) {
      const messages = errors
        .flatMap((err) => Object.values(err.constraints || {}));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const updatedUser = await authService.updateProfile(req.user.userId, req.body);

    return res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        idNumber: updatedUser.idNumber,
        profilePictureUrl: updatedUser.profilePictureUrl,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'PROFILE_UPDATE_ERROR',
      },
    });
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const errors = await validateRequest(req.body, ChangePasswordRequest);
    if (errors.length > 0) {
      const messages = errors
        .flatMap((err) => Object.values(err.constraints || {}));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    return res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    const statusCode = error.message.includes('incorrect') ? 400 : 500;
    return res.status(statusCode).json({
      error: {
        status: statusCode,
        message: error.message,
        code: 'PASSWORD_CHANGE_ERROR',
      },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (mainly for frontend session management)
 */
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  // Since we use stateless JWT, logout just signals frontend to clear token
  return res.status(200).json({
    message: 'Logged out successfully. Please clear your token from client storage.',
  });
});

export default router;
