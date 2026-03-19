import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { TenantProfile } from '../entities/profile/TenantProfile';

const router = Router();

/**
 * GET /api/v1/tenants
 * Get all tenants
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);

    // Get all tenant users
    const tenants = await userRepo.find({
      where: { role: 'tenant' },
      relations: ['tenantProfile'],
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    const tenantData = tenants.map((tenant) => ({
      id: tenant.id,
      name: `${tenant.firstName} ${tenant.lastName}`,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      initials: `${tenant.firstName[0]}${tenant.lastName[0]}`.toUpperCase(),
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      status: tenant.isActive ? 'Active' : 'Inactive',
      createdAt: tenant.createdAt,
    }));

    return res.status(200).json({
      message: 'Tenants retrieved successfully',
      data: tenantData,
    });
  } catch (error: any) {
    console.error('❌ Error fetching tenants:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'LIST_TENANTS_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/tenants/:id
 * Get tenant details
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const tenant = await userRepo.findOne({
      where: { id: req.params.id, role: 'tenant' },
      relations: ['tenantProfile'],
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'idNumber', 'profilePictureUrl', 'createdAt'],
    });

    if (!tenant) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Tenant not found',
          code: 'TENANT_NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      message: 'Tenant retrieved successfully',
      data: tenant,
    });
  } catch (error: any) {
    console.error('❌ Error fetching tenant:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'GET_TENANT_ERROR',
      },
    });
  }
});

export default router;
