// src/context/NotificationProvider.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { NotificationContext } from "./NotificationContext";
import { startNotificationConnection } from "../api/signalR";
import { fetchUserNotifications } from "../api/notificationApi";
import type { NotificationItem } from "../types/notification";
import { UseAuth } from "./UseAuth";
import { useMenuData } from "../features/dashboard/hooks/useMenuData";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, userId, isAuthenticated, isReady } = UseAuth();
  const { loading: menuLoading } = useMenuData();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/login") return;
    if (!isReady || !isAuthenticated || !token || !userId || menuLoading)
      return;

    let isMounted = true;

    const initializeNotifications = async () => {
      try {
        const items = await fetchUserNotifications(userId);
        if (isMounted) {
          setNotifications(items);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }

      await startNotificationConnection((notification: NotificationItem) => {
        if (!isMounted) return;

        setNotifications((prev) =>
          prev.some((n) => n.notificationId === notification.notificationId)
            ? prev
            : [notification, ...prev],
        );
      }, token);
    };

    void initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, [pathname, isReady, isAuthenticated, token, userId, menuLoading]);

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
