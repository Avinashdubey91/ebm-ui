import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { NotificationProvider } from './context/NotificationProvider';
import AppEntry from './AppEntry'; // ✅ imported properly

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotificationProvider>
      <AppEntry />
    </NotificationProvider>
  </StrictMode>
);