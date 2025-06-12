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
import { AuthProvider } from './context/AuthProvider';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={{ token: { fontFamily: "Segoe UI" } }}>
      <AuthProvider>
        <DashboardProvider>
          <MenuProvider>
            <AppEntry /> {/* ✅ Only AppEntry here, NotificationProvider moved inside */}
          </MenuProvider>
        </DashboardProvider>
      </AuthProvider>
    </ConfigProvider>
  </StrictMode>
);
