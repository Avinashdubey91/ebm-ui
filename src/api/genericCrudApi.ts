import httpClient from "./httpClient";
import type { PagedResultDTO } from "../types/PagedResultDTO";

/**
 * Returns true when the payload is FormData.
 */
const isFormDataPayload = (value: unknown): value is FormData => {
  return typeof FormData !== "undefined" && value instanceof FormData;
};

/**
 * Validates audit user id before sending create/update/delete requests.
 * This prevents silent bad requests caused by stale storage-based auth lookups.
 */
const ensureValidAuditUserId = (
  auditHeaderName: "CreatedBy" | "ModifiedBy" | "DeletedBy",
  auditUserId: number
) => {
  if (!Number.isFinite(auditUserId) || auditUserId <= 0) {
    throw new Error(`${auditHeaderName} is missing or invalid.`);
  }
};

/**
 * Builds request headers without forcing invalid multipart boundaries.
 * For FormData, Axios/browser should set the Content-Type automatically.
 * For JSON payloads, send application/json explicitly.
 */
const buildMutationHeaders = (
  auditHeaderName: "CreatedBy" | "ModifiedBy" | "DeletedBy",
  auditUserId: number,
  data?: FormData | object
) => {
  ensureValidAuditUserId(auditHeaderName, auditUserId);

  const headers: Record<string, string> = {
    [auditHeaderName]: auditUserId.toString(),
  };

  if (data !== undefined && !isFormDataPayload(data)) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

/**
 * Creates a new entity (POST).
 */
export const createEntity = async (
  endpoint: string,
  data: FormData | object,
  createdBy: number
) => {
  return httpClient.post(endpoint, data, {
    headers: buildMutationHeaders("CreatedBy", createdBy, data),
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
  modifiedBy: number
) => {
  return httpClient.put(`${endpoint}/${id}`, data, {
    headers: buildMutationHeaders("ModifiedBy", modifiedBy, data),
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
    headers: buildMutationHeaders("DeletedBy", deletedBy),
  });
};

export async function fetchEntity<T>(endpoint: string): Promise<T> {
  const response = await httpClient.get<T>(endpoint);
  return response.data;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function readNumber(
  obj: UnknownRecord,
  camel: string,
  pascal: string,
  fallback: number
): number {
  const v = obj[camel] ?? obj[pascal];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export async function fetchPagedResult<T>(
  endpoint: string
): Promise<PagedResultDTO<T>> {
  const raw = await fetchEntity<unknown>(endpoint);

  if (!isRecord(raw)) {
    return {
      items: [],
      pageNumber: 1,
      pageSize: 15,
      totalCount: 0,
      totalPages: 0,
    };
  }

  const itemsRaw = raw.items ?? raw.Items;
  const items = Array.isArray(itemsRaw) ? (itemsRaw as T[]) : [];

  const pageNumber = readNumber(raw, "pageNumber", "PageNumber", 1);
  const pageSize = readNumber(raw, "pageSize", "PageSize", 15);
  const totalCount = readNumber(raw, "totalCount", "TotalCount", 0);
  const totalPages = readNumber(raw, "totalPages", "TotalPages", 0);

  return { items, pageNumber, pageSize, totalCount, totalPages };
}