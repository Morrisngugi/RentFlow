import { Router, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { authService } from '../services/AuthService';
import { authenticate, AuthenticatedRequest, checkUserActive } from '../middleware/auth';
import {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types/auth.dto';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from '../errors/AppError';

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
    console.log('📋 Register request received for:', req.body.email);
    
    const errors = await validateRequest(req.body, RegisterRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Validation errors:', messages);
      throw new ValidationError('Registration validation failed', { messages });
    }

    const { email, phoneNumber, firstName, lastName, idNumber, password, role } = req.body;
    
    console.log('🔐 Processing registration for:', email);
    const result = await authService.register({
      email,
      phoneNumber,
      firstName,
      lastName,
      idNumber,
      password,
      role: role || 'tenant',
    });

    console.log('✅ User registered successfully:', email);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Registration error:', {
      email: req.body?.email,
      error: error.message,
      code: error.code,
    });

    if (error.message.includes('already')) {
      return res.status(409).json({
        success: false,
        error: {
          status: 409,
          code: 'EMAIL_CONFLICT',
          message: 'Email is already registered',
          details: { email: req.body?.email },
        },
      });
    }

    // Let error handler middleware handle it
    throw error;
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Login request for:', req.body.email);
    
    const errors = await validateRequest(req.body, LoginRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Login validation errors:', messages);
      throw new ValidationError('Login validation failed', { messages });
    }

    const { email, password } = req.body;
    
    console.log('🔍 Authenticating user:', email);
    const result = await authService.login(email, password);

    console.log('✅ Login successful:', email);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Login error:', {
      email: req.body?.email,
      error: error.message,
    });

    if (error.message.includes('not found') || error.message.includes('incorrect')) {
      throw new AuthenticationError('Invalid email or password');
    }

    throw error;
  }
});

/**
 * GET /api/v1/auth/profile
 * Get authenticated user's profile
 */
router.get('/profile', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching profile for user:', req.user?.userId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User', { userId: req.user.userId });
    }

    console.log('✅ Profile retrieved for:', user.email);
    return res.status(200).json({
      success: true,
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
    console.error('❌ Profile fetch error:', {
      userId: req.user?.userId,
      error: error.message,
    });
    throw error;
  }
});

/**
 * PUT /api/v1/auth/profile
 * Update authenticated user's profile
 */
router.put('/profile', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Updating profile for user:', req.user?.userId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const errors = await validateRequest(req.body, UpdateProfileRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Profile update validation errors:', messages);
      throw new ValidationError('Profile update validation failed', { messages });
    }

    console.log('✏️ Saving profile changes for:', req.user.userId);
    const updatedUser = await authService.updateProfile(req.user.userId, req.body);

    console.log('✅ Profile updated for:', updatedUser.email);
    return res.status(200).json({
      success: true,
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
    console.error('❌ Profile update error:', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
});

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Change password request for:', req.user?.userId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const errors = await validateRequest(req.body, ChangePasswordRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Password change validation errors:', messages);
      throw new ValidationError('Password change validation failed', { messages });
    }

    const { oldPassword, newPassword } = req.body;
    
    console.log('🔐 Verifying old password for:', req.user.userId);
    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    console.log('✅ Password changed for:', req.user.userId);
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('❌ Password change error:', {
      userId: req.user?.userId,
      error: error.message,
    });

    if (error.message.includes('incorrect')) {
      throw new ValidationError('Current password is incorrect');
    }

    throw error;
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (mainly for frontend session management)
 */
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('👤 User logged out:', req.user?.userId);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Please clear your token from client storage.',
    });
  } catch (error: any) {
    console.error('❌ Logout error:', error.message);
    throw error;
  }
});

export default router;
