// src/context/NotificationProvider.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NotificationContext } from './NotificationContext';
import { startNotificationConnection } from '../api/signalR';
import { fetchUserNotifications } from '../api/notificationApi';
import type { NotificationItem } from '../types/notification';
import { UseAuth } from './UseAuth';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, userId, isAuthenticated, isReady } = UseAuth();
  const { loading: menuLoading } = useMenuData();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { pathname } = useLocation();

  useEffect(() => {
    // ✅ Safe to skip inside the hook — avoids ESLint violation
    if (pathname === "/login") {
      console.log("🚫 Skipping Notification setup on /login");
      return;
    }

    if (!isReady || !isAuthenticated || !token || !userId || menuLoading) {
      console.log("⏳ Notification setup pending:", {
        isReady, isAuthenticated, token, userId, menuLoading
      });
      return;
    }

    console.log("✅ Initializing SignalR notification setup");

    fetchUserNotifications(userId)
      .then(setNotifications)
      .catch(console.error);

    startNotificationConnection((notification: NotificationItem) => {
      setNotifications(prev =>
        prev.some(n => n.notificationId === notification.notificationId)
          ? prev
          : [notification, ...prev]
      );
    }, token);
  }, [pathname, isReady, isAuthenticated, token, userId, menuLoading]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
