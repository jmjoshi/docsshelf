// Mock types for expo-local-authentication
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