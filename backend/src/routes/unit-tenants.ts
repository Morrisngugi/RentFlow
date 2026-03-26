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
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from '../errors/AppError';
import { asyncHandler } from '../errors/errorUtils';

const router: Router = express.Router({ mergeParams: true });

// Middleware to verify unit exists
const verifyUnit = async (req: Request, res: Response, next: any) => {
  try {
    const { unitId } = req.params;
    console.log('🔍 Verifying unit:', unitId);
    
    const unit = await AppDataSource.getRepository(PropertyUnit).findOne({
      where: { id: unitId },
    });

    if (!unit) {
      console.warn('❌ Unit not found:', unitId);
      throw new NotFoundError('Unit', { unitId });
    }

    (req as any).unit = unit;
    console.log('✅ Unit verified');
    next();
  } catch (error: any) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      return next(error);
    }
    console.error('❌ Error verifying unit:', error.message);
    return next(new DatabaseError(error.message, 'verify_unit'));
  }
};

// POST /api/v1/properties/:propertyId/units/:unitId/create-tenant
// Create a new tenant and assign to unit
router.post(
  '/:propertyId/units/:unitId/create-tenant',
  authenticate,
  verifyUnit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log('📋 Creating new tenant for unit');

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

      // Validate required fields
      if (!firstName || !lastName || !phoneNumber || !monthlyRent) {
        console.warn('❌ Missing required tenant fields');
        throw new ValidationError('firstName, lastName, phoneNumber, and monthlyRent are required', {
          received: { firstName, lastName, phoneNumber, monthlyRent },
        });
      }

      // Validate enum values
      const validMaritalStatuses = ['single', 'married', 'divorced', 'widowed'];
      if (maritalStatus && !validMaritalStatuses.includes(maritalStatus.toLowerCase())) {
        console.warn('❌ Invalid marital status:', maritalStatus);
        throw new ValidationError('Invalid marital status value', {
          received: maritalStatus,
          valid: validMaritalStatuses,
        });
      }
      // Normalize maritalStatus to lowercase
      const normalizedMaritalStatus = maritalStatus ? maritalStatus.toLowerCase() : null;

      const userRepo = AppDataSource.getRepository(User);
      const unitRepo = AppDataSource.getRepository(PropertyUnit);
      const tenantProfileRepo = AppDataSource.getRepository(TenantProfile);
      const leaseRepo = AppDataSource.getRepository(Lease);
      const leaseTermRepo = AppDataSource.getRepository(LeaseTerm);
      const propertyRepo = AppDataSource.getRepository(Property);
      const depositBreakdownRepo = AppDataSource.getRepository(DepositBreakdown);

      try {
        // Check if email already exists
        if (email) {
          console.log('🔍 Checking if email exists:', email);
          const existingUserByEmail = await userRepo.findOne({ where: { email } });
          if (existingUserByEmail) {
            console.warn('❌ Email already registered:', email);
            throw new ConflictError('Email already registered', { email });
          }
        }

        // Check if idNumber already exists
        if (idNumber) {
          console.log('🔍 Checking if ID exists:', idNumber);
          const existingUserById = await userRepo.findOne({ where: { idNumber } });
          if (existingUserById) {
            console.warn('❌ ID already registered:', idNumber);
            throw new ConflictError('ID Number already registered', { idNumber });
          }
        }

        // Get property
        console.log('🔍 Fetching property:', propertyId);
        const property = await propertyRepo.findOne({ where: { id: propertyId } });
        if (!property) {
          console.warn('❌ Property not found:', propertyId);
          throw new NotFoundError('Property', { propertyId });
        }
        console.log('✅ Property found');

        // Create tenant account
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash('tenant@123', 10);
        console.log('👤 Creating tenant user');
        
        const newTenant = userRepo.create({
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

        // Create tenant profile
        console.log('📝 Creating tenant profile');
        const tenantProfile = tenantProfileRepo.create({
          userId: newTenant.id,
          nationality: nationality || null,
          maritalStatus: normalizedMaritalStatus,
          numberOfChildren: numberOfChildren || 0,
          occupation: occupation || null,
          postalAddress: postalAddress || null,
          nextOfKinName: nextOfKinName || null,
          nextOfKinPhone: nextOfKinPhone || null,
          nextOfKinRelationship: nextOfKinRelationship || null,
        });

        await tenantProfileRepo.save(tenantProfile);
        console.log('✅ Tenant profile created');

        // Assign tenant to unit
        console.log('🏠 Assigning tenant to unit');
        const unit = (req as any).unit;
        if (!unit) {
          throw new Error('Unit not found in request context');
        }
        
        unit.currentTenantId = newTenant.id;
        unit.status = 'occupied';
        unit.tenant = newTenant;
        await unitRepo.save(unit);
        console.log('✅ Tenant assigned to unit');

        // Create or find LeaseTerm
        console.log('🔍 Looking for lease term:', leaseTermMonths || 12);
        let leaseTerm = await leaseTermRepo.findOne({
          where: { durationMonths: leaseTermMonths || 12 },
        });

        if (!leaseTerm) {
          console.log('📋 Creating new lease term');
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

        // Calculate lease dates
        console.log('📅 Calculating lease dates');
        const startDate = new Date(dateJoined || new Date());
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (leaseTermMonths || 12));

        const computedRentDueDate = new Date(startDate);
        computedRentDueDate.setDate(startDate.getDate());

        // Create Lease record
        console.log('📜 Creating lease record');
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
          propertyId,
          landlordId: property.landlordId,
        });

        await leaseRepo.save(lease);
        console.log('✅ Lease created:', lease.id);

        // Create deposit breakdown if needed
        if (rentDeposit || waterDeposit || electricityDeposit || otherDeposit) {
          console.log('💰 Creating deposit breakdown');
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
        }

        // Success response
        console.log('✅ Tenant creation successful');
        return res.status(201).json({
          success: true,
          message: 'Tenant created and assigned successfully',
          data: {
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
              id: unit.id,
              unitNumber: unit.unitNumber,
              roomType: unit.roomType,
              status: 'occupied',
              currentTenantId: newTenant.id,
            },
          },
        });
      } catch (err: any) {
        if (err instanceof ValidationError || err instanceof ConflictError || err instanceof NotFoundError) {
          throw err;
        }
        console.error('❌ Error in lease creation:', err.message);
        throw new DatabaseError(err.message, 'create_tenant_with_lease');
      }
  })
);

// POST /api/v1/properties/:propertyId/units/:unitId/assign-tenant
// Assign existing tenant to unit with automatic rent fetching based on room type
router.post(
  '/:propertyId/units/:unitId/assign-tenant',
  authenticate,
  verifyUnit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log('📋 Assigning existing tenant to unit');

      if (!req.user) {
        throw new AuthenticationError('No user context found');
      }

      const {
        tenantId,
        monthlyRent,
        garbageAmount,
        waterUnitCost,
        securityDeposit,
        rentDueDay,
        startDate,
      } = req.body;
      const { propertyId, unitId } = req.params;

      // Validate required fields
      if (!tenantId) {
        console.warn('❌ tenantId is required');
        throw new ValidationError('tenantId is required', { received: { tenantId } });
      }

      if (!rentDueDay) {
        console.warn('❌ rentDueDay is required');
        throw new ValidationError('rentDueDay is required', { received: { rentDueDay } });
      }

      try {
        const userRepo = AppDataSource.getRepository(User);
        const unitRepo = AppDataSource.getRepository(PropertyUnit);
        const leaseRepo = AppDataSource.getRepository(Lease);
        const leaseTermRepo = AppDataSource.getRepository(LeaseTerm);
        const propertyRepo = AppDataSource.getRepository(Property);
        const roomTypePricingRepo = AppDataSource.getRepository(PropertyRoomTypePricing);
        const rentScheduleRepo = AppDataSource.getRepository(RentSchedule);

        // Verify tenant exists and is a tenant role
        console.log('🔍 Fetching tenant:', tenantId);
        const tenant = await userRepo.findOne({
          where: { id: tenantId, role: 'tenant' },
        });

        if (!tenant) {
          console.warn('❌ Tenant not found:', tenantId);
          throw new NotFoundError('Tenant', { tenantId });
        }
        console.log('✅ Tenant found');

        // Check if tenant is already assigned to another unit
        console.log('🔍 Checking existing assignments...');
        const existingAssignment = await unitRepo.findOne({
          where: { currentTenantId: tenantId },
        });

        if (existingAssignment && existingAssignment.id !== unitId) {
          console.warn('❌ Tenant already assigned to another unit');
          throw new ConflictError('Tenant is already assigned to another unit', {
            currentUnitId: existingAssignment.id,
            attemptedUnitId: unitId,
          });
        }

        // Get property
        console.log('🔍 Fetching property:', propertyId);
        const property = await propertyRepo.findOne({ where: { id: propertyId } });
        if (!property) {
          console.warn('❌ Property not found:', propertyId);
          throw new NotFoundError('Property', { propertyId });
        }
        console.log('✅ Property found');

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
          console.log('💰 Auto-fetching pricing for room type:', unit.roomType);
          // Auto-fetch pricing based on room type
          const roomPricing = await roomTypePricingRepo.findOne({
            where: {
              propertyId,
              roomType: unit.roomType,
            },
          });

          if (!roomPricing) {
            console.warn('❌ No pricing found for room type:', unit.roomType);
            throw new ValidationError('No pricing configured for this room type', {
              roomType: unit.roomType,
              propertyId,
            });
          }

          // Build rent terms based on property model
          rentTerms = {
            monthlyRent: parseFloat(roomPricing.price.toString()),
            garbageAmount: property.propertyModel === 'rental' ? (roomPricing.garbageAmount ? parseFloat(roomPricing.garbageAmount.toString()) : 0) : 0,
            waterUnitCost: property.propertyModel === 'rental' ? (roomPricing.waterUnitCost ? parseFloat(roomPricing.waterUnitCost.toString()) : 0) : 0,
            securityDeposit: securityDeposit ? parseFloat(securityDeposit.toString()) : undefined,
          };

          (req as any).billingFrequency = roomPricing.billingFrequency;
          (req as any).propertyModel = property.propertyModel;
        }

        // Assign tenant to unit
        console.log('🏠 Assigning tenant to unit');
        unit.currentTenantId = tenantId;
        unit.status = 'occupied';
        unit.tenant = tenant;
        await unitRepo.save(unit);
        console.log('✅ Tenant assigned');
        // Get or create LeaseTerm for monthly leases
        console.log('🔍 Looking for monthly lease term');
        let leaseTerm = await leaseTermRepo.findOne({
          where: { durationMonths: 1 },
        });

        if (!leaseTerm) {
          console.log('📋 Creating monthly lease term');
          leaseTerm = leaseTermRepo.create({
            name: 'Monthly',
            durationMonths: 1,
            autoRenewal: true,
            noticePeriodDays: 30,
          });
          await leaseTermRepo.save(leaseTerm);
          console.log('✅ Monthly lease term created');
        } else {
          console.log('✅ Monthly lease term found');
        }

        // Create Lease record for ongoing monthly rental
        console.log('📜 Creating lease record');
        const leaseStartDate = new Date(startDate || new Date());
        const leaseEndDate = new Date(leaseStartDate);
        leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);

        const lease = leaseRepo.create({
          propertyId,
          tenantId,
          landlordId: property.landlordId,
          leaseTermId: leaseTerm.id,
          monthlyRent: rentTerms.monthlyRent,
          securityFee: property.securityFee || 0,
          garbageAmount: rentTerms.garbageAmount,
          waterUnitCost: rentTerms.waterUnitCost,
          securityDeposit: rentTerms.securityDeposit,
          depositPaid: false,
          startDate: leaseStartDate,
          endDate: leaseEndDate,
          status: 'active',
        });

        await leaseRepo.save(lease);
        console.log('✅ Lease created:', lease.id);

        // Create RentSchedule for recurring monthly payments
        console.log('📅 Creating rent schedule');
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
        console.log('✅ Rent schedule created');

        console.log('✅ Tenant assignment successful');
        return res.status(201).json({
          success: true,
          message: 'Tenant assigned successfully with auto-fetched rent terms',
          data: {
            property: {
              id: property.id,
              name: property.name,
              propertyModel: property.propertyModel,
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
              securityFee: lease.securityFee,
              garbageAmount: lease.garbageAmount,
              waterUnitCost: lease.waterUnitCost,
              securityDeposit: lease.securityDeposit,
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
      } catch (err: any) {
        if (err instanceof ValidationError || err instanceof NotFoundError || err instanceof ConflictError) {
          throw err;
        }
        console.error('❌ Error in tenant assignment:', err.message);
        throw new DatabaseError(err.message, 'assign_tenant_with_lease');
      }
  })
);

// DELETE /api/v1/properties/:propertyId/units/:unitId/remove-tenant
// Remove tenant from unit
router.delete(
  '/:propertyId/units/:unitId/remove-tenant',
  authenticate,
  verifyUnit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log('📋 Removing tenant from unit');

      if (!req.user) {
        throw new AuthenticationError('No user context found');
      }

      try {
        const unitRepo = AppDataSource.getRepository(PropertyUnit);
        const unit = (req as any).unit;

        if (!unit.currentTenantId) {
          console.warn('❌ No tenant assigned to this unit');
          throw new ValidationError('No tenant assigned to this unit', { unitId: unit.id });
        }

        console.log('🏠 Removing tenant:', unit.currentTenantId);
        unit.currentTenantId = null;
        unit.status = 'vacant';
        unit.tenant = null;

        await unitRepo.save(unit);
        console.log('✅ Tenant removed');

        return res.json({
          success: true,
          message: 'Tenant removed successfully',
          unit: {
            id: unit.id,
            unitNumber: unit.unitNumber,
            roomType: unit.roomType,
            status: unit.status,
            currentTenantId: null,
          },
        });
      } catch (err: any) {
        if (err instanceof ValidationError) throw err;
        console.error('❌ Error removing tenant:', err.message);
        throw new DatabaseError(err.message, 'remove_tenant');
      }
  })
);

// GET /api/v1/properties/:propertyId/units/:unitId/current-tenant
// Get current tenant of a unit
router.get(
  '/:propertyId/units/:unitId/current-tenant',
  authenticate,
  verifyUnit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log('📋 Fetching current tenant for unit');

      if (!req.user) {
        throw new AuthenticationError('No user context found');
      }

      try {
        const unit = (req as any).unit;

        if (!unit.currentTenantId) {
          console.log('ℹ️ No tenant assigned to this unit');
          return res.json({
            success: true,
            message: 'Unit has no current tenant',
            tenant: null,
          });
        }

        console.log('🔍 Fetching tenant:', unit.currentTenantId);
        const userRepo = AppDataSource.getRepository(User);
        const tenant = await userRepo.findOne({
          where: { id: unit.currentTenantId },
        });

        console.log('✅ Tenant retrieved');
        return res.json({
          success: true,
          message: 'Current tenant retrieved successfully',
          tenant: tenant ? {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            phoneNumber: tenant.phoneNumber,
            isActive: tenant.isActive,
          } : null,
        });
      } catch (err: any) {
        console.error('❌ Error fetching tenant:', err.message);
        throw new DatabaseError(err.message, 'fetch_current_tenant');
      }
  })
);

export default router;
