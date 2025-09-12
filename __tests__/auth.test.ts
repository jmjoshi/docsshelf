/// <reference types="jest" />

// Unit tests for AuthService
import { AuthService } from '../src/services/auth';
import { DatabaseService } from '../src/services/database';
import { EncryptionService } from '../src/services/encryption';

// Mock dependencies
jest.mock('../src/services/database');
jest.mock('../src/services/encryption');
jest.mock('react-native-biometrics');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashedPassword',
        salt: 'salt123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phoneNumbers: [],
      };

      (DatabaseService.createUser as jest.Mock).mockResolvedValue(mockUser);
      (EncryptionService.generateKey as jest.Mock).mockReturnValue('salt123');
      (EncryptionService.deriveKey as jest.Mock).mockReturnValue(
        'hashedPassword'
      );
      (EncryptionService.storeKey as jest.Mock).mockResolvedValue(undefined);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
        phoneNumbers: [],
      };

      const result = await AuthService.register(userData);

      expect(DatabaseService.createUser).toHaveBeenCalledWith({
        ...userData,
        passwordHash: 'hashedPassword',
        salt: 'salt123',
      });
      expect(EncryptionService.storeKey).toHaveBeenCalledWith(
        'salt123',
        'DocsShelf-user123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error for weak password', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'weak',
        phoneNumbers: [],
      };

      await expect(AuthService.register(userData)).rejects.toThrow(
        'Password must be at least 12 characters long'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: 'hashedPassword',
        salt: 'salt123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phoneNumbers: [],
      };

      (DatabaseService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (EncryptionService.deriveKey as jest.Mock).mockReturnValue(
        'hashedPassword'
      );
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'StrongPass123!',
      });

      expect(DatabaseService.getUserByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'LOGIN_SUCCESS',
        'User logged in'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid credentials', async () => {
      (DatabaseService.getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: 'invalid@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'correctHash',
        salt: 'salt123',
      };

      (DatabaseService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (EncryptionService.deriveKey as jest.Mock).mockReturnValue('wrongHash');
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');

      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'LOGIN_FAILED',
        'Invalid password'
      );
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('should authenticate successfully when biometrics available', async () => {
      const mockBiometrics = {
        isSensorAvailable: jest.fn().mockResolvedValue({ available: true }),
        simplePrompt: jest.fn().mockResolvedValue({ success: true }),
      };

      (
        AuthService as unknown as { biometrics: typeof mockBiometrics }
      ).biometrics = mockBiometrics;

      const result = await AuthService.authenticateWithBiometrics();

      expect(result).toBe(true);
      expect(mockBiometrics.isSensorAvailable).toHaveBeenCalled();
      expect(mockBiometrics.simplePrompt).toHaveBeenCalledWith({
        promptMessage: 'Authenticate to access DocsShelf',
        cancelButtonText: 'Cancel',
      });
    });

    it('should return false when biometrics not available', async () => {
      const mockBiometrics = {
        isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
      };

      (
        AuthService as unknown as { biometrics: typeof mockBiometrics }
      ).biometrics = mockBiometrics;

      const result = await AuthService.authenticateWithBiometrics();

      expect(result).toBe(false);
    });
  });

  describe('getUserEncryptionKey', () => {
    it('should retrieve encryption key successfully', async () => {
      (EncryptionService.getKey as jest.Mock).mockResolvedValue(
        'encryptionKey123'
      );

      const result = await AuthService.getUserEncryptionKey('user123');

      expect(EncryptionService.getKey).toHaveBeenCalledWith(
        'DocsShelf-user123'
      );
      expect(result).toBe('encryptionKey123');
    });

    it('should return null when key not found', async () => {
      (EncryptionService.getKey as jest.Mock).mockResolvedValue(null);

      const result = await AuthService.getUserEncryptionKey('user123');

      expect(result).toBe(null);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'oldHash',
        salt: 'oldSalt',
      };

      (DatabaseService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (EncryptionService.deriveKey as jest.Mock).mockReturnValueOnce('oldHash'); // current password check
      (EncryptionService.generateKey as jest.Mock).mockReturnValue('newSalt');
      (EncryptionService.deriveKey as jest.Mock).mockReturnValueOnce('newHash'); // new password hash
      (DatabaseService.updateUser as jest.Mock).mockResolvedValue(undefined);
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await AuthService.changePassword(
        'user123',
        'OldPass123!',
        'NewStrongPass123!'
      );

      expect(DatabaseService.updateUser).toHaveBeenCalledWith('user123', {
        passwordHash: 'newHash',
        salt: 'newSalt',
      });
      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'PASSWORD_CHANGED',
        'Password changed successfully'
      );
    });

    it('should throw error for incorrect current password', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'correctHash',
        salt: 'salt123',
      };

      (DatabaseService.getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (EncryptionService.deriveKey as jest.Mock).mockReturnValue('wrongHash');

      await expect(
        AuthService.changePassword(
          'user123',
          'wrongpassword',
          'NewStrongPass123!'
        )
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
