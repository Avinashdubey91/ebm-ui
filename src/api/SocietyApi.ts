import httpClient from './httpClient';
import type { SocietyDTO } from '../types/SocietyDTO';

/**
 * Creates a new society.
 * @param data - SocietyDTO object.
 * @param createdBy - ID of the user creating the record.
 */
export const createSociety = async (
  data: SocietyDTO,
  createdBy: number
) => {
  return httpClient.post('/society/Add-New-Society', data, {
    headers: {
      'Content-Type': 'application/json',
      'CreatedBy': createdBy.toString(),
    },
  });
};

/**
 * Fetches all societies.
 * @returns Array of SocietyDTO.
 */
export const fetchAllSocieties = async (): Promise<SocietyDTO[]> => {
  const res = await httpClient.get<SocietyDTO[]>('/society/Get-All-Societies');
  return res.data;
};

/**
 * Fetches a single society by ID.
 * @param id - Society ID.
 * @returns SocietyDTO object.
 */
export const fetchSocietyById = async (
  id: number
): Promise<SocietyDTO> => {
  const res = await httpClient.get<SocietyDTO>(`/society/Get-Society-By-Id/${id}`);
  return res.data;
};

/**
 * Updates an existing society by ID.
 * @param id - Society ID.
 * @param data - SocietyDTO object.
 * @param modifiedBy - ID of the user modifying the record.
 */
export const updateSociety = async (
  id: number,
  data: SocietyDTO,
  modifiedBy: number
) => {
  return httpClient.put(`/society/Update-Existing-Society/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
      'ModifiedBy': modifiedBy.toString(),
    },
  });
};

/**
 * Deletes a society by ID.
 * @param id - Society ID.
 * @param deletedBy - ID of the user deleting the record.
 */
export const deleteSociety = async (
  id: number,
  deletedBy: number
) => {
  return httpClient.delete(`/society/Delete-Society/${id}?deletedBy=${deletedBy}`);
};
