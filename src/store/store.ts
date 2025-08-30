import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder slices
const authSlice = { reducer: (state = {}) => state };
const documentsSlice = { reducer: (state = {}) => state };

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const rootReducer = {
  auth: persistReducer(persistConfig, authSlice.reducer),
  documents: persistReducer(persistConfig, documentsSlice.reducer),
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
