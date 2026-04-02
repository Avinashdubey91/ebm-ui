import { createContext } from 'react';
import type { SideNavigationMenuDTO } from '../types/menuTypes';

export type MenuContextType = {
  currentMenu: SideNavigationMenuDTO | null;
  setCurrentMenu: (menu: SideNavigationMenuDTO | null) => void;
  menus: SideNavigationMenuDTO[];
  loading: boolean;
  isAuthenticated: boolean;
};

export const MenuContext = createContext<MenuContextType | undefined>(undefined);