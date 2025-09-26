import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Simplified auth state and slice
interface AuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumbers: { type: string; number: string }[];
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

// Simple store without persistence
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

// Create a mock persistor for compatibility
export const persistor = {
  purge: () => Promise.resolve(),
  flush: () => Promise.resolve(),
  pause: () => {},
  persist: () => {},
};

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;