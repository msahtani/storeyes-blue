import { apiClient } from "@/api/client";
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

const getBaseUrl = (): string => {
  const apiBase =
    process.env.EXPO_PUBLIC_API_URL || "https://api.storeyes.io";
  return apiBase.replace(/\/$/, "") + "/api";
};

const mapDocumentDtoToDocument = (dto: DocumentDto): Document => ({
  id: dto.id.toString(),
  name: dto.name,
  description: dto.description ?? undefined,
  url: dto.url,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export const getDocuments = async (): Promise<Document[]> => {
  const { data } = await apiClient.get<DocumentDto[]>("/documents");
  return data.map(mapDocumentDtoToDocument);
};

interface CreateDocumentPayload {
  name: string;
  description?: string;
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

  formData.append("file", {
    uri: payload.file.uri,
    name: payload.file.name,
    type: payload.file.type,
  } as any);

  const url = `${getBaseUrl()}/documents`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
    signal: controller.signal,
  });

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

  if (payload.file) {
    formData.append("file", {
      uri: payload.file.uri,
      name: payload.file.name,
      type: payload.file.type,
    } as any);
  }

  const url = `${getBaseUrl()}/documents/${id}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
    signal: controller.signal,
  });

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

