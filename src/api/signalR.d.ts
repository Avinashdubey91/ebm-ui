import type { NotificationItem } from "../types/notification";
export declare const startNotificationConnection: (onReceive: (notification: NotificationItem) => void, token: string) => Promise<void>;
export declare const stopNotificationConnection: () => Promise<void>;
