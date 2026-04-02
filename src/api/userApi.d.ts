import type { UserDTO } from '../types/UserDTO';
/**
 * Creates a new user.
 * @param data - FormData containing user details.
 * @param createdBy - Username of the creator.
 */
export declare const createUser: (data: FormData, createdBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Fetches all users with roles.
 * @returns Array of UserDTO.
 */
export declare const fetchAllUsers: () => Promise<UserDTO[]>;
/**
 * Fetches a single user by ID.
 * @param id - User ID.
 * @returns UserDTO object.
 */
export declare const fetchUserById: (id: number) => Promise<UserDTO>;
/**
 * Updates a user by ID.
 * @param id - User ID.
 * @param data - FormData containing updated user details.
 * @param modifiedBy - Username of the person modifying.
 */
export declare const updateUser: (id: number, data: FormData, modifiedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Deletes a user by ID.
 * @param id - User ID.
 * @param deletedBy - Username performing deletion.
 */
export declare const deleteUser: (id: number, deletedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
