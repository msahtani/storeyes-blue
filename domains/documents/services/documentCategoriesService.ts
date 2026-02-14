import { apiClient } from "@/api/client";
import {
  DocumentCategory,
  DocumentCategoryDto,
} from "@/domains/documents/types/documentCategory";

const mapCategoryDtoToCategory = (dto: DocumentCategoryDto): DocumentCategory => ({
  id: dto.id.toString(),
  name: dto.name,
  description: dto.description ?? undefined,
  sortOrder: dto.sortOrder ?? 0,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

export const getDocumentCategories = async (): Promise<DocumentCategory[]> => {
  const { data } = await apiClient.get<DocumentCategoryDto[]>("/document-categories");
  return data.map(mapCategoryDtoToCategory);
};

export const createDocumentCategory = async (payload: {
  name: string;
  description?: string;
  sortOrder?: number;
}): Promise<DocumentCategory> => {
  const { data } = await apiClient.post<DocumentCategoryDto>(
    "/document-categories",
    payload,
  );
  return mapCategoryDtoToCategory(data);
};

export const updateDocumentCategory = async (
  id: string,
  payload: { name?: string; description?: string; sortOrder?: number },
): Promise<DocumentCategory> => {
  const { data } = await apiClient.put<DocumentCategoryDto>(
    `/document-categories/${id}`,
    payload,
  );
  return mapCategoryDtoToCategory(data);
};

export const deleteDocumentCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/document-categories/${id}`);
};
