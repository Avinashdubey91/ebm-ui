// src/features/dashboard/context/DashboardContext.ts
import { createContext } from 'react';

export interface UserContextType {
  name: string;
  role: string;
  status: 'Online' | 'Offline';
  image: string;
  setStatus: (status: 'Online' | 'Offline') => void;
}

export const DashboardContext = createContext<UserContextType | null>(null);
