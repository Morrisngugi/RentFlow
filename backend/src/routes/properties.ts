import { Router, Request, Response } from 'express';
import { In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { CreatePropertyRequest, UpdatePropertyRequest } from '../types/property.dto';
import { AppDataSource } from '../config/database';
import { Property } from '../entities/property/Property';
import { PropertyFloor } from '../entities/property/PropertyFloor';
import { PropertyUnit } from '../entities/property/PropertyUnit';
import { PropertyRoomTypePricing } from '../entities/property/PropertyRoomTypePricing';
import { User } from '../entities/User';
import { LandlordProfile } from '../entities/profile/LandlordProfile';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * Validation helper
 */
async function validateRequest(data: any, dtoClass: any) {
  const instance = plainToInstance(dtoClass, data);
  return validate(instance);
}

/**
 * POST /api/v1/properties
 * Create a new property with floors, units, and landlord
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const errors = await validateRequest(req.body, CreatePropertyRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.error('❌ Property creation validation failed:', {
        userId: req.user?.userId,
        errors: messages,
      });
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const propertyRepo = AppDataSource.getRepository(Property);
    const userRepo = AppDataSource.getRepository(User);
    const floorRepo = AppDataSource.getRepository(PropertyFloor);
    const unitRepo = AppDataSource.getRepository(PropertyUnit);
    const landlordProfileRepo = AppDataSource.getRepository(LandlordProfile);
    const roomTypePricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);

    // Check if landlord with email already exists
    let landlord = await userRepo.findOne({ where: { email: req.body.landlordEmail } });

    if (!landlord) {
      // Create new landlord user
      const hashedPassword = await bcrypt.hash(req.body.landlordPassword, 10);
      landlord = userRepo.create({
        email: req.body.landlordEmail,
        firstName: req.body.landlordFirstName,
        lastName: req.body.landlordLastName,
        phoneNumber: req.body.landlordPhone,
        idNumber: req.body.landlordIdNumber,
        passwordHash: hashedPassword,
        role: 'landlord',
        isActive: true,
      });
      await userRepo.save(landlord);

      // Create landlord profile
      const landlordProfile = landlordProfileRepo.create({
        userId: landlord.id,
        physicalAddress: req.body.address || '',
      });
      await landlordProfileRepo.save(landlordProfile);

      console.log('✅ New landlord created:', {
        id: landlord.id,
        email: landlord.email,
        name: `${landlord.firstName} ${landlord.lastName}`,
      });
    }

    // Create property
    const property = propertyRepo.create({
      agentId: req.user.userId,
      landlordId: landlord.id,
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      postalCode: req.body.postalCode || '',
      country: req.body.country || 'Kenya',
      monthlyRent: req.body.monthlyRent || null,
      depositAmount: req.body.depositAmount || null,
      description: req.body.description || '',
      propertyType: req.body.propertyType || 'house',
      propertyModel: req.body.propertyModel || 'rental', // 'rental' or 'airbnb'
      securityFee: (req.body.propertyModel === 'rental' || !req.body.propertyModel) ? (req.body.securityFee || null) : null, // Only for rental properties
      isAvailable: true,
    });

    const savedProperty = await propertyRepo.save(property);

    // Create floors and units
    const floorsToSave: PropertyFloor[] = [];
    const unitsToSave: PropertyUnit[] = [];

    for (const floorDTO of req.body.floors) {
      const floor = floorRepo.create({
        propertyId: savedProperty.id,
        floorNumber: floorDTO.floorNumber,
        unitsPerFloor: floorDTO.unitsPerFloor,
        description: floorDTO.description || '',
      });

      const savedFloor = await floorRepo.save(floor);

      // Create units for this floor
      for (let unitNum = 1; unitNum <= floorDTO.unitsPerFloor; unitNum++) {
        const unit = unitRepo.create({
          floorId: savedFloor.id,
          unitNumber: unitNum,
          roomType: floorDTO.roomTypes?.[unitNum - 1] || '1-Bedroom', // Use provided room types or default
          status: 'vacant',
        });
        unitsToSave.push(unit);
      }
    }

    if (unitsToSave.length > 0) {
      await unitRepo.save(unitsToSave);
    }

    // Create room type pricing if provided
    const pricingSave: PropertyRoomTypePricing[] = [];
    if (req.body.roomTypePrices && Object.keys(req.body.roomTypePrices).length > 0) {
      for (const [roomType, price] of Object.entries(req.body.roomTypePrices)) {
        const pricing = roomTypePricingRepo.create({
          propertyId: savedProperty.id,
          roomType,
          price: price as number,
          billingFrequency: 'monthly',
        });
        pricingSave.push(pricing);
      }
      await roomTypePricingRepo.save(pricingSave);
      console.log('✅ Room type pricing created:', {
        propertyId: savedProperty.id,
        pricing: req.body.roomTypePrices,
      });
    }

    console.log('✅ Property created:', {
      id: savedProperty.id,
      name: savedProperty.name,
      landlordId: savedProperty.landlordId,
      floorsCount: req.body.floors.length,
    });

    // Get all units to show available room types
    const floors = await floorRepo.find({ where: { propertyId: savedProperty.id } });
    const floorIds = floors.map(f => f.id);
    const allUnits = floorIds.length > 0 
      ? await unitRepo.find({ 
          where: { floorId: In(floorIds) }
        })
      : [];
    const roomTypes = [...new Set(unitsToSave.map(u => u.roomType))]; // Unique room types from created units

    return res.status(201).json({
      message: 'Property created successfully with room type pricing!',
      data: {
        id: savedProperty.id,
        name: savedProperty.name,
        address: savedProperty.address,
        city: savedProperty.city,
        propertyType: savedProperty.propertyType,
        propertyModel: savedProperty.propertyModel,
        monthlyRent: savedProperty.monthlyRent,
        securityFee: savedProperty.securityFee, // Monthly security fee if applicable
        floorsCount: req.body.floors.length,
        unitsCount: unitsToSave.length,
        availableRoomTypes: roomTypes,
        roomTypePrices: req.body.roomTypePrices || {},
        landlord: {
          id: landlord.id,
          name: `${landlord.firstName} ${landlord.lastName}`,
          email: landlord.email,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Property creation error:', {
      userId: (req as AuthenticatedRequest).user?.userId,
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'PROPERTY_CREATION_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/properties
 * List all properties for an agent
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const propertyRepo = AppDataSource.getRepository(Property);
    const properties = await propertyRepo.find({
      where: { agentId: req.user.userId },
      relations: ['landlord', 'floors', 'floors.units'],
      order: { createdAt: 'DESC' },
    });

    return res.status(200).json({
      message: 'Properties retrieved successfully',
      data: properties.map((prop) => ({
        id: prop.id,
        name: prop.name,
        address: prop.address,
        city: prop.city,
        monthlyRent: prop.monthlyRent,
        floorsCount: prop.floors?.length || 0,
        totalUnits: prop.floors?.reduce((sum, floor) => sum + (floor.units?.length || 0), 0) || 0,
        landlord: {
          id: prop.landlord.id,
          name: `${prop.landlord.firstName} ${prop.landlord.lastName}`,
          email: prop.landlord.email,
        },
        createdAt: prop.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error listing properties:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'LIST_PROPERTIES_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/properties/:id
 * Get property details with floors and units
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const propertyRepo = AppDataSource.getRepository(Property);
    const property = await propertyRepo.findOne({
      where: { id: req.params.id, agentId: req.user.userId },
      relations: ['landlord', 'floors', 'floors.units'],
    });

    if (!property) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
        },
      });
    }

    return res.status(200).json({
      message: 'Property retrieved successfully',
      data: {
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        postalCode: property.postalCode,
        country: property.country,
        description: property.description,
        monthlyRent: property.monthlyRent,
        depositAmount: property.depositAmount,
        propertyType: property.propertyType,
        landlord: {
          id: property.landlord.id,
          firstName: property.landlord.firstName,
          lastName: property.landlord.lastName,
          email: property.landlord.email,
        },
        floors: property.floors.map((floor) => ({
          id: floor.id,
          floorNumber: floor.floorNumber,
          unitsPerFloor: floor.unitsPerFloor,
          units: floor.units.map((unit) => ({
            id: unit.id,
            unitNumber: unit.unitNumber,
            roomType: unit.roomType,
            status: unit.status,
            currentTenantId: unit.currentTenantId,
          })),
        })),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching property:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'GET_PROPERTY_ERROR',
      },
    });
  }
});

/**
 * PUT /api/v1/properties/:id
 * Update property details
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const errors = await validateRequest(req.body, UpdatePropertyRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: messages,
        },
      });
    }

    const propertyRepo = AppDataSource.getRepository(Property);
    const property = await propertyRepo.findOne({
      where: { id: req.params.id, agentId: req.user.userId },
      relations: ['landlord', 'floors', 'floors.units'],
    });

    if (!property) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
        },
      });
    }

    // Update only provided fields
    Object.assign(property, req.body);
    await propertyRepo.save(property);

    console.log('✅ Property updated:', { id: property.id });

    return res.status(200).json({
      message: 'Property updated successfully',
      data: {
        id: property.id,
        name: property.name,
        address: property.address,
        monthlyRent: property.monthlyRent,
      },
    });
  } catch (error: any) {
    console.error('❌ Error updating property:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'UPDATE_PROPERTY_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/v1/properties/:id
 * Delete property (and cascade floors/units)
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const propertyRepo = AppDataSource.getRepository(Property);
    const property = await propertyRepo.findOne({
      where: { id: req.params.id, agentId: req.user.userId },
    });

    if (!property) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
        },
      });
    }

    await propertyRepo.remove(property);

    console.log('✅ Property deleted:', { id: req.params.id });

    return res.status(200).json({
      message: 'Property deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting property:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'DELETE_PROPERTY_ERROR',
      },
    });
  }
});

export default router;
