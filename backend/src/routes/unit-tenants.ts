import express, { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { PropertyUnit } from '../entities/property/PropertyUnit';
import { TenantProfile } from '../entities/profile/TenantProfile';
import { Lease } from '../entities/lease/Lease';
import { LeaseTerm } from '../entities/lease/LeaseTerm';
import { Property } from '../entities/property/Property';
import { PropertyRoomTypePricing } from '../entities/property/PropertyRoomTypePricing';
import { RentSchedule } from '../entities/payment/RentSchedule';
import { DepositBreakdown } from '../entities/lease/DepositBreakdown';
import { CreateTenantDTO } from '../types/tenant.dto';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router: Router = express.Router({ mergeParams: true });

// Middleware to verify unit exists
const verifyUnit = async (req: Request, res: Response, next: any) => {
  try {
    const { propertyId, unitId } = req.params;
    const unit = await AppDataSource.getRepository(PropertyUnit).findOne({
      where: { id: unitId },
    });

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    (req as any).unit = unit;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify unit' });
  }
};

// POST /api/v1/properties/:propertyId/units/:unitId/create-tenant
// Create a new tenant and assign to unit
router.post(
  '/:propertyId/units/:unitId/create-tenant',
  authenticate,
  verifyUnit,
  async (req: AuthenticatedRequest, res: Response) => {
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
        monthlyRent,
        securityFee,
        garbageAmount,
        waterUnitCost,
        dateJoined,
        leaseTermMonths,
        rentDueDate,
        notes,
        rentDeposit,
        waterDeposit,
        electricityDeposit,
        otherDeposit,
        otherDepositDescription,
      } = req.body;
      const { propertyId, unitId } = req.params;

      console.log('📋 Received create-tenant request:', { firstName, lastName, email, phoneNumber, monthlyRent });

      // Validate required fields
      if (!firstName || !lastName || !phoneNumber || !monthlyRent) {
        console.warn('❌ Missing required fields:', { firstName, lastName, phoneNumber, monthlyRent });
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'firstName, lastName, phoneNumber, and monthlyRent are required',
          received: { firstName, lastName, phoneNumber, monthlyRent }
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const unitRepo = AppDataSource.getRepository(PropertyUnit);
      const tenantProfileRepo = AppDataSource.getRepository(TenantProfile);
      const leaseRepo = AppDataSource.getRepository(Lease);
      const leaseTermRepo = AppDataSource.getRepository(LeaseTerm);
      const propertyRepo = AppDataSource.getRepository(Property);
      const depositBreakdownRepo = AppDataSource.getRepository(DepositBreakdown);

      // Check if email already exists
      if (email) {
        try {
          console.log('🔍 Checking if email exists:', email);
          const existingUserByEmail = await userRepo.findOne({ where: { email } });
          if (existingUserByEmail) {
            console.warn('❌ Email already registered:', email);
            return res.status(400).json({ error: 'Email already registered' });
          }
        } catch (err) {
          console.error('❌ Error checking email:', err);
          throw new Error(`Failed to check email existence: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Check if idNumber already exists
      if (idNumber) {
        try {
          console.log('🔍 Checking if ID already exists:', idNumber);
          const existingUserById = await userRepo.findOne({ where: { idNumber } });
          if (existingUserById) {
            console.warn('❌ ID Number already registered:', idNumber);
            return res.status(400).json({ error: 'ID Number already registered' });
          }
        } catch (err) {
          console.error('❌ Error checking ID:', err);
          throw new Error(`Failed to check ID existence: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Get property
      let property;
      try {
        console.log('🔍 Fetching property:', propertyId);
        property = await propertyRepo.findOne({ where: { id: propertyId } });
        if (!property) {
          console.warn('❌ Property not found:', propertyId);
          return res.status(404).json({ error: 'Property not found' });
        }
        console.log('✅ Property found:', { propertyId, landlordId: property.landlordId });
      } catch (err) {
        console.error('❌ Error fetching property:', err);
        throw new Error(`Failed to fetch property: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Create tenant account
      let newTenant;
      try {
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash('tenant@123', 10);
        console.log('👤 Creating tenant user:', { firstName, lastName, email, phoneNumber });
        
        newTenant = userRepo.create({
          firstName,
          lastName,
          email: email || null,
          phoneNumber,
          idNumber: idNumber || `TENANT-${Date.now()}`,
          passwordHash: hashedPassword,
          role: 'tenant',
          isActive: true,
        });

        await userRepo.save(newTenant);
        console.log('✅ Tenant user created:', newTenant.id);
      } catch (err) {
        console.error('❌ Error creating tenant user:', err);
        throw new Error(`Failed to create tenant account: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Create tenant profile
      try {
        console.log('📝 Creating tenant profile...');
        const tenantProfile = tenantProfileRepo.create({
          userId: newTenant.id,
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
      } catch (err) {
        console.error('❌ Error creating tenant profile:', err);
        throw new Error(`Failed to create tenant profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Assign tenant to unit
      try {
        console.log('🏠 Assigning tenant to unit:', unitId);
        const unit = (req as any).unit;
        if (!unit) {
          throw new Error('Unit not found in request context');
        }
        
        unit.currentTenantId = newTenant.id;
        unit.status = 'occupied';
        unit.tenant = newTenant;

        await unitRepo.save(unit);
        console.log('✅ Tenant assigned to unit');
      } catch (err) {
        console.error('❌ Error assigning tenant to unit:', err);
        throw new Error(`Failed to assign tenant to unit: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Create or find LeaseTerm
      let leaseTerm;
      try {
        console.log('🔍 Looking for lease term with duration:', leaseTermMonths || 12);
        leaseTerm = await leaseTermRepo.findOne({
          where: { durationMonths: leaseTermMonths || 12 },
        });

        if (!leaseTerm) {
          console.log('📋 Creating new lease term...');
          leaseTerm = leaseTermRepo.create({
            name: `${leaseTermMonths || 12}-Month Lease`,
            durationMonths: leaseTermMonths || 12,
            autoRenewal: false,
            noticePeriodDays: 30,
          });
          await leaseTermRepo.save(leaseTerm);
          console.log('✅ Lease term created:', leaseTerm.id);
        } else {
          console.log('✅ Lease term found:', leaseTerm.id);
        }
      } catch (err) {
        console.error('❌ Error with lease term:', err);
        throw new Error(`Failed to process lease term: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }

      // Calculate lease dates
      try {
        console.log('📅 Calculating lease dates...');
        const startDate = new Date(dateJoined || new Date());
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (leaseTermMonths || 12));

        const computedRentDueDate = new Date(startDate);
        computedRentDueDate.setDate(startDate.getDate());

        console.log('📅 Lease dates calculated:', { startDate, endDate, computedRentDueDate });

        // Create Lease record
        console.log('📜 Creating lease record with:', {
          monthlyRent,
          securityFee,
          garbageAmount,
          waterUnitCost,
          startDate,
          endDate,
        });

        const lease = leaseRepo.create({
          tenantId: newTenant.id,
          leaseTermId: leaseTerm.id,
          monthlyRent: parseFloat(String(monthlyRent)) || 0,
          securityFee: securityFee ? parseFloat(String(securityFee)) : 0,
          garbageAmount: garbageAmount ? parseFloat(String(garbageAmount)) : 0,
          waterUnitCost: waterUnitCost ? parseFloat(String(waterUnitCost)) : 0,
          securityDeposit: (rentDeposit || 0) + (waterDeposit || 0) + (electricityDeposit || 0) + (otherDeposit || 0),
          depositPaid: false,
          startDate,
          endDate,
          rentDueDate: rentDueDate ? new Date(rentDueDate) : computedRentDueDate,
          status: 'active',
        });

        // Set required non-relation columns
        lease.propertyId = propertyId;
        lease.landlordId = property.landlordId;

        await leaseRepo.save(lease);
        console.log('✅ Lease created:', lease.id);

        // Create deposit breakdown if needed
        if (rentDeposit || waterDeposit || electricityDeposit || otherDeposit) {
          try {
            console.log('💰 Creating deposit breakdown...');
            const depositBreakdown = depositBreakdownRepo.create({
              leaseId: lease.id,
              rentDeposit: rentDeposit || 0,
              waterDeposit: waterDeposit || null,
              electricityDeposit: electricityDeposit || null,
              otherDeposit: otherDeposit || null,
              otherDepositDescription: otherDepositDescription || null,
            });

            await depositBreakdownRepo.save(depositBreakdown);
            console.log('✅ Deposit breakdown created');
          } catch (err) {
            console.error('❌ Error creating deposit breakdown:', err);
            throw new Error(`Failed to create deposit breakdown: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        // Success response
        console.log('✅ Tenant creation successful');
        res.status(201).json({
          message: 'Tenant created and assigned successfully',
          tenant: {
            id: newTenant.id,
            firstName: newTenant.firstName,
            lastName: newTenant.lastName,
            email: newTenant.email,
            phoneNumber: newTenant.phoneNumber,
            idNumber: newTenant.idNumber,
            role: newTenant.role,
            isActive: newTenant.isActive,
            defaultPassword: 'tenant@123',
          },
          lease: {
            id: lease.id,
            monthlyRent: lease.monthlyRent,
            securityFee: lease.securityFee,
            garbageAmount: lease.garbageAmount,
            waterUnitCost: lease.waterUnitCost,
            securityDeposit: lease.securityDeposit,
            startDate: lease.startDate,
            endDate: lease.endDate,
            rentDueDate: lease.rentDueDate,
            status: lease.status,
          },
          unit: {
            id: (req as any).unit.id,
            unitNumber: (req as any).unit.unitNumber,
            roomType: (req as any).unit.roomType,
            status: 'occupied',
            currentTenantId: newTenant.id,
          },
        });
      } catch (err) {
        console.error('❌ Error in lease creation:', err);
        throw new Error(`Failed to create lease: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ FATAL Error creating tenant:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      res.status(500).json({ 
        error: 'Failed to create tenant', 
        details: error.message || (error instanceof Error ? error.message : 'Unknown error'),
        type: error.name || 'UnknownError'
      });
    }
  }
);

// POST /api/v1/properties/:propertyId/units/:unitId/assign-tenant
// Assign existing tenant to unit with automatic rent fetching based on room type
router.post(
  '/:propertyId/units/:unitId/assign-tenant',
  authenticate,
  verifyUnit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        tenantId,
        monthlyRent,
        garbageAmount,
        waterUnitCost,
        securityDeposit, // Manual input - not from property pricing
        rentDueDay,
        startDate,
      } = req.body;
      const { propertyId, unitId } = req.params;

      // Validate required fields
      if (!tenantId) {
        return res.status(400).json({
          error: 'tenantId is required',
          code: 'VALIDATION_ERROR',
        });
      }

      if (!rentDueDay) {
        return res.status(400).json({
          error: 'rentDueDay is required',
          code: 'VALIDATION_ERROR',
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const unitRepo = AppDataSource.getRepository(PropertyUnit);
      const leaseRepo = AppDataSource.getRepository(Lease);
      const leaseTermRepo = AppDataSource.getRepository(LeaseTerm);
      const propertyRepo = AppDataSource.getRepository(Property);
      const roomTypePricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);
      const rentScheduleRepo = AppDataSource.getRepository(RentSchedule);

      // Verify tenant exists and is a tenant role
      const tenant = await userRepo.findOne({
        where: { id: tenantId, role: 'tenant' },
      });

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND',
        });
      }

      // Check if tenant is already assigned to another unit
      const existingAssignment = await unitRepo.findOne({
        where: { currentTenantId: tenantId },
      });

      if (existingAssignment && existingAssignment.id !== unitId) {
        return res.status(400).json({
          error: 'Tenant is already assigned to another unit',
          code: 'TENANT_ALREADY_ASSIGNED',
        });
      }

      // Get property
      const property = await propertyRepo.findOne({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({
          error: 'Property not found',
          code: 'PROPERTY_NOT_FOUND',
        });
      }

      // Get unit with room type
      const unit = (req as any).unit;

      // Fetch room type pricing for automatic rent assignment
      let rentTerms = {
        monthlyRent: monthlyRent,
        garbageAmount: garbageAmount || 0,
        waterUnitCost: waterUnitCost || 0,
        securityDeposit: securityDeposit,
      };

      if (!monthlyRent) {
        // Auto-fetch pricing based on room type
        const roomPricing = await roomTypePricingRepo.findOne({
          where: {
            propertyId,
            roomType: unit.roomType,
          },
        });

        if (!roomPricing) {
          return res.status(400).json({
            error: `No pricing configured for room type "${unit.roomType}" in this property`,
            code: 'NO_ROOM_TYPE_PRICING',
            details: {
              roomType: unit.roomType,
              propertyId,
            },
          });
        }

        // Build rent terms based on property model
        // For AirBnB: just the price, no additional charges
        // For Rental: price + optional garbage and water costs
        rentTerms = {
          monthlyRent: parseFloat(roomPricing.price.toString()),
          garbageAmount: property.propertyModel === 'rental' ? (roomPricing.garbageAmount ? parseFloat(roomPricing.garbageAmount.toString()) : 0) : 0,
          waterUnitCost: property.propertyModel === 'rental' ? (roomPricing.waterUnitCost ? parseFloat(roomPricing.waterUnitCost.toString()) : 0) : 0,
          securityDeposit: securityDeposit ? parseFloat(securityDeposit.toString()) : undefined, // Always manual input
        };

        // Store billing frequency for AirBnB response
        (req as any).billingFrequency = roomPricing.billingFrequency;
        (req as any).propertyModel = property.propertyModel;
      }

      // Assign tenant to unit
      unit.currentTenantId = tenantId;
      unit.status = 'occupied';
      unit.tenant = tenant;
      await unitRepo.save(unit);

      // Get or create LeaseTerm for monthly leases
      let leaseTerm = await leaseTermRepo.findOne({
        where: { durationMonths: 1 },
      });

      if (!leaseTerm) {
        leaseTerm = leaseTermRepo.create({
          name: 'Monthly',
          durationMonths: 1,
          autoRenewal: true,
          noticePeriodDays: 30,
        });
        await leaseTermRepo.save(leaseTerm);
      }

      // Create Lease record for ongoing monthly rental
      const leaseStartDate = new Date(startDate || new Date());
      const leaseEndDate = new Date(leaseStartDate);
      leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1); // Default 1 year, but auto-renewal

      const lease = leaseRepo.create({
        propertyId,
        tenantId,
        landlordId: property.landlordId,
        leaseTermId: leaseTerm.id,
        monthlyRent: rentTerms.monthlyRent,
        securityFee: property.securityFee || 0, // Auto-fetch from property
        garbageAmount: rentTerms.garbageAmount,
        waterUnitCost: rentTerms.waterUnitCost,
        securityDeposit: rentTerms.securityDeposit,
        depositPaid: false,
        startDate: leaseStartDate,
        endDate: leaseEndDate,
        status: 'active',
      });

      await leaseRepo.save(lease);

      // Create RentSchedule for recurring monthly payments
      const dueDate = new Date(leaseStartDate);
      dueDate.setDate(rentDueDay);
      if (dueDate < leaseStartDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const rentSchedule = rentScheduleRepo.create({
        leaseId: lease.id,
        rentDueDay,
        dueDate,
      });

      await rentScheduleRepo.save(rentSchedule);

      return res.status(201).json({
        message: 'Tenant assigned successfully with auto-fetched rent terms',
        data: {
          property: {
            id: property.id,
            name: property.name,
            propertyModel: property.propertyModel, // 'rental' or 'airbnb'
            billingFrequency: (req as any).billingFrequency || 'monthly',
          },
          unit: {
            id: unit.id,
            unitNumber: unit.unitNumber,
            roomType: unit.roomType,
            status: unit.status,
            currentTenantId: unit.currentTenantId,
          },
          tenant: {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            phoneNumber: tenant.phoneNumber,
          },
          lease: {
            id: lease.id,
            monthlyRent: lease.monthlyRent,
            securityFee: lease.securityFee, // Monthly security fee for security personnel
            garbageAmount: lease.garbageAmount,
            waterUnitCost: lease.waterUnitCost,
            securityDeposit: lease.securityDeposit, // One-time upfront deposit
            startDate: lease.startDate,
            endDate: lease.endDate,
            status: lease.status,
          },
          rentSchedule: {
            id: rentSchedule.id,
            rentDueDay: rentSchedule.rentDueDay,
            dueDate: rentSchedule.dueDate,
          },
        },
      });
    } catch (error) {
      console.error('Error assigning tenant:', error);
      return res.status(500).json({
        error: 'Failed to assign tenant',
        code: 'ASSIGN_TENANT_ERROR',
        details: error instanceof Error ? error.message : '',
      });
    }
  }
);

// DELETE /api/v1/properties/:propertyId/units/:unitId/remove-tenant
// Remove tenant from unit
router.delete(
  '/:propertyId/units/:unitId/remove-tenant',
  authenticate,
  verifyUnit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unitId } = req.params;

      const unitRepo = AppDataSource.getRepository(PropertyUnit);
      const unit = (req as any).unit;

      if (!unit.currentTenantId) {
        return res.status(400).json({ error: 'No tenant assigned to this unit' });
      }

      unit.currentTenantId = null;
      unit.status = 'vacant';
      unit.tenant = null;

      await unitRepo.save(unit);

      res.json({
        message: 'Tenant removed successfully',
        unit: {
          id: unit.id,
          unitNumber: unit.unitNumber,
          roomType: unit.roomType,
          status: unit.status,
          currentTenantId: null,
        },
      });
    } catch (error) {
      console.error('Error removing tenant:', error);
      res.status(500).json({ error: 'Failed to remove tenant' });
    }
  }
);

// GET /api/v1/properties/:propertyId/units/:unitId/current-tenant
// Get current tenant of a unit
router.get(
  '/:propertyId/units/:unitId/current-tenant',
  authenticate,
  verifyUnit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const unit = (req as any).unit;

      if (!unit.currentTenantId) {
        return res.json({ tenant: null });
      }

      const userRepo = AppDataSource.getRepository(User);
      const tenant = await userRepo.findOne({
        where: { id: unit.currentTenantId },
      });

      res.json({
        tenant: tenant ? {
          id: tenant.id,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email,
          phoneNumber: tenant.phoneNumber,
          isActive: tenant.isActive,
        } : null,
      });
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ error: 'Failed to fetch tenant' });
    }
  }
);

export default router;
