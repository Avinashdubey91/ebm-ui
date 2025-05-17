import { createContext, useContext } from 'react';
import '../dashboard.css';

export interface UserContextType {
  name: string;
  role: string;
  status: 'Online' | 'Offline';
  image: string;
  setStatus: (status: 'Online' | 'Offline') => void;
}

export const DashboardContext = createContext<UserContextType | null>(null);

export const useDashboardContext = (): UserContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardContext.Provider');
  }
  return context;
};
