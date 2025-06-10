import React, { useEffect, useState } from 'react';
import { NotificationContext } from './NotificationContext';
import { startNotificationConnection } from '../api/signalR';
import { fetchUserNotifications } from '../api/notificationApi';
import type { NotificationItem } from '../types/notification';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // 🔄 Check login state changes
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (token && userId) {
        setIsReady(true); // ✅ Now ready to start SignalR
        clearInterval(interval);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      console.warn('⛔ Token or userId missing — skipping SignalR init');
      return;
    }

    fetchUserNotifications(userId)
      .then(setNotifications)
      .catch(console.error);

    startNotificationConnection((notification: NotificationItem) => {
      console.log('📥 Received SignalR notification:', notification);
      setNotifications(prev => {
        if (prev.some(n => n.notificationId === notification.notificationId)) return prev;
        return [notification, ...prev];
      });
    });
  }, [isReady]); // ✅ Only when ready

  return isReady ?(
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  ) : null;
};
