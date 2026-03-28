import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Lease } from '../entities/lease/Lease';
import { Payment } from '../entities/payment/Payment';
import { WaterMeterReading } from '../entities/payment/WaterMeterReading';
import { MonthlyRentBreakdown } from '../entities/payment/MonthlyRentBreakdown';
import { User } from '../entities/User';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from '../errors/AppError';

const router = Router();

/**
 * GET /api/v1/leases/by-tenant/:tenantId
 * Get active lease for a tenant
 */
router.get('/by-tenant/:tenantId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching lease for tenant:', req.params.tenantId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const { tenantId } = req.params;

    try {
      const leaseRepo = AppDataSource.getRepository(Lease);
      
      // Get active lease for tenant
      const lease = await leaseRepo.findOne({
        where: { 
          tenantId,
          status: 'active'
        },
        order: { createdAt: 'DESC' }
      });

      if (!lease) {
        return res.status(200).json({
          success: true,
          message: 'No active lease found',
          data: null,
        });
      }

      console.log('✅ Lease fetched:', lease.id);
      return res.status(200).json({
        success: true,
        message: 'Lease retrieved successfully',
        data: {
          id: lease.id,
          monthlyRent: lease.monthlyRent,
          securityFee: lease.securityFee,
          garbageAmount: lease.garbageAmount,
          waterUnitCost: lease.waterUnitCost,
          rentDueDate: lease.rentDueDate,
          startDate: lease.startDate,
          endDate: lease.endDate,
          status: lease.status,
          propertyId: lease.propertyId,
        },
      });
    } catch (err: any) {
      console.error('❌ Error fetching lease:', err.message);
      throw new DatabaseError(err.message, 'fetch_lease_by_tenant');
    }
  } catch (error: any) {
    console.error('❌ Fetch lease error:', error.message);
    throw error;
  }
});

/**
 * POST /api/v1/leases/:leaseId/water-meter-reading
 * Record a water meter reading for a lease
 */
router.post('/:leaseId/water-meter-reading', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Recording water meter reading for lease:', req.params.leaseId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const { leaseId } = req.params;
    const { readingDate, unitsUsed } = req.body;

    // Validate required fields
    if (!readingDate || !unitsUsed) {
      throw new ValidationError('readingDate and unitsUsed are required', { received: req.body });
    }

    try {
      const leaseRepo = AppDataSource.getRepository(Lease);
      console.log('🔍 Fetching lease:', leaseId);
      
      const lease = await leaseRepo.findOne({
        where: { id: leaseId },
        relations: ['tenant', 'landlord'],
      });

      if (!lease) {
        throw new NotFoundError('Lease', { leaseId });
      }

      // Only landlord or agent can record readings
      if (lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
        throw new AuthorizationError('You do not have permission to record readings for this lease');
      }

      console.log('💧 Creating water meter reading...');
      const waterMeterReadingRepo = AppDataSource.getRepository(WaterMeterReading);
      const reading = waterMeterReadingRepo.create({
        leaseId,
        readingDate: new Date(readingDate),
        unitsUsed: parseFloat(String(unitsUsed)),
        meterReadingStart: req.body.meterReadingStart ? parseFloat(String(req.body.meterReadingStart)) : null,
        meterReadingEnd: req.body.meterReadingEnd ? parseFloat(String(req.body.meterReadingEnd)) : null,
        notes: req.body.notes || '',
      } as any);

      const savedReadingResult = await waterMeterReadingRepo.save(reading);
      const savedReading = Array.isArray(savedReadingResult) ? savedReadingResult[0] : savedReadingResult;
      console.log('✅ Water meter reading saved:', savedReading?.id);

      // Auto-calculate and update monthly rent breakdown for this month
      console.log('🧮 Calculating monthly rent...');
      await calculateMonthlyRent(leaseId);
      console.log('✅ Monthly rent calculated');

      return res.status(201).json({
        success: true,
        message: 'Water meter reading recorded successfully',
        data: savedReading,
      });
    } catch (err: any) {
      console.error('❌ Error in water meter recording:', err.message);
      throw new DatabaseError(err.message, 'water_meter_reading');
    }
  } catch (error: any) {
    console.error('❌ Water meter reading error:', error.message);
    throw error;
  }
});

/**
 * POST /api/v1/leases/:leaseId/payments
 * Record a payment for a lease
 */
router.post('/:leaseId/payments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Recording payment for lease:', req.params.leaseId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const { leaseId } = req.params;
    const { amount, paymentMethod, paymentDate, month, year, waterMeterReading } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod || !paymentDate || !month || !year) {
      throw new ValidationError('amount, paymentMethod, paymentDate, month, and year are required', {
        received: { amount, paymentMethod, paymentDate, month, year },
      });
    }

    try {
      const leaseRepo = AppDataSource.getRepository(Lease);
      console.log('🔍 Fetching lease:', leaseId);
      
      const lease = await leaseRepo.findOne({ where: { id: leaseId } });

      if (!lease) {
        throw new NotFoundError('Lease', { leaseId });
      }

      // Check authorization
      if (lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
        throw new AuthorizationError('You do not have permission to record payments for this lease');
      }

      const paymentRepo = AppDataSource.getRepository(Payment);
      const monthlyBreakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

      console.log('🔍 Fetching monthly breakdown:', { month, year });
      // Get or create monthly breakdown
      let breakdown = await monthlyBreakdownRepo.findOne({
        where: { leaseId, month: parseInt(String(month)), year: parseInt(String(year)) },
      });

      if (!breakdown) {
        console.log('📝 Creating monthly breakdown on demand...');
        // Calculate based on lease terms
        const baseRent = parseFloat(String(lease.monthlyRent)) || 0;
        const securityFee = parseFloat(String(lease.securityFee)) || 0;
        const garbageCharges = parseFloat(String(lease.garbageAmount)) || 0;
        const waterUnitCost = parseFloat(String(lease.waterUnitCost)) || 0;

        // Calculate water charges if meter reading provided
        let waterCharges = 0;
        if (waterMeterReading && waterMeterReading.unitsConsumed) {
          waterCharges = waterUnitCost * parseFloat(String(waterMeterReading.unitsConsumed));
        }

        const totalDue = baseRent + securityFee + garbageCharges + waterCharges;

        // Create new breakdown
        const newBreakdown = monthlyBreakdownRepo.create({
          leaseId,
          month: parseInt(String(month)),
          year: parseInt(String(year)),
          baseRent,
          securityFee,
          garbageCharges,
          waterCharges,
          totalDue,
          amountPaid: 0,
          overpayment: 0,
          dueDate: new Date(lease.rentDueDate),
          status: 'pending',
        } as any);

        const savedBreakdownResult = await monthlyBreakdownRepo.save(newBreakdown);
        breakdown = Array.isArray(savedBreakdownResult) ? savedBreakdownResult[0] : savedBreakdownResult;
        console.log('✅ Monthly breakdown created:', breakdown?.id);
      }

      if (!breakdown) {
        throw new ValidationError('Failed to create or retrieve monthly breakdown', {
          month,
          year,
          leaseId,
        });
      }

      console.log('💰 Creating payment record...');
      const payment = paymentRepo.create({
        leaseId,
        tenantId: lease.tenantId,
        landlordId: lease.landlordId,
        amount: parseFloat(String(amount)),
        amountDue: breakdown.totalDue,
        paymentMethod,
        paidDate: new Date(paymentDate),
        dueDate: breakdown.dueDate,
        status: 'completed',
      } as any);

      const savedPaymentResult = await paymentRepo.save(payment);
      const savedPayment = Array.isArray(savedPaymentResult) ? savedPaymentResult[0] : savedPaymentResult;
      console.log('✅ Payment created:', savedPayment?.id);

      // Update monthly breakdown with the payment amount
      console.log('📝 Updating breakdown status...');
      const amountPaidNumeric = parseFloat(String(amount));
      const newAmountPaid = parseFloat(String(breakdown.amountPaid || 0)) + amountPaidNumeric;
      const newOverpayment = newAmountPaid - parseFloat(String(breakdown.totalDue));
      
      let newStatus = breakdown.status;
      if (newAmountPaid >= parseFloat(String(breakdown.totalDue))) {
        newStatus = newOverpayment > 0 ? 'overpaid' : 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partial';
      }

      // Use update to ensure it persists
      await monthlyBreakdownRepo.update(
        { id: breakdown.id },
        {
          amountPaid: newAmountPaid,
          overpayment: newOverpayment,
          status: newStatus,
        }
      );
      console.log('✅ Breakdown updated:', { newAmountPaid, newOverpayment, newStatus });

      // Fetch updated breakdown to return accurate data
      const updatedBreakdown = await monthlyBreakdownRepo.findOne({
        where: { id: breakdown.id },
      });

      return res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          payment: savedPayment,
          breakdown: {
            id: updatedBreakdown?.id,
            totalDue: updatedBreakdown?.totalDue,
            amountPaid: updatedBreakdown?.amountPaid,
            balanceRemaining: Math.max(0, parseFloat(String(updatedBreakdown?.totalDue || 0)) - parseFloat(String(updatedBreakdown?.amountPaid || 0))),
            overpayment: Math.max(0, parseFloat(String(updatedBreakdown?.overpayment || 0))),
            status: updatedBreakdown?.status,
          },
        },
      });
    } catch (err: any) {
      console.error('❌ Error in payment recording:', err.message);
      throw new DatabaseError(err.message, 'payment_recording');
    }
  } catch (error: any) {
    console.error('❌ Payment recording error:', error.message);
    throw error;
  }
});

/**
 * GET /api/v1/leases/:leaseId/monthly-breakdown
 * Get monthly rent breakdown for a specific month
 */
router.get('/:leaseId/monthly-breakdown', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching monthly breakdown:', req.params.leaseId);
    
    const { leaseId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      throw new ValidationError('month and year query parameters are required', { month, year });
    }

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const leaseRepo = AppDataSource.getRepository(Lease);
      console.log('🔍 Fetching lease:', leaseId);
      
      const lease = await leaseRepo.findOne({ where: { id: leaseId } });

      if (!lease) {
        throw new NotFoundError('Lease', { leaseId });
      }

      // Tenant can see their own lease payments, landlord/agent can see all
      if (lease.tenantId !== req.user.userId && lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
        throw new AuthorizationError('You do not have permission to view this lease breakdown');
      }

      const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);
      console.log('🔍 Querying breakdown...');
      
      const breakdown = await breakdownRepo.findOne({
        where: {
          leaseId,
          month: parseInt(month as string),
          year: parseInt(year as string),
        },
      });

      if (!breakdown) {
        console.log('❌ Breakdown not found for this month/year');
        return res.status(404).json({
          success: false,
          message: 'Monthly breakdown not found for this month',
          data: null,
        });
      }

      console.log('✅ Breakdown retrieved');
      return res.status(200).json({
        success: true,
        message: 'Monthly breakdown retrieved successfully',
        data: {
          id: breakdown.id,
          leaseId: breakdown.leaseId,
          month: breakdown.month,
          year: breakdown.year,
          baseRent: breakdown.baseRent,
          waterCharges: breakdown.waterCharges,
          garbageCharges: breakdown.garbageCharges,
          securityFee: breakdown.securityFee,
          totalDue: breakdown.totalDue,
          amountPaid: breakdown.amountPaid,
          balanceRemaining: Math.max(0, breakdown.totalDue - breakdown.amountPaid),
          overpayment: Math.max(0, breakdown.overpayment),
          status: breakdown.status,
          dueDate: breakdown.dueDate,
          createdAt: breakdown.createdAt,
          updatedAt: breakdown.updatedAt,
        },
      });
    } catch (err: any) {
      console.error('❌ Error fetching breakdown:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Error fetching breakdown',
        error: err.message,
      });
    }
  } catch (error: any) {
    console.error('❌ Fetch breakdown error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching breakdown',
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/leases/:leaseId/payment-history
 * Get all payments and monthly breakdowns for a lease
 */
router.get('/:leaseId/payment-history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📋 Fetching payment history for lease:', req.params.leaseId);
    
    const { leaseId } = req.params;

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    try {
      const leaseRepo = AppDataSource.getRepository(Lease);
      console.log('🔍 Fetching lease:', leaseId);
      
      const lease = await leaseRepo.findOne({ where: { id: leaseId } });

      if (!lease) {
        throw new NotFoundError('Lease', { leaseId });
      }

      // Tenant can see their own lease payments, landlord/agent can see all
      if (lease.tenantId !== req.user.userId && lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
        throw new AuthorizationError('You do not have permission to view this lease history');
      }

      console.log('🔍 Fetching payments and breakdowns...');
      const paymentRepo = AppDataSource.getRepository(Payment);
      const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

      const payments = await paymentRepo.find({
        where: { leaseId },
        order: { paidDate: 'DESC' },
      });

      const breakdowns = await breakdownRepo.find({
        where: { leaseId },
        order: { year: 'DESC', month: 'DESC' },
      });

      console.log('✅ History retrieved:', { paymentCount: payments.length, breakdownCount: breakdowns.length });
      
      return res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: {
          paymentCount: payments.length,
          breakdownCount: breakdowns.length,
          payments,
          monthlyBreakdowns: breakdowns,
        },
      });
    } catch (err: any) {
      console.error('❌ Error fetching history:', err.message);
      throw new DatabaseError(err.message, 'fetch_payment_history');
    }
  } catch (error: any) {
    console.error('❌ Fetch payment history error:', error.message);
    throw error;
  }
});

/**
 * Helper function to calculate monthly rent for a lease
 * First month: base rent only
 * From second month onwards: base rent + water charges + garbage + security fee
 */
async function calculateMonthlyRent(leaseId: string, month?: number, year?: number) {
  try {
    console.log('🧮 Calculating monthly rent for lease:', leaseId);
    
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-12
    const targetYear = year || now.getFullYear();

    const leaseRepo = AppDataSource.getRepository(Lease);
    const waterMeterRepo = AppDataSource.getRepository(WaterMeterReading);
    const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

    console.log('🔍 Fetching lease...');
    const lease = await leaseRepo.findOne({ where: { id: leaseId } });

    if (!lease) {
      throw new NotFoundError('Lease', { leaseId });
    }

    // Check if breakdown already exists
    console.log('🔍 Checking existing breakdown:', { month: targetMonth, year: targetYear });
    let breakdown: MonthlyRentBreakdown | null = await breakdownRepo.findOne({
      where: { leaseId, month: targetMonth, year: targetYear },
    });

    if (breakdown) {
      console.log('✅ Breakdown already exists, returning existing:', breakdown.id);
      return breakdown; // Already calculated
    }

    // Determine if this is the first month of the lease
    const leaseStartDate = new Date(lease.startDate);
    const isFirstMonth =
      leaseStartDate.getMonth() + 1 === targetMonth &&
      leaseStartDate.getFullYear() === targetYear;

    console.log('📅 First month:', isFirstMonth);

    let waterCharges = 0;
    let garbageCharges = 0;
    let securityFeeAmount = 0;

    // First month: only base rent
    // From second month onwards: include all charges
    if (!isFirstMonth) {
      console.log('💧 Fetching water meter reading...');
      // Get water meter reading for this month
      const waterReading = await waterMeterRepo.findOne({
        where: { leaseId },
        order: { readingDate: 'DESC' },
      });

      waterCharges = waterReading ? waterReading.unitsUsed * lease.waterUnitCost : 0;
      garbageCharges = lease.garbageAmount || 0;
      securityFeeAmount = lease.securityFee || 0;

      console.log('💰 Charges calculated:', { waterCharges, garbageCharges, securityFeeAmount });
    } else {
      console.log('💰 First month - base rent only');
    }

    const totalDue = lease.monthlyRent + waterCharges + garbageCharges + securityFeeAmount;

    // Create monthly breakdown
    console.log('📝 Creating monthly breakdown with total due:', totalDue);
    const newBreakdown = breakdownRepo.create({
      leaseId,
      month: targetMonth,
      year: targetYear,
      baseRent: lease.monthlyRent,
      waterCharges: waterCharges,
      garbageCharges: garbageCharges,
      securityFee: securityFeeAmount,
      totalDue,
      amountPaid: 0,
      overpayment: 0,
      status: 'pending',
      dueDate: new Date(targetYear, targetMonth - 1, lease.rentDueDate ? parseInt(lease.rentDueDate.toString()) : 1),
    } as any);

    breakdown = (await breakdownRepo.save(newBreakdown)) as unknown as MonthlyRentBreakdown;
    console.log('✅ Monthly breakdown created:', breakdown.id);

    return breakdown;
  } catch (error: any) {
    console.error('❌ Error calculating monthly rent:', error.message);
    throw new DatabaseError(error.message, 'calculate_monthly_rent');
  }
}

/**
 * PATCH /api/v1/leases/:breakdownId/update-charges
 * Update additional charges on a monthly rent breakdown
 */
router.patch('/:breakdownId/update-charges', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔄 Updating invoice charges for breakdown:', req.params.breakdownId);
    
    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    const { breakdownId } = req.params;
    const {
      penaltyCharges = 0,
      electricityReconnectionFee = 0,
      waterReconnectionFee = 0,
      otherCharges = 0,
      additionalChargesDescription = '',
      totalDue,
    } = req.body;

    const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);
    
    const breakdown = await breakdownRepo.findOne({
      where: { id: breakdownId }
    });

    if (!breakdown) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Update charges
    const penaltyNum = parseFloat(String(penaltyCharges || 0));
    const elecReconnNum = parseFloat(String(electricityReconnectionFee || 0));
    const waterReconnNum = parseFloat(String(waterReconnectionFee || 0));
    const otherNum = parseFloat(String(otherCharges || 0));
    const totalNum = parseFloat(String(totalDue || 0));

    await breakdownRepo.update(
      { id: breakdownId },
      {
        penaltyCharges: penaltyNum,
        electricityReconnectionFee: elecReconnNum,
        waterReconnectionFee: waterReconnNum,
        otherCharges: otherNum,
        additionalChargesDescription,
        totalDue: totalNum,
      }
    );

    // Refetch updated breakdown
    const updatedBreakdown = await breakdownRepo.findOne({
      where: { id: breakdownId }
    });

    console.log('✅ Invoice charges updated successfully');
    return res.status(200).json({
      success: true,
      message: 'Invoice charges updated successfully',
      data: updatedBreakdown,
    });
  } catch (error: any) {
    console.error('❌ Error updating invoice charges:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update invoice charges',
    });
  }
});

export default router;
