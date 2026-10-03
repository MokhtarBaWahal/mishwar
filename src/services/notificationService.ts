import { AppNotification } from '../../packages/shared_types/src';

class NotificationService {
  private notifications: AppNotification[] = [
    {
      id: 'notif_welcome',
      userId: 'cust_01',
      title: 'مرحباً بك في مشوار! 🚀',
      message: 'أول منصة نقل ذكي متكاملة لخدمتك في شوارع صنعاء وعدن. نتمنى لك رحلات آمنة ومريحة.',
      type: 'PROMO',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      isRead: true
    },
    {
      id: 'notif_pilot_bonus',
      userId: 'cust_01',
      title: 'رصيد ترحيبي تجريبي',
      message: 'تم إضافة 15,000 ريال يمني إلى محفظتك الإلكترونية لتجربة حجز المشاوير.',
      type: 'PAYMENT',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      isRead: false
    }
  ];

  getUserNotifications(userId: string): AppNotification[] {
    return this.notifications.filter((n) => n.userId === userId || n.userId === 'ALL');
  }

  sendNotification(data: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
    const newNotif: AppNotification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  async sendPushOrInApp(data: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): Promise<AppNotification> {
    // FCM hook point: keep in-app delivery as the reliable local fallback.
    return this.sendNotification(data);
  }

  getPushChannelStatus(): {
    provider: 'Firebase Cloud Messaging';
    configured: boolean;
    mode: 'IN_APP_FALLBACK' | 'FCM_READY';
    supportedEvents: string[];
  } {
    const configured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID);
    return {
      provider: 'Firebase Cloud Messaging',
      configured,
      mode: configured ? 'FCM_READY' : 'IN_APP_FALLBACK',
      supportedEvents: ['RIDE_ACCEPTED', 'DRIVER_ARRIVED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'SOS', 'PROMO']
    };
  }

  markAsRead(notificationId: string): void {
    const found = this.notifications.find((n) => n.id === notificationId);
    if (found) {
      found.isRead = true;
    }
  }

  markAllAsRead(userId: string): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === 'ALL') {
        n.isRead = true;
      }
    });
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter((n) => (n.userId === userId || n.userId === 'ALL') && !n.isRead).length;
  }
}

export const notificationService = new NotificationService();
