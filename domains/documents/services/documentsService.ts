import { apiClient, getApiBaseUrl } from "@/api/client";
import { getItemAsync } from "expo-secure-store";
import { Document, DocumentDto } from "../types/document";

/**
 * Documents Service - Frontend API Integration
 * Base URL: /api/documents
 * All endpoints are scoped to the authenticated user's store.
 *
 * NOTE: Create and Update use fetch() instead of Axios because Axios has a known
 * FormData detection bug in React Native that causes Network Error on file uploads.
 * Fetch natively supports FormData with file URIs.
 */

const TOKEN_STORAGE_KEY = "accessToken";

/** Throws with err.code = "ERR_NETWORK" and a clear message when fetch fails before getting a response. */
const wrapNetworkError = (err: unknown, context: string): never => {
  const out = err instanceof Error ? err : new Error(String(err));
  (out as any).code = "ERR_NETWORK";
  (out as any).response = undefined;
  if (!out.message || out.message === "Network request failed") {
    out.message = "Network request failed";
  }
  throw out;
};

const mapDocumentDtoToDocument = (dto: DocumentDto): Document => ({
  id: dto.id.toString(),
  name: dto.name,
  description: dto.description ?? undefined,
  url: dto.url,
  categoryId: dto.categoryId != null ? dto.categoryId.toString() : null,
  categoryName: dto.categoryName ?? undefined,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export const getDocuments = async (
  categoryId?: string | null,
): Promise<Document[]> => {
  const params =
    categoryId != null && categoryId !== ""
      ? { categoryId }
      : undefined;
  const { data } = await apiClient.get<DocumentDto[]>("/documents", {
    params,
  });
  return data.map(mapDocumentDtoToDocument);
};

interface CreateDocumentPayload {
  name: string;
  description?: string;
  categoryId?: string | null;
  file: {
    uri: string;
    name: string;
    type: string;
  };
}

export const createDocument = async (
  payload: CreateDocumentPayload,
): Promise<Document> => {
  const token = await getItemAsync(TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description) {
    formData.append("description", payload.description);
  }
  if (payload.categoryId != null && payload.categoryId !== "") {
    formData.append("categoryId", payload.categoryId);
  }

  formData.append("file", {
    uri: payload.file.uri,
    name: payload.file.name,
    type: payload.file.type,
  } as any);

  const url = `${getApiBaseUrl()}/documents`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response!: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    wrapNetworkError(err, "createDocument");
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const err = new Error(
      errBody?.message || errBody?.error || `Request failed: ${response.status}`,
    ) as any;
    err.response = { data: errBody, status: response.status };
    throw err;
  }

  const data: DocumentDto = await response.json();
  return mapDocumentDtoToDocument(data);
};

interface UpdateDocumentPayload {
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  /** When true, unlink document from any category */
  unsetCategory?: boolean;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
}

export const updateDocument = async (
  id: string,
  payload: UpdateDocumentPayload,
): Promise<Document> => {
  const token = await getItemAsync(TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error("Authentication required");
  }

  const formData = new FormData();

  if (payload.name !== undefined && payload.name.trim() !== "") {
    formData.append("name", payload.name);
  }

  if (payload.description !== undefined) {
    formData.append("description", payload.description ?? "");
  }
  if (payload.categoryId !== undefined) {
    formData.append(
      "categoryId",
      payload.categoryId != null && payload.categoryId !== ""
        ? payload.categoryId
        : "",
    );
  }
  if (payload.unsetCategory === true) {
    formData.append("unsetCategory", "true");
  }

  if (payload.file) {
    formData.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.type,
    } as any);
  }

  const url = `${getApiBaseUrl()}/documents/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response!: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    wrapNetworkError(err, "updateDocument");
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const err = new Error(
      errBody?.message || errBody?.error || `Request failed: ${response.status}`,
    ) as any;
    err.response = { data: errBody, status: response.status };
    throw err;
  }

  const data: DocumentDto = await response.json();
  return mapDocumentDtoToDocument(data);
};

export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`/documents/${id}`);
};

