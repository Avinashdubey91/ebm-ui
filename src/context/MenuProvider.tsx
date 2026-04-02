import React, { useState } from 'react';
import { MenuContext } from './MenuContext';
import type { SideNavigationMenuDTO } from '../types/menuTypes';
import { useMenuData } from '../features/dashboard/hooks/useMenuData';

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMenu, setCurrentMenu] = useState<SideNavigationMenuDTO | null>(null);
  const { menus, loading, isAuthenticated } = useMenuData();

  return (
    <MenuContext.Provider
      value={{
        currentMenu,
        setCurrentMenu,
        menus,
        loading,
        isAuthenticated
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};