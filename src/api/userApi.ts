import httpClient from './httpClient';
import type { UserDTO } from '../types/UserDTO';

export const createUser = async (data: FormData, createdBy: string) => {
  return httpClient.post('/User/Create-New-User', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'createdBy': createdBy,
    },
  });
};

export const fetchAllUsers = async () => {
  const res = await httpClient.get<UserDTO[]>('/user/Get-All-Users');
  return res.data;
};

export const fetchUserById = async (id: number) => {
  const res = await httpClient.get<UserDTO>(`/user/Get-User-By-Id/${id}`);
  return res.data;
};

export const updateUser = async (id: number, data: FormData, modifiedBy: string) => {
  return httpClient.put(`/user/Update-User/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'modifiedBy': modifiedBy,
    },
  });
};

