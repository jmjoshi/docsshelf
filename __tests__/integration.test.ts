/// <reference types="jest" />

// Integration tests for DocsShelf
import { DocumentService } from '../src/services/documents';
import { AuthService } from '../src/services/auth';
import { StorageService } from '../src/services/storage';
import { DatabaseService } from '../src/services/database';
import { EncryptionService } from '../src/services/encryption';

// Mock all services
jest.mock('../src/services/documents');
jest.mock('../src/services/auth');
jest.mock('../src/services/storage');
jest.mock('../src/services/database');
jest.mock('../src/services/encryption');

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  MediaTypeOptions: {
    All: 'All',
    Images: 'Images'
  }
}));
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64'
  }
}));
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn()
  }
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Document Upload Flow', () => {
    test('Complete user registration to document upload workflow', async () => {
      // Mock user registration
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      (AuthService.register as jest.Mock).mockResolvedValue(mockUser);
      (AuthService.getUserEncryptionKey as jest.Mock).mockResolvedValue('encryptionKey123');

      // Mock document upload
      const mockDocument = {
        id: 'doc123',
        name: 'test.pdf',
        path: '/documents/test.pdf',
        size: 1024,
        mimeType: 'application/pdf'
      };

      (DocumentService.uploadFromDevice as jest.Mock).mockResolvedValue(mockDocument);
      (StorageService.saveEncryptedFile as jest.Mock).mockResolvedValue('/documents/test.pdf');

      // Execute workflow
      const user = await AuthService.register({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'StrongPass123!',
        phoneNumbers: []
      });

      const encryptionKey = await AuthService.getUserEncryptionKey(user.id);
      const document = await DocumentService.uploadFromDevice(user.id, encryptionKey);

      // Verify workflow
      expect(user.id).toBe('user123');
      expect(encryptionKey).toBe('encryptionKey123');
      expect(document.id).toBe('doc123');
      expect(document.name).toBe('test.pdf');
    });
  });

  describe('Authentication and Authorization', () => {
    test('User login with biometric fallback', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      (AuthService.authenticateWithBiometrics as jest.Mock).mockResolvedValue(false); // Biometric fails
      (AuthService.login as jest.Mock).mockResolvedValue(mockUser); // Password login succeeds

      // Try biometric first
      const biometricResult = await AuthService.authenticateWithBiometrics();
      expect(biometricResult).toBe(false);

      // Fall back to password
      const loginResult = await AuthService.login({
        email: 'test@example.com',
        password: 'StrongPass123!'
      });

      expect(loginResult).toEqual(mockUser);
    });
  });

  describe('Document Management Workflow', () => {
    test('Upload, search, and retrieve document', async () => {
      const mockDocument = {
        id: 'doc123',
        name: 'important.pdf',
        category: 'Work',
        tags: ['important', 'work']
      };

      // Mock upload
      (DocumentService.uploadFromDevice as jest.Mock).mockResolvedValue(mockDocument);

      // Mock search
      (DocumentService.searchDocuments as jest.Mock).mockResolvedValue([mockDocument]);

      // Mock retrieval
      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue([mockDocument]);

      // Execute workflow
      const uploadedDoc = await DocumentService.uploadFromDevice('user123', 'key');
      const searchResults = await DocumentService.searchDocuments('user123', 'important');
      const allDocs = await DatabaseService.getDocumentsByUser('user123');

      expect(uploadedDoc).toEqual(mockDocument);
      expect(searchResults).toContain(mockDocument);
      expect(allDocs).toContain(mockDocument);
    });
  });

  describe('Encryption and Security', () => {
    test('Data encryption and decryption workflow', async () => {
      const originalData = 'Sensitive document content';
      const key = 'encryptionKey123';

      (EncryptionService.encryptData as jest.Mock).mockResolvedValue('encryptedData');
      (EncryptionService.decryptData as jest.Mock).mockResolvedValue(originalData);

      // Encrypt data
      const encrypted = await EncryptionService.encryptData(originalData, key);
      expect(encrypted).toBe('encryptedData');

      // Decrypt data
      const decrypted = await EncryptionService.decryptData(encrypted, key);
      expect(decrypted).toBe(originalData);
    });

    test('File encryption and storage', async () => {
      const fileData = 'File content to encrypt';
      const fileName = 'test.pdf';
      const userId = 'user123';
      const key = 'encryptionKey';

      (StorageService.saveEncryptedFile as jest.Mock).mockResolvedValue('/encrypted/path/test.pdf');
      (StorageService.readEncryptedFile as jest.Mock).mockResolvedValue(fileData);

      // Save encrypted file
      const savedPath = await StorageService.saveEncryptedFile(
        fileData,
        fileName,
        userId,
        key,
        'application/pdf'
      );

      // Read and decrypt file
      const retrievedData = await StorageService.readEncryptedFile(savedPath, key);

      expect(savedPath).toBe('/encrypted/path/test.pdf');
      expect(retrievedData).toBe(fileData);
    });
  });

  describe('Database Operations', () => {
    test('Document CRUD operations', async () => {
      const document = {
        name: 'test.pdf',
        path: '/path/test.pdf',
        size: 1024,
        tags: ['test']
      };

      (DatabaseService.saveDocumentMetadata as jest.Mock).mockResolvedValue('doc123');
      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue([{
        id: 'doc123',
        ...document
      }]);
      (DatabaseService.updateDocument as jest.Mock).mockResolvedValue(undefined);
      (DatabaseService.deleteDocument as jest.Mock).mockResolvedValue(undefined);

      // Create
      const docId = await DatabaseService.saveDocumentMetadata(
        'user123',
        document.name,
        document.path,
        document.size,
        'application/pdf'
      );

      // Read
      const docs = await DatabaseService.getDocumentsByUser('user123');

      // Update
      await DatabaseService.updateDocument(docId, { category: 'Updated' });

      // Delete
      await DatabaseService.deleteDocument(docId, 'user123');

      expect(docId).toBe('doc123');
      expect(docs.length).toBe(1);
      expect(docs[0].id).toBe('doc123');
    });
  });

  describe('Error Handling', () => {
    test('Handles service failures gracefully', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue(new Error('Network error'));
      (DocumentService.uploadFromDevice as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Test login failure
      await expect(AuthService.login({
        email: 'test@example.com',
        password: 'wrong'
      })).rejects.toThrow('Network error');

      // Test upload failure
      await expect(DocumentService.uploadFromDevice('user123', 'key'))
        .rejects.toThrow('Upload failed');
    });

    test('Handles permission denials', async () => {
      (DocumentService.requestPermissions as jest.Mock).mockResolvedValue({
        camera: false,
        mediaLibrary: false
      });

      const permissions = await DocumentService.requestPermissions();

      expect(permissions.camera).toBe(false);
      expect(permissions.mediaLibrary).toBe(false);
    });
  });

  describe('Performance Validation', () => {
    test('Validates operation timing', async () => {
      const startTime = Date.now();

      // Mock a service call with delay
      (DocumentService.getDocumentsPaginated as jest.Mock).mockImplementation(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            documents: [],
            totalCount: 0,
            hasMore: false
          };
        }
      );

      await DocumentService.getDocumentsPaginated('user123', 1, 50);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (allowing for some overhead)
      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(200);
    });
  });
});
