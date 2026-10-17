import React, { useEffect, useState } from 'react';
import type { NotificationItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './useAuth';
import { NotificationContext } from './notificationContextValue';

interface NotificationData {
  userId: string | null;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
}

const emptyData: NotificationData = { userId: null, notifications: [], unreadCount: 0, loading: false };

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<NotificationData>(emptyData);
  const userId = user?.id || null;
  const visibleData = data.userId === userId ? data : emptyData;

  const refreshNotifications = async () => {
    if (!userId) return;
    setData((current) => ({ ...(current.userId === userId ? current : emptyData), userId, loading: true }));
    try {
      const response = await api.get<{ success: boolean; unread_count: number; notifications: NotificationItem[] }>('/notifications');
      setData({
        userId,
        notifications: response.notifications || [],
        unreadCount: response.unread_count || 0,
        loading: false
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setData((current) => current.userId === userId ? { ...current, loading: false } : current);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let active = true;
    api.get<{ success: boolean; unread_count: number; notifications: NotificationItem[] }>('/notifications')
      .then((response) => {
        if (active) {
          setData({
            userId,
            notifications: response.notifications || [],
            unreadCount: response.unread_count || 0,
            loading: false
          });
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch notifications:', error);
        if (active) setData((current) => current.userId === userId ? { ...current, loading: false } : current);
      });
    return () => { active = false; };
  }, [userId]);

  const markAsRead = async (id: string) => {
    if (!userId) return;
    try {
      await api.patch(`/notifications/${id}/read`);
      setData((current) => current.userId === userId ? {
        ...current,
        notifications: current.notifications.map((item) => item.id === id ? { ...item, is_read: 1 } : item),
        unreadCount: Math.max(0, current.unreadCount - 1)
      } : current);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await api.patch('/notifications/read-all');
      setData((current) => current.userId === userId ? {
        ...current,
        notifications: current.notifications.map((item) => ({ ...item, is_read: 1 })),
        unreadCount: 0
      } : current);
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications: visibleData.notifications,
      unreadCount: visibleData.unreadCount,
      loading: visibleData.loading,
      refreshNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
