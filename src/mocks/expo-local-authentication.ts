// Mock implementation for expo-local-authentication
export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
  IRIS = 3,
}

export interface LocalAuthenticationOptions {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  warning?: string;
}

// Mock functions for development/testing
export const hasHardwareAsync = async (): Promise<boolean> => {
  // Mock: assume device has biometric hardware
  return true;
};

export const supportedAuthenticationTypesAsync = async (): Promise<AuthenticationType[]> => {
  // Mock: assume device supports fingerprint
  return [AuthenticationType.FINGERPRINT];
};

export const isEnrolledAsync = async (): Promise<boolean> => {
  // Mock: assume biometrics are enrolled
  return true;
};

export const authenticateAsync = async (
  options?: LocalAuthenticationOptions
): Promise<AuthenticationResult> => {
  // Mock: simulate successful authentication for testing
  console.log('Mock biometric authentication', options?.promptMessage);
  
  // Simulate a delay like real biometric authentication
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
  };
};

export const getEnrolledLevelAsync = async (): Promise<number> => {
  // Mock: return enrolled level
  return 1;
};

// Export everything for compatibility
export * from './types';