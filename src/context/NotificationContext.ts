import { createContext } from 'react';
import type { NotificationItem } from '../types/notification';

export interface NotificationContextProps {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  setNotifications: () => {}, // default no-op
});
