import type { NotificationItem } from '../types/notification';
export interface NotificationContextProps {
    notifications: NotificationItem[];
    setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}
export declare const NotificationContext: import("react").Context<NotificationContextProps>;
