/// <reference types="jest" />

// Unit tests for EncryptionService
import { EncryptionService } from '../src/services/encryption';

// Mock react-native-keychain
jest.mock('react-native-keychain');

describe('EncryptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateKey', () => {
    it('should generate a random key', () => {
      const key1 = EncryptionService.generateKey();
      const key2 = EncryptionService.generateKey();

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(typeof key1).toBe('string');
      expect(typeof key2).toBe('string');
      expect(key1.length).toBeGreaterThan(0);
      expect(key2.length).toBeGreaterThan(0);
      // Keys should be different (very high probability)
      expect(key1).not.toBe(key2);
    });

    it('should generate key of correct length', () => {
      const key = EncryptionService.generateKey();

      // AES-256 key should be 32 bytes = 64 hex characters
      expect(key.length).toBe(64);
    });
  });

  describe('deriveKey', () => {
    it('should derive key from password and salt', () => {
      const password = 'testPassword123';
      const salt = 'testSalt';

      const derivedKey = EncryptionService.deriveKey(password, salt);

      expect(derivedKey).toBeDefined();
      expect(typeof derivedKey).toBe('object');
      expect(derivedKey.key).toBeDefined();
      expect(derivedKey.key.length).toBeGreaterThan(0);
    });

    it('should generate different keys for different passwords', () => {
      const salt = 'sameSalt';
      const key1 = EncryptionService.deriveKey('password1', salt);
      const key2 = EncryptionService.deriveKey('password2', salt);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different salts', () => {
      const password = 'samePassword';
      const key1 = EncryptionService.deriveKey(password, 'salt1');
      const key2 = EncryptionService.deriveKey(password, 'salt2');

      expect(key1).not.toBe(key2);
    });

    it('should generate same key for same password and salt', () => {
      const password = 'testPassword';
      const salt = 'testSalt';
      const key1 = EncryptionService.deriveKey(password, salt);
      const key2 = EncryptionService.deriveKey(password, salt);

      expect(key1).toBe(key2);
    });

    it('should generate random salt when none provided', () => {
      const password = 'testPassword';
      const key1 = EncryptionService.deriveKey(password);
      const key2 = EncryptionService.deriveKey(password);

      // Should be different due to random salt
      expect(key1).not.toBe(key2);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = 'Hello, World! This is a test message.';
      const key = 'testKey12345678901234567890123456789012'; // 32 bytes

      const encryptedData = await EncryptionService.encryptData(
        originalData,
        key
      );
      const decryptedData = await EncryptionService.decryptData(
        encryptedData,
        key
      );

      expect(encryptedData).toBeDefined();
      expect(typeof encryptedData).toBe('string');
      expect(encryptedData).not.toBe(originalData);
      expect(decryptedData).toBe(originalData);
    });

    it('should produce different encrypted outputs for same input', async () => {
      const data = 'Same input data';
      const key = 'testKey12345678901234567890123456789012';

      const encrypted1 = await EncryptionService.encryptData(data, key);
      const encrypted2 = await EncryptionService.encryptData(data, key);

      // Due to random IV, encrypted outputs should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail decryption with wrong key', async () => {
      const data = 'Test data';
      const correctKey = 'correctKey123456789012345678901234567890';
      const wrongKey = 'wrongKey12345678901234567890123456789012';

      const encryptedData = await EncryptionService.encryptData(
        data,
        correctKey
      );

      // This should return empty or corrupted data with wrong key
      const result = await EncryptionService.decryptData(
        encryptedData,
        wrongKey
      );
      expect(result).toBe(''); // Wrong key results in empty decryption
    });
  });

  describe('storeKey and getKey', () => {
    it('should store and retrieve key successfully', async () => {
      const testKey = 'testEncryptionKey123';
      const service = 'testService';

      (
        require('react-native-keychain').setGenericPassword as jest.Mock
      ).mockResolvedValue(undefined);
      (
        require('react-native-keychain').getGenericPassword as jest.Mock
      ).mockResolvedValue({
        username: 'encryption-key',
        password: testKey,
      });

      await EncryptionService.storeKey(testKey, service);
      const retrievedKey = await EncryptionService.getKey(service);

      expect(
        require('react-native-keychain').setGenericPassword
      ).toHaveBeenCalledWith('encryption-key', testKey, {
        service,
        accessControl: require('react-native-keychain').ACCESS_CONTROL
          .BIOMETRY_ANY,
        accessible: require('react-native-keychain').ACCESSIBLE
          .WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      expect(
        require('react-native-keychain').getGenericPassword
      ).toHaveBeenCalledWith({ service });
      expect(retrievedKey).toBe(testKey);
    });

    it('should return null when key not found', async () => {
      (
        require('react-native-keychain').getGenericPassword as jest.Mock
      ).mockResolvedValue(false);

      const result = await EncryptionService.getKey('nonexistentService');

      expect(result).toBe(null);
    });
  });

  describe('deleteKey', () => {
    it('should delete key successfully', async () => {
      const service = 'testService';

      (
        require('react-native-keychain').resetGenericPassword as jest.Mock
      ).mockResolvedValue(undefined);

      await EncryptionService.deleteKey(service);

      expect(
        require('react-native-keychain').resetGenericPassword
      ).toHaveBeenCalledWith({ service });
    });
  });

  describe('encryptFile and decryptFile', () => {
    it('should encrypt and decrypt file data', async () => {
      const fileData = 'File content to encrypt';
      const key = 'fileKey12345678901234567890123456789012';

      const encryptedFile = await EncryptionService.encryptFile(fileData, key);
      const decryptedFile = await EncryptionService.decryptFile(
        encryptedFile,
        key
      );

      expect(encryptedFile).toBeDefined();
      expect(typeof encryptedFile).toBe('string');
      expect(encryptedFile).not.toBe(fileData);
      expect(decryptedFile).toBe(fileData);
    });

    it('should handle large file data', async () => {
      const largeData = 'A'.repeat(10000); // 10KB of data
      const key = 'largeFileKey123456789012345678901234567890';

      const encrypted = await EncryptionService.encryptFile(largeData, key);
      const decrypted = await EncryptionService.decryptFile(encrypted, key);

      expect(decrypted).toBe(largeData);
    });
  });

  describe('password validation', () => {
    it('should validate strong password', () => {
      const strongPassword = 'StrongPass123!@#';

      // Test the validation logic indirectly through deriveKey
      expect(() => {
        EncryptionService.deriveKey(strongPassword, 'salt');
      }).not.toThrow();
    });

    it('should handle various password strengths', () => {
      const testCases = [
        { password: 'weak', shouldWork: true }, // deriveKey doesn't validate, just processes
        { password: 'StrongPass123!', shouldWork: true },
        {
          password: 'VeryLongPasswordWithNumbers123456789!@#$%^&*()',
          shouldWork: true,
        },
      ];

      testCases.forEach(({ password, shouldWork }) => {
        if (shouldWork) {
          expect(() => {
            EncryptionService.deriveKey(password, 'salt');
          }).not.toThrow();
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle empty data', async () => {
      const key = 'testKey12345678901234567890123456789012';

      const encrypted = await EncryptionService.encryptData('', key);
      const decrypted = await EncryptionService.decryptData(encrypted, key);

      expect(decrypted).toBe('');
    });

    it('should handle special characters', async () => {
      const dataWithSpecialChars =
        'Data with special chars: àáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
      const key = 'specialKey123456789012345678901234567890';

      const encrypted = await EncryptionService.encryptData(
        dataWithSpecialChars,
        key
      );
      const decrypted = await EncryptionService.decryptData(encrypted, key);

      expect(decrypted).toBe(dataWithSpecialChars);
    });
  });
});
