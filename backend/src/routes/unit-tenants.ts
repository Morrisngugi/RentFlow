import express, { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { PropertyUnit } from '../entities/property/PropertyUnit';
import { TenantProfile } from '../entities/profile/TenantProfile';
import { Lease } from '../entities/lease/Lease';
import { LeaseTerm } from '../entities/lease/LeaseTerm';
import { Property } from '../entities/property/Property';
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
        monthlyRent,
        depositPaid,
        dateJoined,
        leaseTermMonths,
        notes
      } = req.body;
      const { propertyId, unitId } = req.params;

      console.log('Create tenant request body:', JSON.stringify(req.body, null, 2));
      console.log('Create tenant request params:', { propertyId, unitId });
      console.log('Extracted fields:', { 
        firstName, 
        lastName, 
        email, 
        phoneNumber, 
        monthlyRent,
        depositPaid,
        dateJoined,
        leaseTermMonths,
        notes,
      });

      // Validate input - basic fields required
      if (!firstName || !lastName || !email || !phoneNumber) {
        console.error('Validation failed:', { 
          firstName: { value: firstName, checks: { empty: !firstName } },
          lastName: { value: lastName, checks: { empty: !lastName } },
          email: { value: email, checks: { empty: !email } },
          phoneNumber: { value: phoneNumber, checks: { empty: !phoneNumber } },
        });
        return res.status(400).json({
          error: 'Missing required fields: firstName, lastName, email, phoneNumber',
          received: { firstName, lastName, email, phoneNumber },
        });
      }

      const userRepo = AppDataSource.getRepository(User);
      const unitRepo = AppDataSource.getRepository(PropertyUnit);
      const tenantProfileRepo = AppDataSource.getRepository(TenantProfile);
      const leaseRepo = AppDataSource.getRepository(Lease);
      const leaseTermRepo = AppDataSource.getRepository(LeaseTerm);
      const propertyRepo = AppDataSource.getRepository(Property);

      // Check if email already exists
      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: 'Email already registered' });
      }

      // Get property
      const property = await propertyRepo.findOne({ where: { id: propertyId } });
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Create tenant account
      const hashedPassword = await bcrypt.hash('tenant@123', 10);
      const newTenant = userRepo.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        passwordHash: hashedPassword,
        idNumber: `ID-${Date.now()}`, // Generate a unique ID
        role: 'tenant',
        isActive: true,
      });

      await userRepo.save(newTenant);

      // Create tenant profile
      const tenantProfile = tenantProfileRepo.create({
        user: newTenant,
      });

      await tenantProfileRepo.save(tenantProfile);

      // Assign tenant to unit
      const unit = (req as any).unit;
      unit.currentTenantId = newTenant.id;
      unit.status = 'occupied';
      unit.tenant = newTenant;

      await unitRepo.save(unit);

      // Create or find LeaseTerm based on leaseTermMonths
      let leaseTerm = await leaseTermRepo.findOne({
        where: { durationMonths: leaseTermMonths || 12 },
      });

      if (!leaseTerm) {
        leaseTerm = leaseTermRepo.create({
          name: `${leaseTermMonths || 12}-Month Lease`,
          durationMonths: leaseTermMonths || 12,
          autoRenewal: false,
          noticePeriodDays: 30,
        });
        await leaseTermRepo.save(leaseTerm);
      }

      // Calculate lease dates
      const startDate = new Date(dateJoined || new Date());
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (leaseTermMonths || 12));

      // Create Lease record
      const lease = leaseRepo.create({
        tenantId: newTenant.id,
        leaseTermId: leaseTerm.id,
        monthlyRent: monthlyRent ? parseFloat(monthlyRent) : 0,
        securityDeposit: depositPaid ? parseFloat(depositPaid) : 0,
        depositPaid: !!depositPaid,
        depositPaidDate: depositPaid ? new Date(dateJoined || new Date()) : undefined,
        startDate,
        endDate,
        status: 'active',
      });

      // Set non-relation columns directly
      lease.propertyId = propertyId;
      lease.landlordId = property.landlordId;

      await leaseRepo.save(lease);

      res.status(201).json({
        message: 'Tenant created and assigned successfully',
        tenant: {
          id: newTenant.id,
          firstName: newTenant.firstName,
          lastName: newTenant.lastName,
          email: newTenant.email,
          phoneNumber: newTenant.phoneNumber,
          role: newTenant.role,
          isActive: newTenant.isActive,
          defaultPassword: 'tenant@123',
        },
        lease: {
          id: lease.id,
          monthlyRent: lease.monthlyRent,
          securityDeposit: lease.securityDeposit,
          depositPaid: lease.depositPaid,
          startDate: lease.startDate,
          endDate: lease.endDate,
          status: lease.status,
        },
        unit: {
          id: unit.id,
          unitNumber: unit.unitNumber,
          roomType: unit.roomType,
          status: unit.status,
          currentTenantId: unit.currentTenantId,
        },
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      res.status(500).json({ error: 'Failed to create tenant', details: error instanceof Error ? error.message : '' });
    }
  }
);

// POST /api/v1/properties/:propertyId/units/:unitId/assign-tenant
// Assign existing tenant to unit
router.post(
  '/:propertyId/units/:unitId/assign-tenant',
  authenticate,
  verifyUnit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { tenantId } = req.body;
      const { unitId } = req.params;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      const userRepo = AppDataSource.getRepository(User);
      const unitRepo = AppDataSource.getRepository(PropertyUnit);

      // Verify tenant exists and is a tenant role
      const tenant = await userRepo.findOne({
        where: { id: tenantId, role: 'tenant' },
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Check if tenant is already assigned to another unit
      const existingAssignment = await unitRepo.findOne({
        where: { currentTenantId: tenantId },
      });

      if (existingAssignment && existingAssignment.id !== unitId) {
        return res.status(400).json({
          error: 'Tenant is already assigned to another unit',
        });
      }

      // Assign tenant to unit
      const unit = (req as any).unit;
      unit.currentTenantId = tenantId;
      unit.status = 'occupied';
      unit.tenant = tenant;

      await unitRepo.save(unit);

      res.json({
        message: 'Tenant assigned successfully',
        unit: {
          id: unit.id,
          unitNumber: unit.unitNumber,
          roomType: unit.roomType,
          status: unit.status,
          currentTenantId: unit.currentTenantId,
          tenant: {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            phoneNumber: tenant.phoneNumber,
          },
        },
      });
    } catch (error) {
      console.error('Error assigning tenant:', error);
      res.status(500).json({ error: 'Failed to assign tenant' });
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
