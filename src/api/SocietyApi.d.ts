import type { SocietyDTO } from '../types/SocietyDTO';
/**
 * Creates a new society.
 * @param data - SocietyDTO object.
 * @param createdBy - ID of the user creating the record.
 */
export declare const createSociety: (data: SocietyDTO, createdBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Fetches all societies.
 * @returns Array of SocietyDTO.
 */
export declare const fetchAllSocieties: () => Promise<SocietyDTO[]>;
/**
 * Fetches a single society by ID.
 * @param id - Society ID.
 * @returns SocietyDTO object.
 */
export declare const fetchSocietyById: (id: number) => Promise<SocietyDTO>;
/**
 * Updates an existing society by ID.
 * @param id - Society ID.
 * @param data - SocietyDTO object.
 * @param modifiedBy - ID of the user modifying the record.
 */
export declare const updateSociety: (id: number, data: SocietyDTO, modifiedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Deletes a society by ID.
 * @param id - Society ID.
 * @param deletedBy - ID of the user deleting the record.
 */
export declare const deleteSociety: (id: number, deletedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
