import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from '../types/menuTypes';
export declare const fetchSideMenus: () => Promise<SideNavigationMenuDTO[]>;
export declare const fetchSubMenus: () => Promise<SideNavigationSubMenuDTO[]>;
