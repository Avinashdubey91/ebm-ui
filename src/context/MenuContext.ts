import { createContext } from 'react';
import type { MenuContextType } from './MenuProvider';

export const MenuContext = createContext<MenuContextType | undefined>(undefined);
