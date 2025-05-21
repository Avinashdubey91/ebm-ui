import React, { useEffect, useState } from 'react';
import { NotificationContext } from './NotificationContext';
import { startNotificationConnection } from '../api/signalR';
import { fetchUserNotifications } from '../api/notificationApi';
import type { NotificationItem } from '../types/notification';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchUserNotifications(userId)
        .then(setNotifications)
        .catch(console.error);
    }

    startNotificationConnection((notification: NotificationItem) => {
      console.log("📥 Received SignalR notification:", notification);
      setNotifications((prev) => {
        if (prev.some(n => n.notificationId === notification.notificationId)) return prev;
        return [notification, ...prev]; // ⬅️ Fix: add new notification to top
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
