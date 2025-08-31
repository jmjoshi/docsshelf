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
  name: string;
  path: string;
  category: string;
  folder: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  ocrText?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}
