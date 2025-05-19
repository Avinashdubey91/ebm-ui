import React, { useEffect, useState } from 'react';
import { NotificationContext, type NotificationItem } from './NotificationContext';
import { startNotificationConnection } from '../api/signalR';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    startNotificationConnection((message: string, type: string) => {
      setNotifications((prev) => [...prev, { message, type }]);
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
