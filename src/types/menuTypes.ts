export interface SideNavigationSubMenuDTO {
  sideNavigationSubMenuId: number;
  sideNavigationMenuId: number;
  subMenuName: string;
  routePath?: string;
  componentName?: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface SideNavigationMenuDTO {
  sideNavigationMenuId: number;
  menuName: string;
  iconClass: string;
  routePath?: string;
  sortOrder: number;
  isActive: boolean;
  isDeleted: boolean;
  parentListPath?: string; // ✅ Add this for navigation context
  subMenus?: SideNavigationSubMenuDTO[];
}
