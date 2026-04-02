import type { SideNavigationMenuDTO } from '../types/menuTypes';
export type MenuContextType = {
    currentMenu: SideNavigationMenuDTO | null;
    setCurrentMenu: (menu: SideNavigationMenuDTO | null) => void;
    menus: SideNavigationMenuDTO[];
    loading: boolean;
    isAuthenticated: boolean;
};
export declare const MenuContext: import("react").Context<MenuContextType | undefined>;
