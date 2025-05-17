export interface SideNavigationSubMenuDTO {
  sideNavigationSubMenuId: number;
  sideNavigationMenuId: number;
  subMenuName: string;
  routePath?: string;
  componentName?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SideNavigationMenuDTO {
  sideNavigationMenuId: number;
  menuName: string;
  iconClass: string;
  routePath?: string;
  sortOrder: number;
  isActive: boolean;
  subMenus?: SideNavigationSubMenuDTO[];
}
