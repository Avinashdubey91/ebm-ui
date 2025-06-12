// src/AppEntry.tsx
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./layouts/AppRoutes";
import { NotificationProvider } from "./context/NotificationProvider"; // ✅ Move this here

const AppEntry = () => (
  <BrowserRouter>
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  </BrowserRouter>
);

export default AppEntry;
