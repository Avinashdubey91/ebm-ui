import { createContext } from 'react';

export type NotificationItem = {
  message: string;
  type: string;
};

export interface NotificationContextProps {
  notifications: NotificationItem[];
}

export const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
});
