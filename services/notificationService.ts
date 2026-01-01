
import { Notification } from '../types';

const STORAGE_KEY = 'agrivision_notifications';

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'system',
    title: 'Deployment Live',
    message: 'Sistem Agri-Vision v1.0.0 telah aktif sepenuhnya di node BBPP Lembang.',
    timestamp: new Date(),
    isRead: false
  },
  {
    id: 'notif-2',
    type: 'update',
    title: 'Imagen 4.0 Integration',
    message: 'Model render Masterpiece kini mendukung kualitas 8K dengan akurasi semantik tinggi.',
    timestamp: new Date(Date.now() - 3600000),
    isRead: false
  },
  {
    id: 'notif-3',
    type: 'announcement',
    title: 'Scholar Node Sync',
    message: 'Sinkronisasi dengan Repositori Kementan kini mencakup dataset hortikultura 2024.',
    timestamp: new Date(Date.now() - 86400000),
    isRead: true
  }
];

export const notificationService = {
  getNotifications: (): Notification[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(data);
    return parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
  },

  markAsRead: (id: string) => {
    const notifs = notificationService.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  markAllAsRead: () => {
    const notifs = notificationService.getNotifications();
    const updated = notifs.map(n => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  clearAll: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  }
};
