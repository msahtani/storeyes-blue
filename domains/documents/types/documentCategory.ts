export interface DocumentCategoryDto {
  id: number;
  storeId: number;
  name: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
