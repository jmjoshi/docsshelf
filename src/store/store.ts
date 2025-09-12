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
  whitelist: ['categories'], // Only persist categories, not documents (they're in database)
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
      // Reduce middleware overhead in development
      immutableCheck: {
        warnAfter: 64, // Increase warning threshold
      },
    }).concat(syncMiddleware),
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
