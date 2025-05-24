import httpClient from './httpClient';
import type { UserDTO } from '../types/user';

export const createUser = async (data: UserDTO, createdBy: string) => {
  return await httpClient.post('/user/Create-New-User', data, {
    headers: {
      'createdBy': createdBy
    }
  });
};

export const fetchAllUsers = async () => {
  const res = await httpClient.get<UserDTO[]>('/user/Get-All-Users');
  return res.data;
};
