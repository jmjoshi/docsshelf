// Mock implementation for expo-secure-store
export interface SecureStoreOptions {
  keychainService?: string;
  sharedPreferencesName?: string;
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
  authenticationType?: number;
}

// Mock secure storage using localStorage for web/testing
const mockStorage = new Map<string, string>();

export const setItemAsync = async (
  key: string,
  value: string,
  options?: SecureStoreOptions
): Promise<void> => {
  console.log(`Mock SecureStore: Setting ${key}`, options);
  mockStorage.set(key, value);
};

export const getItemAsync = async (
  key: string,
  options?: SecureStoreOptions
): Promise<string | null> => {
  console.log(`Mock SecureStore: Getting ${key}`, options);
  return mockStorage.get(key) || null;
};

export const deleteItemAsync = async (
  key: string,
  options?: SecureStoreOptions
): Promise<void> => {
  console.log(`Mock SecureStore: Deleting ${key}`, options);
  mockStorage.delete(key);
};

export const isAvailableAsync = async (): Promise<boolean> => {
  // Mock: assume secure store is always available
  return true;
};