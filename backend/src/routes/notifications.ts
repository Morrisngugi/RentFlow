import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, checkUserActive } from '../middleware/auth';
import { notificationService } from '../services/NotificationService';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get all notifications for the authenticated user
 * Query params: ?isRead=false&limit=20&offset=0
 */
router.get('/', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📬 [GET /notifications] Fetching notifications for user:', req.user?.userId);

    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { isRead, notificationType, limit = 20, offset = 0 } = req.query;

    const notifications = await notificationService.getUserNotifications(req.user.userId, {
      isRead: isRead ? isRead === 'false' ? false : true : undefined,
      notificationType: notificationType as string,
      limit: parseInt(limit as string) || 20,
      offset: parseInt(offset as string) || 0,
    });

    const unreadCount = await notificationService.getUnreadCount(req.user.userId);

    console.log(`✅ [GET /notifications] Retrieved ${notifications.length} notifications`);

    return res.status(200).json({
      message: 'Notifications retrieved successfully',
      data: {
        notifications,
        unreadCount,
        total: notifications.length,
      },
    });
  } catch (error: any) {
    console.error('❌ [GET /notifications] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'NOTIFICATION_FETCH_ERROR',
      },
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count for the authenticated user
 */
router.get('/unread-count', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
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

    const unreadCount = await notificationService.getUnreadCount(req.user.userId);

    return res.status(200).json({
      message: 'Unread count retrieved successfully',
      data: {
        unreadCount,
      },
    });
  } catch (error: any) {
    console.error('❌ [GET /notifications/unread-count] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'UNREAD_COUNT_ERROR',
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📬 [PATCH /notifications/:id/read] Marking notification as read:', req.params.id);

    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const notification = await notificationService.markAsRead(req.params.id);

    if (!notification) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      });
    }

    console.log(`✅ [PATCH /notifications/:id/read] Notification marked as read`);

    return res.status(200).json({
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error: any) {
    console.error('❌ [PATCH /notifications/:id/read] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'NOTIFICATION_UPDATE_ERROR',
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
router.patch('/mark-all-read', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📬 [PATCH /notifications/mark-all-read] Marking all notifications as read for user:', req.user?.userId);

    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const updatedCount = await notificationService.markAllAsRead(req.user.userId);

    console.log(`✅ [PATCH /notifications/mark-all-read] Marked ${updatedCount} notifications as read`);

    return res.status(200).json({
      message: 'All notifications marked as read',
      data: {
        updatedCount,
      },
    });
  } catch (error: any) {
    console.error('❌ [PATCH /notifications/mark-all-read] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'NOTIFICATION_UPDATE_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a single notification
 */
router.delete('/:id', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🗑️ [DELETE /notifications/:id] Deleting notification:', req.params.id);

    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const deleted = await notificationService.deleteNotification(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: {
          status: 404,
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      });
    }

    console.log(`✅ [DELETE /notifications/:id] Notification deleted`);

    return res.status(200).json({
      message: 'Notification deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ [DELETE /notifications/:id] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'NOTIFICATION_DELETE_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/v1/notifications
 * Delete all notifications for the authenticated user
 */
router.delete('/', authenticate, checkUserActive, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🗑️ [DELETE /notifications] Deleting all notifications for user:', req.user?.userId);

    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const deletedCount = await notificationService.deleteUserNotifications(req.user.userId);

    console.log(`✅ [DELETE /notifications] Deleted ${deletedCount} notifications`);

    return res.status(200).json({
      message: 'All notifications deleted successfully',
      data: {
        deletedCount,
      },
    });
  } catch (error: any) {
    console.error('❌ [DELETE /notifications] Error:', error.message);
    return res.status(500).json({
      error: {
        status: 500,
        message: error.message,
        code: 'NOTIFICATION_DELETE_ERROR',
      },
    });
  }
});

export default router;
