import httpClient from './httpClient';
import type { NotificationItem } from '../types/notification';

export const fetchUserNotifications = async (userId: string): Promise<NotificationItem[]> => {
  const response = await httpClient.get<NotificationItem[]>(`/notification/Get-All-By-User/${userId}`);
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  return httpClient.put(`/notification/Mark-As-Read/${id}`, null, {
    headers: {
        'X-User-Id': userId ?? '',
        'X-User-Name': username ?? ''
    }
  });
};

// ✅ Mark all as read
export const markAllNotificationsAsRead = async (userId: string) => {
  return httpClient.put(`/notification/Mark-All-Read/${userId}`);
};

// ✅ Mark all as unread
export const markAllNotificationsAsUnread = async (userId: string) => {
  return httpClient.put(`/notification/Mark-All-Unread/${userId}`);
};

