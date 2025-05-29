import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { NotificationProvider } from './context/NotificationProvider';
import { DashboardProvider } from './features/dashboard/context/DashboardProvider'; // ✅ Import this
import AppEntry from './AppEntry';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <DashboardProvider>
        <AppEntry />
      </DashboardProvider>
    </NotificationProvider>
  </StrictMode>
);

