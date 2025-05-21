import * as signalR from '@microsoft/signalr';
import type { NotificationItem } from '../types/notification';

let connection: signalR.HubConnection;

export const startNotificationConnection = (onReceive: (notification: NotificationItem) => void) => {
  const token = localStorage.getItem('token');

  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:5001/notificationHub', {
      accessTokenFactory: () => token || ''
    })
    .withAutomaticReconnect()
    .build();

  connection.start()
    .then(() => console.log('✅ Connected to SignalR'))
    .catch(err => console.error('❌ Connection failed:', err));

  connection.on('ReceiveNotification', (notification: NotificationItem) => {
    onReceive(notification); // ✅ full DTO with ID, IsRead, etc.
  });
};
