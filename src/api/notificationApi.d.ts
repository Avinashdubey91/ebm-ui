import type { NotificationItem } from '../types/notification';
export declare const fetchUserNotifications: (userId: string) => Promise<NotificationItem[]>;
export declare const markNotificationAsRead: (id: number) => Promise<Axios.AxiosXHR<unknown>>;
export declare const markAllNotificationsAsRead: (userId: string) => Promise<Axios.AxiosXHR<unknown>>;
export declare const markAllNotificationsAsUnread: (userId: string) => Promise<Axios.AxiosXHR<unknown>>;
