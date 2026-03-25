import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import { Lease } from '../entities/lease/Lease';
import { Payment } from '../entities/payment/Payment';
import { WaterMeterReading } from '../entities/payment/WaterMeterReading';
import { MonthlyRentBreakdown } from '../entities/payment/MonthlyRentBreakdown';
import { User } from '../entities/User';

const router = Router();

/**
 * POST /api/v1/leases/:leaseId/water-meter-reading
 * Record a water meter reading for a lease
 */
router.post('/:leaseId/water-meter-reading', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaseId } = req.params;
    const { readingDate, unitsUsed, meterReadingStart, meterReadingEnd, notes } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leaseRepo = AppDataSource.getRepository(Lease);
    const lease = await leaseRepo.findOne({
      where: { id: leaseId },
      relations: ['tenant', 'landlord'],
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Only landlord or agent can record readings
    if (lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const waterMeterReadingRepo = AppDataSource.getRepository(WaterMeterReading);
    const reading = waterMeterReadingRepo.create({
      leaseId,
      readingDate: new Date(readingDate),
      unitsUsed: parseFloat(unitsUsed),
      meterReadingStart: meterReadingStart ? parseFloat(meterReadingStart) : null,
      meterReadingEnd: meterReadingEnd ? parseFloat(meterReadingEnd) : null,
      notes,
    } as any);

    await waterMeterReadingRepo.save(reading);

    // Auto-calculate and update monthly rent breakdown for this month
    await calculateMonthlyRent(leaseId);

    return res.status(201).json({
      message: 'Water meter reading recorded successfully',
      data: reading,
    });
  } catch (error: any) {
    console.error('Error recording water meter reading:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/leases/:leaseId/payments
 * Record a payment for a lease
 */
router.post('/:leaseId/payments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaseId } = req.params;
    const { amount, paymentMethod, paymentDate, month, year } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leaseRepo = AppDataSource.getRepository(Lease);
    const lease = await leaseRepo.findOne({ where: { id: leaseId } });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Check authorization
    if (lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const paymentRepo = AppDataSource.getRepository(Payment);
    const monthlyBreakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

    // Get or create monthly breakdown
    let breakdown = await monthlyBreakdownRepo.findOne({
      where: { leaseId, month, year },
    });

    if (!breakdown) {
      return res.status(400).json({ error: 'Monthly rent breakdown not found. Please calculate rent first.' });
    }

    // Create payment record
    const payment = paymentRepo.create({
      leaseId,
      tenantId: lease.tenantId,
      landlordId: lease.landlordId,
      amount: parseFloat(amount),
      amountDue: breakdown.totalDue,
      paymentMethod,
      paidDate: new Date(paymentDate),
      dueDate: breakdown.dueDate,
      status: 'completed',
    } as any);

    await paymentRepo.save(payment);

    // Update monthly breakdown
    breakdown.amountPaid += parseFloat(amount);
    breakdown.overpayment = breakdown.amountPaid - breakdown.totalDue;

    if (breakdown.amountPaid >= breakdown.totalDue) {
      breakdown.status = breakdown.overpayment > 0 ? 'overpaid' : 'paid';
    } else if (breakdown.amountPaid > 0) {
      breakdown.status = 'partial';
    }

    await monthlyBreakdownRepo.save(breakdown);

    return res.status(201).json({
      message: 'Payment recorded successfully',
      data: {
        payment,
        breakdown,
      },
    });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/leases/:leaseId/monthly-breakdown
 * Get monthly rent breakdown for a specific month
 */
router.get('/:leaseId/monthly-breakdown', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaseId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leaseRepo = AppDataSource.getRepository(Lease);
    const lease = await leaseRepo.findOne({ where: { id: leaseId } });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Tenant can see their own lease payments, landlord/agent can see all
    if (lease.tenantId !== req.user.userId && lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);
    const breakdown = await breakdownRepo.findOne({
      where: {
        leaseId,
        month: parseInt(month as string),
        year: parseInt(year as string),
      },
    });

    if (!breakdown) {
      return res.status(404).json({ error: 'Monthly breakdown not found' });
    }

    return res.status(200).json({
      message: 'Monthly breakdown retrieved successfully',
      data: breakdown,
    });
  } catch (error: any) {
    console.error('Error fetching monthly breakdown:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/leases/:leaseId/payment-history
 * Get all payments and monthly breakdowns for a lease
 */
router.get('/:leaseId/payment-history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leaseId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const leaseRepo = AppDataSource.getRepository(Lease);
    const lease = await leaseRepo.findOne({ where: { id: leaseId } });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Tenant can see their own lease payments, landlord/agent can see all
    if (lease.tenantId !== req.user.userId && lease.landlordId !== req.user.userId && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Forbidden' });
    }

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

    return res.status(200).json({
      message: 'Payment history retrieved successfully',
      data: {
        payments,
        monthlyBreakdowns: breakdowns,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to calculate monthly rent for a lease
 * First month: base rent only
 * From second month onwards: base rent + water charges + garbage + security fee
 */
async function calculateMonthlyRent(leaseId: string, month?: number, year?: number) {
  try {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-12
    const targetYear = year || now.getFullYear();

    const leaseRepo = AppDataSource.getRepository(Lease);
    const waterMeterRepo = AppDataSource.getRepository(WaterMeterReading);
    const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

    const lease = await leaseRepo.findOne({ where: { id: leaseId } });

    if (!lease) throw new Error('Lease not found');

    // Check if breakdown already exists
    let breakdown: MonthlyRentBreakdown | null = await breakdownRepo.findOne({
      where: { leaseId, month: targetMonth, year: targetYear },
    });

    if (breakdown) {
      return breakdown; // Already calculated
    }

    // Determine if this is the first month of the lease
    const leaseStartDate = new Date(lease.startDate);
    const isFirstMonth = 
      leaseStartDate.getMonth() + 1 === targetMonth && 
      leaseStartDate.getFullYear() === targetYear;

    let waterCharges = 0;
    let garbageCharges = 0;
    let securityFeeAmount = 0;

    // First month: only base rent
    // From second month onwards: include all charges
    if (!isFirstMonth) {
      // Get water meter reading for this month
      const waterReading = await waterMeterRepo.findOne({
        where: { leaseId },
        order: { readingDate: 'DESC' },
      });

      waterCharges = waterReading ? (waterReading.unitsUsed * lease.waterUnitCost) : 0;
      garbageCharges = lease.garbageAmount;
      securityFeeAmount = lease.securityFee;
    }

    const totalDue = lease.monthlyRent + waterCharges + garbageCharges + securityFeeAmount;

    // Create monthly breakdown
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

    return breakdown;
  } catch (error) {
    console.error('Error calculating monthly rent:', error);
    throw error;
  }
}

export default router;
