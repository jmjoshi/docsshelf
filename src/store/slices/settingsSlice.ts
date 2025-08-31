import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  autoBackupEnabled: boolean;
  storageLimit: number; // in MB
}

const initialState: SettingsState = {
  theme: 'light',
  language: 'en',
  notificationsEnabled: true,
  biometricEnabled: false,
  autoBackupEnabled: false,
  storageLimit: 1000, // 1GB default
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setAutoBackupEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoBackupEnabled = action.payload;
    },
    setStorageLimit: (state, action: PayloadAction<number>) => {
      state.storageLimit = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setNotificationsEnabled,
  setBiometricEnabled,
  setAutoBackupEnabled,
  setStorageLimit,
  updateSettings,
} = settingsSlice.actions;
export default settingsSlice.reducer;
