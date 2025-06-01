import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { NotificationProvider } from './context/NotificationProvider';
import { DashboardProvider } from './features/dashboard/context/DashboardProvider'; // ✅ Import this
import AppEntry from './AppEntry';
import './styles/_forms.scss';
import './styles/_listing.scss';
import './styles/_common.scss';
import 'animate.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <DashboardProvider>
        <AppEntry />
      </DashboardProvider>
    </NotificationProvider>
  </StrictMode>
);

