import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { TenantProfile } from '../entities/profile/TenantProfile';
import bcrypt from 'bcrypt';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  DatabaseError,
} from '../errors/AppError';

const router = Router();

/**
 * POST /api/v1/tenants
 * Create a new tenant with full profile
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Creating new tenant');

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

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
      console.warn('❌ Missing required tenant fields:', { firstName, lastName, phoneNumber, idNumber });
      throw new ValidationError('firstName, lastName, phoneNumber, and idNumber are required', {
        received: { firstName, lastName, phoneNumber, idNumber },
      });
    }

    const userRepo = AppDataSource.getRepository(User);
    const tenantProfileRepo = AppDataSource.getRepository(TenantProfile);

    // Check if email already exists (if provided)
    if (email) {
      try {
        console.log('🔍 Checking if email exists:', email);
        const existingUser = await userRepo.findOne({ where: { email } });
        if (existingUser) {
          console.warn('❌ Email already registered:', email);
          throw new ConflictError('Email already registered', { email });
        }
      } catch (err: any) {
        if (err instanceof ConflictError) throw err;
        console.error('❌ Error checking email:', err.message);
        throw new DatabaseError(err.message, 'check_email_existence');
      }
    }

    // Hash password
    try {
      console.log('🔐 Hashing password...');
      const passwordHash = await bcrypt.hash(password || `tenant@${Date.now()}`, 10);

      // Create tenant user
      console.log('👤 Creating tenant user:', { firstName, lastName, email, phoneNumber });
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
      console.log('✅ Tenant user created:', user.id);

      // Create tenant profile
      console.log('📝 Creating tenant profile...');
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
      console.log('✅ Tenant profile created');

      return res.status(201).json({
        success: true,
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
    } catch (err: any) {
      console.error('❌ Error in tenant creation:', err.message);
      throw new DatabaseError(err.message, 'tenant_creation');
    }
  } catch (error: any) {
    console.error('❌ Tenant creation error:', error.message);
    throw error;
  }
});

/**
 * GET /api/v1/tenants
 * Get all tenants
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching all tenants');

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

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

      console.log('✅ Tenants retrieved:', tenantData.length);
      return res.status(200).json({
        success: true,
        message: 'Tenants retrieved successfully',
        data: tenantData,
      });
    } catch (err: any) {
      console.error('❌ Error fetching tenants:', err.message);
      throw new DatabaseError(err.message, 'list_tenants');
    }
  } catch (error: any) {
    console.error('❌ Fetch tenants error:', error.message);
    throw error;
  }
});

/**
 * GET /api/v1/tenants/:id
 * Get tenant details
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching tenant:', req.params.id);

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const userRepo = AppDataSource.getRepository(User);
      const tenant = await userRepo.findOne({
        where: { id: req.params.id, role: 'tenant' },
        relations: ['tenantProfile'],
        select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'idNumber', 'profilePictureUrl', 'createdAt'],
      });

      if (!tenant) {
        console.warn('❌ Tenant not found:', req.params.id);
        throw new NotFoundError('Tenant', { tenantId: req.params.id });
      }

      console.log('✅ Tenant retrieved:', tenant.id);
      return res.status(200).json({
        success: true,
        message: 'Tenant retrieved successfully',
        data: tenant,
      });
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      console.error('❌ Error fetching tenant:', err.message);
      throw new DatabaseError(err.message, 'fetch_tenant');
    }
  } catch (error: any) {
    console.error('❌ Fetch tenant error:', error.message);
    throw error;
  }
});

export default router;
