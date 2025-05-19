import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection;

export const startNotificationConnection = (
  onReceive: (message: string, type: string) => void
) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl('https://localhost:5001/notificationHub') // ⬅ adjust if hosted differently
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveNotification', onReceive);

  connection
    .start()
    .then(() => console.log('✅ SignalR Connected'))
    .catch((err) => console.error('❌ SignalR Error:', err));
};

export const stopNotificationConnection = () => {
  if (connection) {
    connection.stop();
  }
};
