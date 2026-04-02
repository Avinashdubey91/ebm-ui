import type { SideNavigationMenuDTO } from "../../../types/menuTypes";
export declare const clearMenuCache: () => void;
export declare const useMenuData: () => {
    menus: SideNavigationMenuDTO[];
    loading: boolean;
    isAuthenticated: boolean;
};
