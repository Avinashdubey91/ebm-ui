import * as signalR from "@microsoft/signalr";
import type { NotificationItem } from "../types/notification";

let connection: signalR.HubConnection | null = null;

const isTokenExpired = (token: string): boolean => {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch {
    return true;
  }
};

const bindReceiveNotification = (
  conn: signalR.HubConnection,
  onReceive: (notification: NotificationItem) => void,
) => {
  conn.off("ReceiveNotification");
  conn.on("ReceiveNotification", (notification: NotificationItem) => {
    console.log("📥 SignalR: Notification received", notification);
    onReceive(notification);
  });
};

export const startNotificationConnection = async (
  onReceive: (notification: NotificationItem) => void,
  token: string,
) => {
  if (!token || isTokenExpired(token)) {
    console.warn("⛔ No valid token or token expired — aborting SignalR");
    return;
  }

  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(
        `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "")}/notificationHub`,
        {
          accessTokenFactory: () => token,
        },
      )
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  bindReceiveNotification(connection, onReceive);

  if (connection.state === signalR.HubConnectionState.Connected) {
    console.log("ℹ️ SignalR already connected.");
    return;
  }

  if (connection.state === signalR.HubConnectionState.Connecting) {
    console.log("🔄 SignalR is currently connecting...");
    return;
  }

  try {
    await connection.start();
    console.log("✅ SignalR connected");
  } catch (err) {
    console.error("❌ SignalR failed to connect:", err);
  }
};

export const stopNotificationConnection = async () => {
  if (connection) {
    try {
      connection.off("ReceiveNotification");

      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
        console.log("🔌 SignalR disconnected.");
      }
    } catch (err) {
      console.error("❌ Error stopping SignalR", err);
    } finally {
      connection = null;
    }
  }
};