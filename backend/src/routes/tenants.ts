import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { TenantProfile } from '../entities/profile/TenantProfile';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * POST /api/v1/tenants
 * Create a new tenant with full profile
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      idNumber,
      nationality,
      maritalStatus,
      numberOfChildren,
      occupation,
      postalAddress,
      nextOfKinName,
      nextOfKinPhone,
      nextOfKinRelationship,
      password,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !idNumber) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: ['firstName, lastName, phoneNumber, and idNumber are required'],
        },
      });
    }

    const userRepo = AppDataSource.getRepository(User);
    const tenantProfileRepo = AppDataSource.getRepository(TenantProfile);

    // Check if email already exists (if provided)
    if (email) {
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          error: {
            status: 400,
            message: 'Email already registered',
            code: 'EMAIL_EXISTS',
          },
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password || `tenant@${Date.now()}`, 10);

    // Create tenant user
    const user = userRepo.create({
      firstName,
      lastName,
      email: email || null,
      phoneNumber,
      idNumber,
      passwordHash,
      role: 'tenant',
      isActive: true,
    });

    await userRepo.save(user);

    // Create tenant profile
    const tenantProfile = tenantProfileRepo.create({
      userId: user.id,
      nationality: nationality || null,
      maritalStatus: maritalStatus || null,
      numberOfChildren: numberOfChildren || 0,
      occupation: occupation || null,
      postalAddress: postalAddress || null,
      nextOfKinName: nextOfKinName || null,
      nextOfKinPhone: nextOfKinPhone || null,
      nextOfKinRelationship: nextOfKinRelationship || null,
    });

    await tenantProfileRepo.save(tenantProfile);

    return res.status(201).json({
      message: 'Tenant created successfully',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        idNumber: user.idNumber,
        profile: {
          nationality: tenantProfile.nationality,
          maritalStatus: tenantProfile.maritalStatus,
          numberOfChildren: tenantProfile.numberOfChildren,
          occupation: tenantProfile.occupation,
          postalAddress: tenantProfile.postalAddress,
          nextOfKinName: tenantProfile.nextOfKinName,
          nextOfKinPhone: tenantProfile.nextOfKinPhone,
          nextOfKinRelationship: tenantProfile.nextOfKinRelationship,
        },
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating tenant:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'TENANT_CREATION_ERROR',
      },
    });
  }
});

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
