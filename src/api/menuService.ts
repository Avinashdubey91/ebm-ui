import httpClient from './httpClient';
import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from '../types/menuTypes';

export const fetchSideMenus = async (): Promise<SideNavigationMenuDTO[]> => {
  const response = await httpClient.get<SideNavigationMenuDTO[]>('/SideNavigationMenu/Get-All-SideNavigation-Menu');
  return response.data;
};

export const fetchSubMenus = async (): Promise<SideNavigationSubMenuDTO[]> => {
  const response = await httpClient.get<SideNavigationSubMenuDTO[]>('/SideNavigationSubMenu/Get-All-SideNavigation');
  return response.data;
};