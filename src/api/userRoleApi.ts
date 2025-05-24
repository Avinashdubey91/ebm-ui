// src/api/userRoleApi.ts
import httpClient from './httpClient';
import type { UserRole } from '../types/UserRole';

export const fetchUserRoles = async (): Promise<UserRole[]> => {
  const response = await httpClient.get<UserRole[]>('/userrole/get-all-userroles');
  return response.data;
};
