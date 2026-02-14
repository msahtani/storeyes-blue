export interface DocumentDto {
  id: number;
  storeId: number;
  storeCode: string;
  categoryId?: number | null;
  categoryName?: string | null;
  name: string;
  description?: string | null;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  url: string;
  categoryId?: string | null;
  categoryName?: string | null;
  createdAt: string;
  updatedAt: string;
}

