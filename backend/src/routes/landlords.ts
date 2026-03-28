import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, checkUserActive } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { LandlordProfile } from '../entities/profile/LandlordProfile';
import { Property } from '../entities/property/Property';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * POST /api/v1/landlords
 * Create a new landlord with profile
 */
router.post('/', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      idNumber,
      physicalAddress,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      companyName,
      taxId,
      defaultLateFeePercentage,
      password,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !idNumber || !physicalAddress) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [
            'firstName, lastName, phoneNumber, idNumber, and physicalAddress are required',
          ],
        },
      });
    }

    const userRepo = AppDataSource.getRepository(User);
    const landlordProfileRepo = AppDataSource.getRepository(LandlordProfile);

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
    const passwordHash = await bcrypt.hash(password || `landlord@${Date.now()}`, 10);

    // Create landlord user
    const user = userRepo.create({
      firstName,
      lastName,
      email: email || null,
      phoneNumber,
      idNumber,
      passwordHash,
      role: 'landlord',
      isActive: true,
    });

    await userRepo.save(user);

    // Create landlord profile
    const landlordProfile = landlordProfileRepo.create({
      userId: user.id,
      physicalAddress,
      bankName: bankName || null,
      bankAccountNumber: bankAccountNumber || null,
      bankAccountHolder: bankAccountHolder || null,
      companyName: companyName || null,
      taxId: taxId || null,
      defaultLateFeePercentage: defaultLateFeePercentage || 5.0,
    });

    await landlordProfileRepo.save(landlordProfile);

    return res.status(201).json({
      message: 'Landlord created successfully',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        idNumber: user.idNumber,
        profile: {
          physicalAddress: landlordProfile.physicalAddress,
          bankName: landlordProfile.bankName,
          bankAccountNumber: landlordProfile.bankAccountNumber,
          bankAccountHolder: landlordProfile.bankAccountHolder,
          companyName: landlordProfile.companyName,
          taxId: landlordProfile.taxId,
          defaultLateFeePercentage: landlordProfile.defaultLateFeePercentage,
        },
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating landlord:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'LANDLORD_CREATION_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/landlords
 * Get all landlords with property counts and total revenue
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const propertyRepo = AppDataSource.getRepository(Property);

    // Get all landlord users
    const landlords = await userRepo.find({
      where: { role: 'landlord' },
      relations: ['landlordProfile'],
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'isActive', 'createdAt'],
    });

    // Get properties data
    const properties = await propertyRepo.find({
      relations: ['landlord'],
    });

    // Calculate stats for each landlord
    const landlordData = landlords.map((landlord) => {
      const landlordProperties = properties.filter((p) => p.landlordId === landlord.id);
      const totalRevenue = landlordProperties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0);

      return {
        id: landlord.id,
        name: `${landlord.firstName} ${landlord.lastName}`,
        firstName: landlord.firstName,
        lastName: landlord.lastName,
        email: landlord.email,
        phoneNumber: landlord.phoneNumber,
        propertiesCount: landlordProperties.length,
        totalRevenue,
        status: landlord.isActive ? 'Active' : 'Inactive',
        createdAt: landlord.createdAt,
      };
    });

    return res.status(200).json({
      message: 'Landlords retrieved successfully',
      data: landlordData,
    });
  } catch (error: any) {
    console.error('❌ Error fetching landlords:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'LIST_LANDLORDS_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/landlords/:id
 * Get landlord details with properties
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const landlord = await userRepo.findOne({
      where: { id: req.params.id, role: 'landlord' },
      relations: ['landlordProfile'],
      select: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'idNumber', 'profilePictureUrl', 'createdAt'],
    });

    if (!landlord) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Landlord not found',
          code: 'LANDLORD_NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      message: 'Landlord retrieved successfully',
      data: landlord,
    });
  } catch (error: any) {
    console.error('❌ Error fetching landlord:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'GET_LANDLORD_ERROR',
      },
    });
  }
});

export default router;
