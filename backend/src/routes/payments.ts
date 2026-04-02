import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AuthorizationError, AuthenticationError } from '../errors/AppError';
import { AppDataSource } from '../config/database';
import { Payment } from '../entities/payment/Payment';
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

export default router;
