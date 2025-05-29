// src/features/dashboard/context/useDashboardContext.ts
import { useContext } from 'react';
import { DashboardContext } from './DashboardContext';
import type { UserContextType } from './DashboardContext';

export const useDashboardContext = (): UserContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};
