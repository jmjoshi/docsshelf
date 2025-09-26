import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import documentsReducer from './slices/documentsSlice';
import settingsReducer from './slices/settingsSlice';

// Enhanced store with our feature slices
export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    documents: documentsReducer,
    settings: settingsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create a mock persistor for compatibility
export const persistor = {
  purge: () => Promise.resolve(),
  flush: () => Promise.resolve(),
  pause: () => {},
  persist: () => {},
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;