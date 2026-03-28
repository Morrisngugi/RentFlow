import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Property } from '../entities/property/Property';
import { PropertyRoomTypePricing } from '../entities/property/PropertyRoomTypePricing';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

/**
 * POST /api/v1/properties/:propertyId/room-type-pricing
 * Set or update pricing for a specific room type in a property
 */
router.post('/:propertyId/room-type-pricing', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const { propertyId } = req.params;
    const { roomType, price, billingFrequency = 'monthly', garbageAmount, waterUnitCost } = req.body;

    // Validate required fields
    if (!roomType || !price) {
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Room type and price are required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const propertyRepo = AppDataSource.getRepository(Property);
    const pricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);

    // Verify property exists and belongs to the agent
    const property = await propertyRepo.findOne({
      where: { id: propertyId, agentId: req.user.userId },
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

    // Check if pricing already exists for this room type
    let pricing = await pricingRepo.findOne({
      where: { propertyId, roomType },
    });

    if (pricing) {
      // Update existing pricing
      pricing.price = price;
      pricing.billingFrequency = billingFrequency;
      pricing.garbageAmount = garbageAmount || null;
      pricing.waterUnitCost = waterUnitCost || null;
      await pricingRepo.save(pricing);

      console.log('✅ Room type pricing updated:', {
        propertyId,
        roomType,
        price,
      });
    } else {
      // Create new pricing
      pricing = pricingRepo.create({
        propertyId,
        roomType,
        price,
        billingFrequency,
        garbageAmount: garbageAmount || null,
        waterUnitCost: waterUnitCost || null,
      });
      await pricingRepo.save(pricing);

      console.log('✅ Room type pricing created:', {
        propertyId,
        roomType,
        price,
      });
    }

    return res.status(200).json({
      message: 'Room type pricing set successfully',
      data: {
        id: pricing.id,
        propertyId: pricing.propertyId,
        roomType: pricing.roomType,
        price: pricing.price,
        billingFrequency: pricing.billingFrequency,
        garbageAmount: pricing.garbageAmount,
        waterUnitCost: pricing.waterUnitCost,
      },
    });
  } catch (error: any) {
    console.error('❌ Error setting room type pricing:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'ROOM_TYPE_PRICING_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/properties/:propertyId/room-type-pricing
 * Get all room type pricing for a property
 */
router.get('/:propertyId/room-type-pricing', authenticate, async (req: AuthenticatedRequest, res: Response) => {
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

    const { propertyId } = req.params;

    const propertyRepo = AppDataSource.getRepository(Property);
    const pricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);

    // Verify property exists and belongs to the agent
    const property = await propertyRepo.findOne({
      where: { id: propertyId, agentId: req.user.userId },
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

    const pricings = await pricingRepo.find({
      where: { propertyId },
      order: { roomType: 'ASC' },
    });

    return res.status(200).json({
      message: 'Room type pricing retrieved successfully',
      data: pricings.map((p) => ({
        id: p.id,
        roomType: p.roomType,
        price: p.price,
        billingFrequency: p.billingFrequency,
        garbageAmount: p.garbageAmount,
        waterUnitCost: p.waterUnitCost,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error fetching room type pricing:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'FETCH_ROOM_TYPE_PRICING_ERROR',
      },
    });
  }
});

export default router;
