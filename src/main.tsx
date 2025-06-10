import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { DashboardProvider } from './features/dashboard/context/DashboardProvider';
import { MenuProvider } from './context/MenuProvider';
import AppEntry from './AppEntry';
import './styles/_common.scss';
import './styles/_listing.scss';
import './styles/_forms.scss';
import 'animate.css';
import "react-datepicker/dist/react-datepicker.css";
import { ConfigProvider } from "antd";
import { NotificationProvider } from './context/NotificationProvider';

const token = localStorage.getItem('token');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={{ token: { fontFamily: "Segoe UI" } }}>
      <DashboardProvider>
        <MenuProvider>
          {token ? (
            <NotificationProvider>
              <AppEntry />
            </NotificationProvider>
          ) : (
            <AppEntry />
          )}
        </MenuProvider>
      </DashboardProvider>
    </ConfigProvider>
  </StrictMode>
);
