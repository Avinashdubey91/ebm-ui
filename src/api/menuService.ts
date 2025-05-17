import axios from 'axios';
import type { SideNavigationMenuDTO, SideNavigationSubMenuDTO } from '../types/menuTypes';

const BASE_URL = 'https://localhost:5001/api';

export const fetchSideMenus = async (): Promise<SideNavigationMenuDTO[]> => {
  const response = await axios.get<SideNavigationMenuDTO[]>(`${BASE_URL}/SideNavigationMenu/Get-All-SideNavigation-Menu`);
  return response.data;
};

export const fetchSubMenus = async (): Promise<SideNavigationSubMenuDTO[]> => {
  const response = await axios.get<SideNavigationSubMenuDTO[]>(`${BASE_URL}/SideNavigationSubMenu/Get-All-SideNavigation`);
  return response.data;
};
