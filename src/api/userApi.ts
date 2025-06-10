import httpClient from './httpClient';
import type { UserDTO } from '../types/UserDTO';

/**
 * Creates a new user.
 * @param data - FormData containing user details.
 * @param createdBy - Username of the creator.
 */
export const createUser = async (data: FormData, createdBy: number) => {
  return httpClient.post('/User/Create-New-User', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'CreatedBy': createdBy.toString(), // ✅ as string
    },
  });
};

/**
 * Fetches all users with roles.
 * @returns Array of UserDTO.
 */
export const fetchAllUsers = async (): Promise<UserDTO[]> => {
  const res = await httpClient.get<UserDTO[]>('/user/Get-All-Users');
  return res.data;
};

/**
 * Fetches a single user by ID.
 * @param id - User ID.
 * @returns UserDTO object.
 */
export const fetchUserById = async (id: number): Promise<UserDTO> => {
  const res = await httpClient.get<UserDTO>(`/user/Get-User-By-Id/${id}`);
  return res.data;
};

/**
 * Updates a user by ID.
 * @param id - User ID.
 * @param data - FormData containing updated user details.
 * @param modifiedBy - Username of the person modifying.
 */
export const updateUser = async (
  id: number,
  data: FormData,
  modifiedBy: number
) => {
  return httpClient.put(`/user/Update-User/${id}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'ModifiedBy': modifiedBy.toString(), // ✅ FIXED
    },
  });
};

/**
 * Deletes a user by ID.
 * @param id - User ID.
 * @param deletedBy - Username performing deletion.
 */
export const deleteUser = async (id: number, deletedBy: number) => {
  return httpClient.delete(`/user/Delete-User/${id}`, {
    headers: {
      'DeletedBy': deletedBy.toString(),
    },
  });
};
