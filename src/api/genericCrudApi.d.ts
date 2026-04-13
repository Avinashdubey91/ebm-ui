import type { PagedResultDTO } from "../types/PagedResultDTO";
/**
 * Creates a new entity (POST).
 */
export declare const createEntity: (endpoint: string, data: FormData | object, createdBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Fetches all entities (GET).
 */
export declare const fetchAllEntities: <T>(endpoint: string) => Promise<T[]>;
/**
 * Fetches a single entity by ID (GET).
 */
export declare const fetchEntityById: <T>(endpoint: string, id: number) => Promise<T>;
/**
 * Updates an existing entity (PUT).
 */
export declare const updateEntity: (endpoint: string, id: number, data: FormData | object, modifiedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
/**
 * Deletes an entity (DELETE).
 */
export declare const deleteEntity: (endpoint: string, id: number, deletedBy: number) => Promise<Axios.AxiosXHR<unknown>>;
export declare function fetchEntity<T>(endpoint: string): Promise<T>;
export declare function fetchPagedResult<T>(endpoint: string): Promise<PagedResultDTO<T>>;
