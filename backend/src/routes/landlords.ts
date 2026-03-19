import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { LandlordProfile } from '../entities/profile/LandlordProfile';
import { Property } from '../entities/property/Property';

const router = Router();

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
