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
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
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
 * POST /api/v1/properties
 * Create a new property with floors, units, and landlord
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Creating new property for agent:', req.user?.userId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const errors = await validateRequest(req.body, CreatePropertyRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Property validation errors:', messages);
      throw new ValidationError('Property creation validation failed', { messages });
    }

    const propertyRepo = AppDataSource.getRepository(Property);
    const userRepo = AppDataSource.getRepository(User);
    const floorRepo = AppDataSource.getRepository(PropertyFloor);
    const unitRepo = AppDataSource.getRepository(PropertyUnit);
    const landlordProfileRepo = AppDataSource.getRepository(LandlordProfile);
    const roomTypePricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);

    // Check if landlord with email already exists
    console.log('🔍 Checking landlord email:', req.body.landlordEmail);
    let landlord = await userRepo.findOne({ where: { email: req.body.landlordEmail } });

    if (!landlord) {
      try {
        console.log('👤 Creating new landlord...');
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
        console.log('✅ Landlord created:', landlord.id);

        // Create landlord profile
        const landlordProfile = landlordProfileRepo.create({
          userId: landlord.id,
          physicalAddress: req.body.address || '',
        });
        await landlordProfileRepo.save(landlordProfile);
        console.log('✅ Landlord profile created');
      } catch (err: any) {
        console.error('❌ Error creating landlord:', err.message);
        throw new DatabaseError(err.message, 'landlord_creation', { email: req.body.landlordEmail });
      }
    } else {
      console.log('✅ Using existing landlord:', landlord.id);
    }

    // Create property
    try {
      console.log('🏢 Creating property:', req.body.name);
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
        propertyModel: req.body.propertyModel || 'rental',
        securityFee: (req.body.propertyModel === 'rental' || !req.body.propertyModel) ? (req.body.securityFee || null) : null,
        isAvailable: true,
      });

      const savedProperty = await propertyRepo.save(property);
      console.log('✅ Property created:', savedProperty.id);

      // Create floors and units
      try {
        console.log('🏗️ Creating floors and units...');
        const unitsToSave: PropertyUnit[] = [];

        for (const floorDTO of req.body.floors) {
          const floor = floorRepo.create({
            propertyId: savedProperty.id,
            floorNumber: floorDTO.floorNumber,
            unitsPerFloor: floorDTO.unitsPerFloor,
            description: floorDTO.description || '',
          });

          const savedFloor = await floorRepo.save(floor);
          console.log(`  ✓ Floor ${floorDTO.floorNumber} created`);

          // Create units for this floor
          for (let unitNum = 1; unitNum <= floorDTO.unitsPerFloor; unitNum++) {
            const unit = unitRepo.create({
              floorId: savedFloor.id,
              unitNumber: unitNum,
              roomType: floorDTO.roomTypes?.[unitNum - 1] || '1-Bedroom',
              status: 'vacant',
            });
            unitsToSave.push(unit);
          }
        }

        if (unitsToSave.length > 0) {
          await unitRepo.save(unitsToSave);
          console.log(`✅ Created ${unitsToSave.length} units`);
        }
      } catch (err: any) {
        console.error('❌ Error creating floors/units:', err.message);
        throw new DatabaseError(err.message, 'floors_units_creation');
      }

      // Create room type pricing if provided
      try {
        if (req.body.roomTypePrices && Object.keys(req.body.roomTypePrices).length > 0) {
          console.log('💰 Creating room type pricing...');
          const pricingSave: PropertyRoomTypePricing[] = [];
          
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
          console.log('✅ Room type pricing created');
        }
      } catch (err: any) {
        console.error('❌ Error creating pricing:', err.message);
        throw new DatabaseError(err.message, 'pricing_creation');
      }

      // Get all units to show available room types
      const floors = await floorRepo.find({ where: { propertyId: savedProperty.id } });
      const floorIds = floors.map(f => f.id);
      const allUnits = floorIds.length > 0
        ? await unitRepo.find({ where: { floorId: In(floorIds) } })
        : [];
      const roomTypes = [...new Set(allUnits.map(u => u.roomType))];

      console.log('✅ Property fully created:', savedProperty.id);
      return res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: {
          id: savedProperty.id,
          name: savedProperty.name,
          address: savedProperty.address,
          city: savedProperty.city,
          propertyType: savedProperty.propertyType,
          propertyModel: savedProperty.propertyModel,
          floorsCount: req.body.floors.length,
          unitsCount: allUnits.length,
          availableRoomTypes: roomTypes,
          landlord: {
            id: landlord.id,
            name: `${landlord.firstName} ${landlord.lastName}`,
            email: landlord.email,
          },
        },
      });
    } catch (err: any) {
      console.error('❌ Error in property creation flow:', err.message);
      throw new DatabaseError(err.message, 'property_creation');
    }
  } catch (error: any) {
    console.error('❌ Property creation error:', {
      userId: req.user?.userId,
      error: error.message,
    });
    throw error;
  }
});

/**
 * GET /api/v1/properties
 * List all properties for an agent
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Listing properties for agent:', req.user?.userId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const propertyRepo = AppDataSource.getRepository(Property);
      const properties = await propertyRepo.find({
        where: { agentId: req.user.userId },
        relations: ['landlord', 'floors', 'floors.units'],
        order: { createdAt: 'DESC' },
      });

      console.log(`✅ Retrieved ${properties.length} properties`);
      return res.status(200).json({
        success: true,
        message: 'Properties retrieved successfully',
        count: properties.length,
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
    } catch (err: any) {
      console.error('❌ Error querying properties:', err.message);
      throw new DatabaseError(err.message, 'list_properties');
    }
  } catch (error: any) {
    console.error('❌ Error listing properties:', error.message);
    throw error;
  }
});

/**
 * GET /api/v1/properties/:id
 * Get property details with floors and units
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching property:', req.params.id);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const propertyRepo = AppDataSource.getRepository(Property);
      const property = await propertyRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.landlord', 'landlord')
        .leftJoinAndSelect('p.floors', 'floors')
        .leftJoinAndSelect('floors.units', 'units')
        .leftJoinAndSelect('units.tenant', 'tenant')
        .leftJoinAndSelect('p.roomTypePricing', 'pricing')
        .where('p.id = :id AND p.agentId = :agentId', {
          id: req.params.id,
          agentId: req.user.userId,
        })
        .getOne();

      if (!property) {
        throw new NotFoundError('Property', { propertyId: req.params.id });
      }

      console.log('✅ Property fetched:', property.id);
      
      // Debug: Log tenant data
      property.floors.forEach((floor) => {
        floor.units.forEach((unit) => {
          if (unit.currentTenantId) {
            console.log(`🔍 Unit ${unit.unitNumber}: currentTenantId=${unit.currentTenantId}, tenant=${unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : 'NOT LOADED'}`);
          }
        });
      });
      return res.status(200).json({
        success: true,
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
          landlord: property.landlord ? {
            id: property.landlord.id,
            firstName: property.landlord.firstName,
            lastName: property.landlord.lastName,
            email: property.landlord.email,
          } : null,
          floors: property.floors.map((floor) => ({
            id: floor.id,
            floorNumber: floor.floorNumber,
            unitsPerFloor: floor.unitsPerFloor,
            units: floor.units.map((unit) => {
              const unitData: any = {
                id: unit.id,
                unitNumber: unit.unitNumber,
                roomType: unit.roomType,
                status: unit.status,
                currentTenantId: unit.currentTenantId,
              };
              // Include tenant info if occupied
              console.log(`🔍 Mapping Unit ${unit.unitNumber}: currentTenantId=${unit.currentTenantId}, tenant exists=${!!unit.tenant}, tenant=${unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : 'null'}`);
              if (unit.currentTenantId && unit.tenant) {
                unitData.tenant = {
                  id: unit.tenant.id,
                  firstName: unit.tenant.firstName,
                  lastName: unit.tenant.lastName,
                };
                console.log(`✅ Added tenant data for unit ${unit.unitNumber}`);
              }
              return unitData;
            }),
          })),
          roomTypePricings: property.roomTypePricing.map((pricing) => ({
            id: pricing.id,
            roomType: pricing.roomType,
            billingFrequency: pricing.billingFrequency,
            price: pricing.price,
            garbageAmount: pricing.garbageAmount,
            waterUnitCost: pricing.waterUnitCost,
          })),
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      });
    } catch (err: any) {
      console.error('❌ Error fetching property:', err.message);
      throw new DatabaseError(err.message, 'fetch_property');
    }
  } catch (error: any) {
    console.error('❌ Get property error:', error.message);
    throw error;
  }
});

/**
 * PUT /api/v1/properties/:id
 * Update property details
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Updating property:', req.params.id);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const errors = await validateRequest(req.body, UpdatePropertyRequest);
    if (errors.length > 0) {
      const messages = errors.flatMap((err) => Object.values(err.constraints || {}));
      console.warn('❌ Update validation errors:', messages);
      throw new ValidationError('Property update validation failed', { messages });
    }

    try {
      const propertyRepo = AppDataSource.getRepository(Property);
      const property = await propertyRepo.findOne({
        where: { id: req.params.id, agentId: req.user.userId },
        relations: ['landlord', 'floors', 'floors.units'],
      });

      if (!property) {
        throw new NotFoundError('Property', { propertyId: req.params.id });
      }

      console.log('✏️ Applying updates...');
      Object.assign(property, req.body);
      await propertyRepo.save(property);

      console.log('✅ Property updated:', property.id);
      return res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: {
          id: property.id,
          name: property.name,
          address: property.address,
          monthlyRent: property.monthlyRent,
        },
      });
    } catch (err: any) {
      console.error('❌ Error updating property:', err.message);
      throw new DatabaseError(err.message, 'update_property');
    }
  } catch (error: any) {
    console.error('❌ Update property error:', error.message);
    throw error;
  }
});

/**
 * DELETE /api/v1/properties/:id
 * Delete property (and cascade floors/units)
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Deleting property:', req.params.id);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const propertyRepo = AppDataSource.getRepository(Property);
      const property = await propertyRepo.findOne({
        where: { id: req.params.id, agentId: req.user.userId },
      });

      if (!property) {
        throw new NotFoundError('Property', { propertyId: req.params.id });
      }

      console.log('🗑️ Removing property...');
      await propertyRepo.remove(property);

      console.log('✅ Property deleted:', req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Property deleted successfully',
      });
    } catch (err: any) {
      console.error('❌ Error deleting property:', err.message);
      throw new DatabaseError(err.message, 'delete_property');
    }
  } catch (error: any) {
    console.error('❌ Delete property error:', error.message);
    throw error;
  }
});

export default router;
