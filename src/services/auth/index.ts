// Authentication service for secure user management
import ReactNativeBiometrics from 'react-native-biometrics';
import { DatabaseService, User, AuditLog } from '../database';
import { EncryptionService } from '../encryption';

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

export class AuthService {
  private static biometrics = new ReactNativeBiometrics();

  // Initialize auth service
  static async init(): Promise<void> {
    await DatabaseService.initDatabase();
  }

  // Register a new user
  static async register(userData: RegisterData): Promise<User> {
    try {
      // Validate password strength
      this.validatePassword(userData.password);

      // Generate salt and hash password
      const salt = EncryptionService.generateKey().substring(0, 32);
      const passwordHashData = EncryptionService.deriveKey(
        userData.password,
        salt
      );
      const passwordHash = passwordHashData.key;

      // Create user in database
      const user = await DatabaseService.createUser({
        ...userData,
        passwordHash,
        salt,
      });

      // Generate and store encryption key
      const encryptionKey = EncryptionService.generateKey();
      await EncryptionService.storeKey(encryptionKey, `DocsShelf-${user.id}`);

      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      const user = await DatabaseService.getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const derivedHashData = EncryptionService.deriveKey(
        credentials.password,
        user.salt
      );
      const derivedHash = derivedHashData.key;
      if (derivedHash !== user.passwordHash) {
        await DatabaseService.logAudit(
          user.id,
          'LOGIN_FAILED',
          'Invalid password'
        );
        throw new Error('Invalid credentials');
      }

      // Log successful login
      await DatabaseService.logAudit(
        user.id,
        'LOGIN_SUCCESS',
        'User logged in'
      );

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Biometric authentication
  static async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const { available } = await this.biometrics.isSensorAvailable();

      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const { success } = await this.biometrics.simplePrompt({
        promptMessage: 'Authenticate to access DocsShelf',
        cancelButtonText: 'Cancel',
      });

      return success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Setup biometric authentication for user
  static async setupBiometricAuth(userId: string): Promise<boolean> {
    try {
      const success = await this.authenticateWithBiometrics();
      if (success) {
        await DatabaseService.logAudit(
          userId,
          'BIOMETRIC_SETUP',
          'Biometric authentication enabled'
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to setup biometric auth:', error);
      return false;
    }
  }

  // Get encryption key for user
  static async getUserEncryptionKey(userId: string): Promise<string | null> {
    try {
      return await EncryptionService.getKey(`DocsShelf-${userId}`);
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      return null;
    }
  }

  // Validate password strength
  private static validatePassword(password: string): void {
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      throw new Error(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol'
      );
    }
  }

  // Logout user
  static async logout(userId: string): Promise<void> {
    try {
      await DatabaseService.logAudit(userId, 'LOGOUT', 'User logged out');
    } catch (error) {
      console.error('Logout logging failed:', error);
    }
  }

  // Change password
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const currentHashData = EncryptionService.deriveKey(
        currentPassword,
        user.salt
      );
      const currentHash = currentHashData.key;
      if (currentHash !== user.passwordHash) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Generate new salt and hash
      const newSalt = EncryptionService.generateKey().substring(0, 32);
      const newPasswordHashData = EncryptionService.deriveKey(
        newPassword,
        newSalt
      );
      const newPasswordHash = newPasswordHashData.key;

      // Update user
      await DatabaseService.updateUser(userId, {
        passwordHash: newPasswordHash,
        salt: newSalt,
      });

      await DatabaseService.logAudit(
        userId,
        'PASSWORD_CHANGED',
        'Password changed successfully'
      );
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  // Get user audit logs
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      return await DatabaseService.getAuditLogs(userId, limit);
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }
}
