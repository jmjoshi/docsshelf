// Mock keychain for development
const Keychain = {
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
  },
  AUTHENTICATION_TYPE: {
    BIOMETRICS: 'Biometrics',
  },
  setInternetCredentials: async (service: string, username: string, password: string, options?: any) => {
    console.log('Mock Keychain: storing credentials', { service, username, options });
    return true;
  },
  getInternetCredentials: async (service: string) => {
    console.log('Mock Keychain: getting credentials', { service });
    return { username: '', password: '' }; // Mock credentials structure
  },
  resetInternetCredentials: async (service: string) => {
    console.log('Mock Keychain: reset credentials', { service });
    return true;
  },
};

// Mock biometrics
const ReactNativeBiometrics = {
  isSensorAvailable: async () => ({ available: false }),
  createKeys: async () => ({ error: null }),
};

import { DatabaseService } from '../database/mock';
import { EncryptionService } from '../encryption/mock';

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

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: string; number: string }[];
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthService {
  private static readonly KEYCHAIN_SERVICE = 'DocsShelfAuth';
  private static biometrics: typeof ReactNativeBiometrics | null = null;

  // Initialize auth service with biometric support
  static async init(): Promise<void> {
    try {
      this.biometrics = ReactNativeBiometrics;
      console.log('AuthService initialized with security features');
    } catch (error) {
      console.error('Failed to initialize AuthService:', error);
      throw new Error('Authentication service initialization failed');
    }
  }

  // Generate secure password hash with salt
  private static async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || EncryptionService.generateKey();
    const hash = await EncryptionService.hashPassword(password, passwordSalt);
    return { hash, salt: passwordSalt };
  }

  // Verify password against stored hash
  private static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const { hash: newHash } = await this.hashPassword(password, salt);
    return newHash === hash;
  }

  // Generate unique user ID
  private static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Register a new user with secure password handling
  static async register(userData: RegisterData): Promise<User> {
    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('All required fields must be provided');
      }

      // Check if user already exists
      const existingUser = await DatabaseService.getUserByEmail(userData.email.toLowerCase());
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Hash password securely
      const { hash, salt } = await this.hashPassword(userData.password);
      
      // Generate user ID
      const userId = this.generateUserId();

      // Prepare user data for storage
      const storedUser: StoredUser = {
        id: userId,
        email: userData.email.toLowerCase(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        phoneNumbers: userData.phoneNumbers.filter(p => p.number.trim()),
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store user in database
      const createdUser = await DatabaseService.createUser(storedUser);

      // Store credentials securely in keychain
      await this.storeCredentials(userId, userData.email.toLowerCase());

      // Return user without sensitive data
      return {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        phoneNumbers: createdUser.phoneNumbers,
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  }

  // Login user with credential verification
  static async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Get user from database
      const storedUser = await DatabaseService.getUserByEmail(credentials.email.toLowerCase());
      if (!storedUser) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(
        credentials.password,
        storedUser.passwordHash,
        storedUser.salt
      );

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login time
      await DatabaseService.updateUser(storedUser.id, {
        updatedAt: new Date().toISOString(),
      });

      // Store credentials in keychain for future use
      await this.storeCredentials(storedUser.id, storedUser.email);

      // Return user without sensitive data
      return {
        id: storedUser.id,
        email: storedUser.email,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        phoneNumbers: storedUser.phoneNumbers,
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error instanceof Error ? error : new Error('Login failed');
    }
  }

  // Store credentials securely in keychain
  private static async storeCredentials(userId: string, email: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.KEYCHAIN_SERVICE,
        email,
        userId,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
          accessGroup: 'group.docsshelf.auth',
        }
      );
    } catch (error) {
      console.warn('Failed to store credentials in keychain:', error);
      // Continue without keychain storage - non-critical error
    }
  }

  // Get stored credentials from keychain
  private static async getStoredCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.KEYCHAIN_SERVICE);
      if (credentials && credentials.username && credentials.password) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to retrieve credentials from keychain:', error);
      return null;
    }
  }

  // Biometric authentication
  static async authenticateWithBiometrics(): Promise<boolean> {
    try {
      // For now, return true to allow testing
      // In production, implement proper biometric authentication
      console.log('Biometric authentication requested (mock implementation)');
      
      // Simulate biometric prompt
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true); // Mock success for testing
        }, 1000);
      });
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Setup biometric authentication
  static async setupBiometricAuth(userId: string): Promise<boolean> {
    try {
      if (!this.biometrics) {
        await this.init();
      }

      const { available } = await this.biometrics!.isSensorAvailable();
      if (!available) {
        return false;
      }

      // Generate key for biometric authentication
      const keyGenResult = await this.biometrics!.createKeys();
      if (keyGenResult.error) {
        throw new Error('Failed to create biometric key');
      }

      return true;
    } catch (error) {
      console.error('Failed to setup biometric auth:', error);
      return false;
    }
  }

  // Get encryption key for user data
  static async getUserEncryptionKey(userId: string): Promise<string | null> {
    try {
      // Generate or retrieve user-specific encryption key
      const key = await EncryptionService.getUserKey(userId);
      return key;
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      return null;
    }
  }

  // Logout user and clear stored credentials
  static async logout(userId: string): Promise<void> {
    try {
      // Clear keychain credentials
      await Keychain.resetInternetCredentials(this.KEYCHAIN_SERVICE);
      
      // Update user's last logout time
      await DatabaseService.updateUser(userId, {
        updatedAt: new Date().toISOString(),
      });

      console.log('User logged out successfully:', userId);
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Failed to logout');
    }
  }

  // Change user password
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user from database
      const storedUser = await DatabaseService.getUserById(userId);
      if (!storedUser) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(
        currentPassword,
        storedUser.passwordHash,
        storedUser.salt
      );

      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const { hash, salt } = await this.hashPassword(newPassword);

      // Update password in database
      await DatabaseService.updateUser(userId, {
        passwordHash: hash,
        salt,
        updatedAt: new Date().toISOString(),
      });

      console.log('Password changed successfully for user:', userId);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error instanceof Error ? error : new Error('Failed to change password');
    }
  }

  // Get user audit logs
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<Array<{ action: string; timestamp: string; details?: string }>> {
    try {
      // Implementation would depend on audit logging system
      // For now, return empty array as this is not critical for Phase 1
      console.log('Audit logs requested for user:', userId, 'limit:', limit);
      return [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // Check if user session is valid
  static async isSessionValid(userId: string): Promise<boolean> {
    try {
      const user = await DatabaseService.getUserById(userId);
      return !!user;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Get current user from stored credentials
  static async getCurrentUser(): Promise<User | null> {
    try {
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        return null;
      }

      const user = await DatabaseService.getUserById(credentials.password); // password field contains userId
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumbers: user.phoneNumbers,
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }
}
