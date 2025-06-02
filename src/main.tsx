import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { NotificationProvider } from './context/NotificationProvider';
import { DashboardProvider } from './features/dashboard/context/DashboardProvider';
import AppEntry from './AppEntry';
import './styles/_common.scss';
import './styles/_listing.scss';
import './styles/_forms.scss';
import 'animate.css';
import "react-datepicker/dist/react-datepicker.css"; // still needed for react-datepicker if used
import { ConfigProvider } from "antd";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "Segoe UI", // or your app-wide font
        },
      }}
    >
      <NotificationProvider>
        <DashboardProvider>
          <AppEntry />
        </DashboardProvider>
      </NotificationProvider>
    </ConfigProvider>
  </StrictMode>
);
