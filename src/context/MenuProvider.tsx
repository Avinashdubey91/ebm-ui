import React, { useState } from 'react';
import { MenuContext } from './MenuContext';
import type { SideNavigationMenuDTO } from '../types/menuTypes';

export type MenuContextType = {
  currentMenu: SideNavigationMenuDTO | null;
  setCurrentMenu: (menu: SideNavigationMenuDTO | null) => void;
};

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMenu, setCurrentMenu] = useState<SideNavigationMenuDTO | null>(null);

  return (
    <MenuContext.Provider value={{ currentMenu, setCurrentMenu }}>
      {children}
    </MenuContext.Provider>
  );
};
