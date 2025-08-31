export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: Array<{
    type: string;
    number: string;
  }>;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  path: string;
  category?: string;
  folder?: string;
  size?: number;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
  ocrText?: string;
  tags: string[];
  isSynced?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
