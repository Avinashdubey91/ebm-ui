import httpClient from './httpClient';

/**
 * Creates a new entity (POST).
 */
export const createEntity = async (
  endpoint: string,
  data: FormData | object,
  createdBy: number,
  isMultipart: boolean = true
) => {
  return httpClient.post(endpoint, data, {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
      CreatedBy: createdBy.toString(),
    },
  });
};

/**
 * Fetches all entities (GET).
 */
export const fetchAllEntities = async <T>(endpoint: string): Promise<T[]> => {
  const res = await httpClient.get<T[]>(endpoint);
  return res.data;
};

/**
 * Fetches a single entity by ID (GET).
 */
export const fetchEntityById = async <T>(
  endpoint: string,
  id: number
): Promise<T> => {
  const res = await httpClient.get<T>(`${endpoint}/${id}`);
  return res.data;
};

/**
 * Updates an existing entity (PUT).
 */
export const updateEntity = async (
  endpoint: string,
  id: number,
  data: FormData | object,
  modifiedBy: number,
  isMultipart: boolean = true
) => {
  return httpClient.put(`${endpoint}/${id}`, data, {
    headers: {
      'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json',
      ModifiedBy: modifiedBy.toString(),
    },
  });
};

/**
 * Deletes an entity (DELETE).
 */
export const deleteEntity = async (
  endpoint: string,
  id: number,
  deletedBy: number
) => {
  return httpClient.delete(`${endpoint}/${id}`, {
    headers: {
      'DeletedBy': deletedBy.toString(), // ✅ fixed to header
    },
  });
};

