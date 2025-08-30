export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Document {
  id: string;
  name: string;
  path: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
}
