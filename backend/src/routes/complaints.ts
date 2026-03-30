import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { complaintService } from '../services/ComplaintService';
import { notificationService } from '../services/NotificationService';
import { ValidationError, AuthorizationError, AuthenticationError } from '../errors/AppError';

const router = Router();

/**
 * POST /api/v1/complaints
 * Create a new complaint (by tenant)
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('📝 Creating complaint for user:', req.user?.userId);

    if (!req.user) {
      throw new AuthenticationError('No user context found');
    }

    if (req.user.role !== 'tenant') {
      throw new AuthorizationError('Only tenants can create complaints');
    }

    const { leaseId, title, description, complaintType, attachmentUrls } = req.body;

    if (!leaseId || !title || !description || !complaintType) {
      throw new ValidationError('leaseId, title, description, and complaintType are required', {
        received: { leaseId, title, description, complaintType },
      });
    }

    const complaint = await complaintService.createComplaint({
      leaseId,
      tenantId: req.user.userId,
      title,
      description,
      complaintType,
      attachmentUrls,
    });

    // Send notification to landlord about new complaint
    try {
      await notificationService.sendNotification({
        userId: complaint.landlordId,
        title: 'New Complaint Received',
        message: `New complaint: "${complaint.title}" from tenant on lease ${complaint.leaseId}`,
        notificationType: 'complaint_received',
        relatedEntityId: complaint.id,
        relatedEntityType: 'complaint',
      });
      console.log('✅ Complaint notification sent to landlord');
    } catch (notifError: any) {
      console.warn('⚠️ Failed to send complaint notification:', notifError.message);
    }

    console.log('✅ Complaint created successfully');
    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint,
    });
  } catch (error: any) {
    console.error('❌ Complaint creation error:', error.message);
    return next(error);
  }
});

/**
 * GET /api/v1/complaints/my-complaints
 * Get all complaints for the authenticated user (tenant or landlord)
 */
router.get('/my-complaints', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('📋 Fetching complaints for user:', req.user?.userId);

    if (!req.user) {
      throw new AuthorizationError('No user context found');
    }

    let complaints;

    if (req.user.role === 'tenant') {
      // Tenants see their submitted complaints
      complaints = await complaintService.getTenantComplaints(req.user.userId);
    } else if (req.user.role === 'landlord' || req.user.role === 'agent') {
      // Landlords/agents see complaints for their properties
      complaints = await complaintService.getLandlordComplaints(req.user.userId);
    } else {
      throw new AuthorizationError('You do not have permission to view complaints');
    }

    console.log(`✅ Retrieved ${complaints.length} complaints`);
    return res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: {
        complaints,
        count: complaints.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Fetch complaints error:', error.message);
    return next(error);
  }
});

/**
 * GET /api/v1/complaints/:complaintId
 * Get a specific complaint
 */
router.get('/:complaintId', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('📋 Fetching complaint:', req.params.complaintId);

    if (!req.user) {
      throw new AuthorizationError('No user context found');
    }

    const complaint = await complaintService.getComplaintById(req.params.complaintId);

    // Check authorization
    if (
      req.user.role === 'tenant' && complaint.tenantId !== req.user.userId ||
      (req.user.role === 'landlord' || req.user.role === 'agent') && complaint.landlordId !== req.user.userId
    ) {
      throw new AuthorizationError('You do not have permission to view this complaint');
    }

    console.log('✅ Complaint retrieved');
    return res.status(200).json({
      success: true,
      message: 'Complaint retrieved successfully',
      data: complaint,
    });
  } catch (error: any) {
    console.error('❌ Fetch complaint error:', error.message);
    return next(error);
  }
});

/**
 * PATCH /api/v1/complaints/:complaintId/status
 * Update complaint status (by landlord/agent)
 */
router.patch(
  '/:complaintId/status',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log('📝 Updating complaint status:', req.params.complaintId);

      if (!req.user) {
        throw new AuthorizationError('No user context found');
      }

      if (req.user.role !== 'landlord' && req.user.role !== 'agent') {
        throw new AuthorizationError('Only landlords/agents can update complaint status');
      }

      const { status } = req.body;

      if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        throw new ValidationError('Valid status is required', { received: { status } });
      }

      const complaint = await complaintService.getComplaintById(req.params.complaintId);

      // Check authorization
      if (complaint.landlordId !== req.user.userId) {
        throw new AuthorizationError('You do not have permission to update this complaint');
      }

      const updated = await complaintService.updateComplaintStatus(req.params.complaintId, status);

      // Send notification to tenant about status update
      try {
        const statusMessages: Record<string, string> = {
          in_progress: 'Your complaint is being addressed',
          resolved: 'Your complaint has been resolved',
          closed: 'Your complaint has been closed',
        };

        if (statusMessages[status]) {
          await notificationService.sendNotification({
            userId: complaint.tenantId,
            title: 'Complaint Status Updated',
            message: `${statusMessages[status]}: "${complaint.title}"`,
            notificationType: 'complaint_status_updated',
            relatedEntityId: complaint.id,
            relatedEntityType: 'complaint',
          });
          console.log('✅ Status update notification sent to tenant');
        }
      } catch (notifError: any) {
        console.warn('⚠️ Failed to send status notification:', notifError.message);
      }

      console.log('✅ Complaint status updated');
      return res.status(200).json({
        success: true,
        message: 'Complaint status updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('❌ Update complaint error:', error.message);
      return next(error);
    }
  }
);

/**
 * GET /api/v1/complaints/stats
 * Get complaint statistics (by landlord)
 */
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    console.log('📊 Fetching complaint stats for user:', req.user?.userId);

    if (!req.user) {
      throw new AuthorizationError('No user context found');
    }

    if (req.user.role !== 'landlord' && req.user.role !== 'agent') {
      throw new AuthorizationError('Only landlords/agents can view complaint statistics');
    }

    const stats = await complaintService.getComplaintStats(req.user.userId);

    console.log('✅ Stats retrieved');
    return res.status(200).json({
      success: true,
      message: 'Complaint statistics retrieved successfully',
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Fetch stats error:', error.message);
    return next(error);
  }
});

export default router;
