// src/features/dashboard/context/DashboardProvider.tsx
import React, { useState, useEffect } from 'react';
import { DashboardContext } from './DashboardContext';
import type { UserContextType } from './DashboardContext';

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatusState] = useState<'Online' | 'Offline'>('Offline');

  const setStatus = (newStatus: 'Online' | 'Offline') => {
    setStatusState(newStatus);
    localStorage.setItem('status', newStatus); // 🔁 keep in sync
  };

  useEffect(() => {
    const saved = localStorage.getItem('status');
    if (saved === 'Online' || saved === 'Offline') {
      setStatusState(saved);
    }
  }, []);

  const contextValue: UserContextType = {
    name: '',
    role: '',
    status,
    image: '',
    setStatus
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};
