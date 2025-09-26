// Simplified Authentication service stub for testing
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumbers: { type: string; number: string }[];
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: string; number: string }[];
}

export class AuthService {
  // Initialize auth service
  static async init(): Promise<void> {
    console.log('AuthService initialized (stub version)');
  }

  // Register a new user (stub)
  static async register(userData: RegisterData): Promise<User> {
    console.log('Register called (stub):', userData.email);
    return {
      id: '1',
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumbers: userData.phoneNumbers,
    };
  }

  // Login user (stub)
  static async login(credentials: LoginCredentials): Promise<User | null> {
    console.log('Login called (stub):', credentials.email);
    return {
      id: '1',
      email: credentials.email,
      firstName: 'Test',
      lastName: 'User',
      phoneNumbers: [],
    };
  }

  // Biometric authentication (stub)
  static async authenticateWithBiometrics(): Promise<boolean> {
    console.log('Biometric auth called (stub)');
    return false; // Not supported in stub
  }

  // Setup biometric authentication (stub)
  static async setupBiometricAuth(userId: string): Promise<boolean> {
    console.log('Setup biometric auth called (stub):', userId);
    return false;
  }

  // Get encryption key (stub)
  static async getUserEncryptionKey(userId: string): Promise<string | null> {
    console.log('Get encryption key called (stub):', userId);
    return 'stub-encryption-key';
  }

  // Logout user (stub)
  static async logout(userId: string): Promise<void> {
    console.log('Logout called (stub):', userId);
  }

  // Change password (stub)
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    console.log('Change password called (stub):', userId);
  }

  // Get audit logs (stub)
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    console.log('Get audit logs called (stub):', userId);
    return [];
  }
}
