import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authReducer, documentsReducer, settingsReducer } from './slices';
import { syncMiddleware } from './middleware/syncMiddleware';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'isAuthenticated'], // Only persist user data and auth state
};

const documentsPersistConfig = {
  key: 'documents',
  storage: AsyncStorage,
  whitelist: ['documents', 'categories'], // Persist documents and categories
};

const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
};

const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  documents: persistReducer(documentsPersistConfig, documentsReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(syncMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
