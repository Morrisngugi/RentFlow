import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AuthorizationError, AuthenticationError } from '../errors/AppError';
import { AppDataSource } from '../config/database';
import { Payment } from '../entities/payment/Payment';
import { MonthlyRentBreakdown } from '../entities/payment/MonthlyRentBreakdown';
import { Lease } from '../entities/lease/Lease';
import { User } from '../entities/User';

const router = Router();

/**
 * GET /api/v1/payments/landlord-payments
 * Get all payments received from tenants (for landlords)
 */
router.get('/landlord-payments', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'landlord') {
      throw new AuthorizationError('Only landlords can view landlord payments');
    }

    console.log('📊 Fetching payments for landlord:', req.user.userId);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const leaseRepo = AppDataSource.getRepository(Lease);

    // Get all leases for this landlord's properties
    const leases = await leaseRepo
      .createQueryBuilder('lease')
      .leftJoinAndSelect('lease.property', 'property')
      .where('property.landlordId = :landlordId', { landlordId: req.user.userId })
      .getMany();

    const leaseIds = leases.map((lease) => lease.id);

    // If no leases, return empty array
    if (leaseIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No payments found',
        data: [],
      });
    }

    // Get all payments for these leases
    const payments = await paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.lease', 'lease')
      .leftJoinAndSelect('lease.property', 'property')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .where('payment.leaseId IN (:...leaseIds)', { leaseIds })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    console.log(`✅ Retrieved ${payments.length} payments for landlord`);

    // Format response
    const formattedPayments = payments.map((payment) => {
      const tenantName = payment.lease?.tenant 
        ? `${payment.lease.tenant.firstName || ''} ${payment.lease.tenant.lastName || ''}`.trim() 
        : 'Unknown Tenant';
      
      return {
        id: payment.id,
        leaseId: payment.leaseId,
        property: payment.lease?.property?.name || 'Unknown Property',
        tenant: tenantName,
        amount: payment.amount,
        dueDate: payment.lease?.startDate,
        paidDate: payment.transactionDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status || 'pending',
        createdAt: payment.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: formattedPayments,
    });
  } catch (error: any) {
    console.error('❌ Error fetching landlord payments:', error.message);
    return next(error);
  }
});

/**
 * GET /api/v1/payments/agent-payments
 * Get all payments for properties managed by agent
 */
router.get('/agent-payments', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'agent') {
      throw new AuthorizationError('Only agents can view agent payments');
    }

    console.log('📊 Fetching payments for agent:', req.user.userId);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const leaseRepo = AppDataSource.getRepository(Lease);

    // Get all leases for properties this agent manages
    const leases = await leaseRepo
      .createQueryBuilder('lease')
      .leftJoinAndSelect('lease.property', 'property')
      .where('property.agentId = :agentId', { agentId: req.user.userId })
      .getMany();

    const leaseIds = leases.map((lease) => lease.id);

    // If no leases, return empty array
    if (leaseIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No payments found',
        data: [],
      });
    }

    // Get all payments for these leases
    const payments = await paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.lease', 'lease')
      .leftJoinAndSelect('lease.property', 'property')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .where('payment.leaseId IN (:...leaseIds)', { leaseIds })
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    console.log(`✅ Retrieved ${payments.length} payments for agent`);

    // Format response
    const formattedPayments = payments.map((payment) => {
      const tenantName = payment.lease?.tenant 
        ? `${payment.lease.tenant.firstName || ''} ${payment.lease.tenant.lastName || ''}`.trim() 
        : 'Unknown Tenant';
      
      return {
        id: payment.id,
        leaseId: payment.leaseId,
        property: payment.lease?.property?.name || 'Unknown Property',
        tenant: tenantName,
        amount: payment.amount,
        dueDate: payment.lease?.startDate,
        paidDate: payment.transactionDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status || 'pending',
        createdAt: payment.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: formattedPayments,
    });
  } catch (error: any) {
    console.error('❌ Error fetching agent payments:', error.message);
    return next(error);
  }
});

/**
 * GET /api/v1/payments/landlord-report
 * Get landlord monthly tenant payment report (cleared vs pending balances)
 * Query params: ?month=4&year=2026
 */
router.get('/landlord-report', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || req.user.role !== 'landlord') {
      throw new AuthorizationError('Only landlords can view landlord reports');
    }

    const now = new Date();
    const month = parseInt((req.query.month as string) || `${now.getMonth() + 1}`, 10);
    const year = parseInt((req.query.year as string) || `${now.getFullYear()}`, 10);

    if (Number.isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'month must be between 1 and 12',
      });
    }

    if (Number.isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'year must be between 2000 and 2100',
      });
    }

    const leaseRepo = AppDataSource.getRepository(Lease);
    const breakdownRepo = AppDataSource.getRepository(MonthlyRentBreakdown);

    const leases = await leaseRepo
      .createQueryBuilder('lease')
      .leftJoinAndSelect('lease.property', 'property')
      .leftJoinAndSelect('lease.tenant', 'tenant')
      .where('property.landlordId = :landlordId', { landlordId: req.user.userId })
      .andWhere('lease.status = :status', { status: 'active' })
      .getMany();

    const leaseIds = leases.map((lease) => lease.id);
    if (leaseIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active leases found for this landlord',
        data: {
          month,
          year,
          summary: {
            totalTenants: 0,
            clearedCount: 0,
            pendingCount: 0,
            totalDue: 0,
            totalPaid: 0,
            totalBalance: 0,
          },
          tenants: [],
        },
      });
    }

    const breakdowns = await breakdownRepo
      .createQueryBuilder('breakdown')
      .where('breakdown.leaseId IN (:...leaseIds)', { leaseIds })
      .andWhere('breakdown.month = :month', { month })
      .andWhere('breakdown.year = :year', { year })
      .getMany();

    const breakdownByLeaseId = new Map<string, MonthlyRentBreakdown>();
    for (const breakdown of breakdowns) {
      breakdownByLeaseId.set(breakdown.leaseId, breakdown);
    }

    const tenantRows = leases.map((lease) => {
      const breakdown = breakdownByLeaseId.get(lease.id);
      const totalDue = Number(breakdown?.totalDue || 0);
      const amountPaid = Number(breakdown?.amountPaid || 0);
      const balance = Math.max(0, totalDue - amountPaid);
      const paymentStatus = balance <= 0 && totalDue > 0 ? 'cleared' : 'pending';

      return {
        leaseId: lease.id,
        tenantId: lease.tenantId,
        tenantName: `${lease.tenant?.firstName || ''} ${lease.tenant?.lastName || ''}`.trim() || 'Unknown Tenant',
        tenantPhone: lease.tenant?.phoneNumber || null,
        propertyId: lease.propertyId,
        propertyName: lease.property?.name || 'Unknown Property',
        invoice: breakdown ? {
          invoiceId: breakdown.id,
          month: breakdown.month,
          year: breakdown.year,
          totalDue,
          amountPaid,
          balance,
          status: breakdown.status,
          dueDate: breakdown.dueDate,
        } : null,
        paymentStatus,
      };
    });

    const totalDue = tenantRows.reduce((sum, row) => sum + (row.invoice?.totalDue || 0), 0);
    const totalPaid = tenantRows.reduce((sum, row) => sum + (row.invoice?.amountPaid || 0), 0);
    const totalBalance = tenantRows.reduce((sum, row) => sum + (row.invoice?.balance || 0), 0);
    const clearedCount = tenantRows.filter((row) => row.paymentStatus === 'cleared').length;
    const pendingCount = tenantRows.length - clearedCount;

    return res.status(200).json({
      success: true,
      message: 'Landlord monthly report retrieved successfully',
      data: {
        month,
        year,
        summary: {
          totalTenants: tenantRows.length,
          clearedCount,
          pendingCount,
          totalDue,
          totalPaid,
          totalBalance,
        },
        tenants: tenantRows,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching landlord monthly report:', error.message);
    return next(error);
  }
});

export default router;
