import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Document {
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

interface Category {
  id: string;
  name: string;
  color: string;
}

interface DocumentsState {
  documents: Document[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentsState = {
  documents: [],
  categories: [],
  isLoading: false,
  error: null,
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload);
    },
    updateDocument: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Document> }>
    ) => {
      const index = state.documents.findIndex(
        (doc) => doc.id === action.payload.id
      );
      if (index !== -1) {
        state.documents[index] = {
          ...state.documents[index],
          ...action.payload.updates,
        };
      }
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(
        (doc) => doc.id !== action.payload
      );
    },
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Category> }>
    ) => {
      const index = state.categories.findIndex(
        (cat) => cat.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = {
          ...state.categories[index],
          ...action.payload.updates,
        };
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (cat) => cat.id !== action.payload
      );
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  addDocument,
  updateDocument,
  deleteDocument,
  setDocuments,
  addCategory,
  updateCategory,
  deleteCategory,
  setCategories,
} = documentsSlice.actions;
export default documentsSlice.reducer;
