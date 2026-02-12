export interface DocumentDto {
  id: number;
  storeId: number;
  storeCode: string;
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
  createdAt: string;
  updatedAt: string;
}

