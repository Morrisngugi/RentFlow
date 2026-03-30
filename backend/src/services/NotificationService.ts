import { Notification } from '../entities/notification/Notification';
import { NotificationPreference } from '../entities/notification/NotificationPreference';
import { AppDataSource } from '../config/database';
import { DeepPartial } from 'typeorm';

export interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private preferenceRepository = AppDataSource.getRepository(NotificationPreference);

  /**
   * Send a notification to a user
   */
  async sendNotification(params: SendNotificationParams): Promise<NotificationResponse> {
    const notificationData: DeepPartial<Notification> = {
      userId: params.userId,
      title: params.title,
      message: params.message,
      notificationType: params.notificationType,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      isRead: false,
    };

    const notification = this.notificationRepository.create(notificationData);

    const savedNotificationResult = await this.notificationRepository.save(notification);
    const savedNotification = Array.isArray(savedNotificationResult) ? savedNotificationResult[0] : savedNotificationResult;

    return {
      id: savedNotification.id,
      userId: savedNotification.userId,
      title: savedNotification.title,
      message: savedNotification.message,
      notificationType: savedNotification.notificationType,
      relatedEntityType: savedNotification.relatedEntityType,
      relatedEntityId: savedNotification.relatedEntityId,
      isRead: savedNotification.isRead,
      createdAt: savedNotification.createdAt,
    };
  }

  /**
   * Send invoice notification to tenant
   */
  async sendInvoiceNotification(
    tenantId: string,
    invoiceData: {
      leaseId: string;
      totalDue: number;
      dueDate: Date;
      breakdownId: string;
    }
  ): Promise<NotificationResponse> {
    const dueDate = new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.sendNotification({
      userId: tenantId,
      title: 'Invoice Generated',
      message: `Your invoice of KES ${invoiceData.totalDue.toLocaleString()} has been generated and is due on ${dueDate}.`,
      notificationType: 'invoice_generated',
      relatedEntityType: 'invoice',
      relatedEntityId: invoiceData.breakdownId,
    });
  }

  /**
   * Send payment notification to tenant
   */
  async sendPaymentNotification(
    tenantId: string,
    paymentData: {
      amountPaid: number;
      balance: number;
      paymentDate: Date;
      status: 'paid' | 'partial' | 'overpaid';
    }
  ): Promise<NotificationResponse> {
    const paymentDate = new Date(paymentData.paymentDate).toLocaleDateString('en-US');
    
    let message = '';
    if (paymentData.status === 'paid') {
      message = `Payment of KES ${paymentData.amountPaid.toLocaleString()} received on ${paymentDate}. Your account is now settled.`;
    } else if (paymentData.status === 'partial') {
      message = `Payment of KES ${paymentData.amountPaid.toLocaleString()} received on ${paymentDate}. Balance remaining: KES ${paymentData.balance.toLocaleString()}.`;
    } else if (paymentData.status === 'overpaid') {
      message = `Payment of KES ${paymentData.amountPaid.toLocaleString()} received on ${paymentDate}. Overpayment: KES ${Math.abs(paymentData.balance).toLocaleString()}.`;
    }

    return this.sendNotification({
      userId: tenantId,
      title: 'Payment Received',
      message,
      notificationType: 'payment_received',
      relatedEntityType: 'payment',
    });
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string,
    filters?: {
      isRead?: boolean;
      notificationType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationResponse[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (filters?.isRead !== undefined) {
      query.andWhere('notification.isRead = :isRead', { isRead: filters.isRead });
    }

    if (filters?.notificationType) {
      query.andWhere('notification.notificationType = :notificationType', {
        notificationType: filters.notificationType,
      });
    }

    query.orderBy('notification.createdAt', 'DESC');

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const notifications = await query.getMany();

    return notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      notificationType: n.notificationType,
      relatedEntityType: n.relatedEntityType,
      relatedEntityId: n.relatedEntityId,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse | null> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    const savedNotification = await this.notificationRepository.save(notification);

    return {
      id: savedNotification.id,
      userId: savedNotification.userId,
      title: savedNotification.title,
      message: savedNotification.message,
      notificationType: savedNotification.notificationType,
      relatedEntityType: savedNotification.relatedEntityType,
      relatedEntityId: savedNotification.relatedEntityId,
      isRead: savedNotification.isRead,
      readAt: savedNotification.readAt,
      createdAt: savedNotification.createdAt,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return result.affected || 0;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await this.notificationRepository.delete({ id: notificationId });
    return (result.affected || 0) > 0;
  }

  /**
   * Delete all notifications for a user
   */
  async deleteUserNotifications(userId: string): Promise<number> {
    const result = await this.notificationRepository.delete({ userId });
    return result.affected || 0;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.countBy({
      userId,
      isRead: false,
    });
  }

  /**
   * Get or create notification preference for a user
   */
  async getOrCreatePreference(userId: string): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({ userId });
      await this.preferenceRepository.save(preference);
    }

    return preference;
  }

  /**
   * Update notification preference
   */
  async updatePreference(userId: string, updates: Partial<NotificationPreference>): Promise<NotificationPreference> {
    let preference = await this.getOrCreatePreference(userId);

    Object.assign(preference, updates);
    await this.preferenceRepository.save(preference);

    return preference;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
