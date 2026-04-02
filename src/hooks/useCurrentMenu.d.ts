import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from "../types/menuTypes";
export declare const useCurrentMenu: () => {
    menu: SideNavigationMenuDTO | undefined;
    submenu: SideNavigationSubMenuDTO | undefined;
    singularMenuName: string;
    pluralMenuName: string;
    parentListPath: string;
    createRoutePath: string;
};
