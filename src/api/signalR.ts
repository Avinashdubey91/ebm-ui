import * as signalR from '@microsoft/signalr';
import type { NotificationItem } from '../types/notification';

let connection: signalR.HubConnection;

const isTokenExpired = (token: string): boolean => {
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch {
    return true;
  }
};

export const startNotificationConnection = (onReceive: (notification: NotificationItem) => void) => {
  const token = localStorage.getItem('token');

  if (!token || isTokenExpired(token)) {
    console.warn('⛔ No valid token found or token expired — aborting SignalR connection');
    return;
  }

  console.log("🧪 [SignalR] Token used in accessTokenFactory:", token);

  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:5001/notificationHub', {
      accessTokenFactory: () => token
    })
    .withAutomaticReconnect()
    .build();

  connection
    .start()
    .then(() => console.log('✅ SignalR connected'))
    .catch((err) => console.error('❌ SignalR connection failed:', err));

  connection.on('ReceiveNotification', (notification: NotificationItem) => {
    onReceive(notification);
  });
};