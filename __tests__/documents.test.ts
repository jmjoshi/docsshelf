/// <reference types="jest" />

// Unit tests for DocumentService
import { DocumentService } from '../src/services/documents';
import { StorageService } from '../src/services/storage';
import { DatabaseService } from '../src/services/database';

// Mock dependencies
jest.mock('../src/services/storage');
jest.mock('../src/services/database');
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

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPermissions', () => {
    it('should request permissions successfully', async () => {
      const mockCameraPermission = { granted: true };
      const mockMediaLibraryPermission = { granted: true };

      const { Camera } = require('expo-camera');
      const { requestMediaLibraryPermissionsAsync } = require('expo-image-picker');

      Camera.requestCameraPermissionsAsync.mockResolvedValue(mockCameraPermission);
      requestMediaLibraryPermissionsAsync.mockResolvedValue(mockMediaLibraryPermission);

      const result = await DocumentService.requestPermissions();

      expect(result).toEqual({
        camera: true,
        mediaLibrary: true
      });
    });

    it('should handle denied permissions', async () => {
      const mockCameraPermission = { granted: false };
      const mockMediaLibraryPermission = { granted: false };

      const { Camera } = require('expo-camera');
      const { requestMediaLibraryPermissionsAsync } = require('expo-image-picker');

      Camera.requestCameraPermissionsAsync.mockResolvedValue(mockCameraPermission);
      requestMediaLibraryPermissionsAsync.mockResolvedValue(mockMediaLibraryPermission);

      const result = await DocumentService.requestPermissions();

      expect(result).toEqual({
        camera: false,
        mediaLibrary: false
      });
    });
  });

  describe('uploadFromDevice', () => {
    it('should upload document from device successfully', async () => {
      const mockAsset = {
        uri: 'file://test.pdf',
        type: 'application/pdf'
      };
      const mockResult = { canceled: false, assets: [mockAsset] };

      (require('expo-image-picker').launchImageLibraryAsync as jest.Mock)
        .mockResolvedValue(mockResult);
      (require('expo-file-system').readAsStringAsync as jest.Mock)
        .mockResolvedValue('base64data');
      (StorageService.saveEncryptedFile as jest.Mock)
        .mockResolvedValue('/documents/user123/file.pdf');
      (StorageService.getFileInfo as jest.Mock)
        .mockResolvedValue({ size: 1024 });

      const result = await DocumentService.uploadFromDevice('user123', 'encryptionKey');

      expect(require('expo-image-picker').launchImageLibraryAsync).toHaveBeenCalled();
      expect(StorageService.saveEncryptedFile).toHaveBeenCalledWith(
        'base64data',
        'test.pdf',
        'user123',
        'encryptionKey',
        'application/pdf',
        undefined,
        undefined
      );
      expect(result).toEqual({
        id: expect.any(String),
        name: 'test.pdf',
        path: '/documents/user123/file.pdf',
        size: 1024,
        mimeType: 'application/pdf'
      });
    });

    it('should return null when upload is canceled', async () => {
      const mockResult = { canceled: true, assets: [] };

      (require('expo-image-picker').launchImageLibraryAsync as jest.Mock)
        .mockResolvedValue(mockResult);

      const result = await DocumentService.uploadFromDevice('user123', 'encryptionKey');

      expect(result).toBe(null);
    });
  });

  describe('scanWithCamera', () => {
    it('should scan document with camera successfully', async () => {
      const mockAsset = {
        uri: 'file://scan.jpg',
        type: 'image'
      };
      const mockResult = { canceled: false, assets: [mockAsset] };

      (require('expo-image-picker').launchCameraAsync as jest.Mock)
        .mockResolvedValue(mockResult);
      (require('expo-file-system').readAsStringAsync as jest.Mock)
        .mockResolvedValue('base64imagedata');
      (StorageService.saveEncryptedFile as jest.Mock)
        .mockResolvedValue('/documents/user123/scan.jpg');
      (StorageService.getFileInfo as jest.Mock)
        .mockResolvedValue({ size: 2048 });

      const result = await DocumentService.scanWithCamera('user123', 'encryptionKey');

      expect(require('expo-image-picker').launchCameraAsync).toHaveBeenCalled();
      expect(StorageService.saveEncryptedFile).toHaveBeenCalledWith(
        'base64imagedata',
        expect.stringMatching(/^scan_\d+\.jpg$/),
        'user123',
        'encryptionKey',
        'image/jpeg',
        undefined,
        undefined
      );
      expect(result).toEqual({
        id: expect.any(String),
        name: expect.stringMatching(/^scan_\d+\.jpg$/),
        path: '/documents/user123/scan.jpg',
        size: 2048,
        mimeType: 'image/jpeg'
      });
    });
  });

  describe('getDocumentsByCategory', () => {
    it('should get documents by category', async () => {
      const mockDocuments = [
        { id: '1', category: 'Work', name: 'doc1.pdf' },
        { id: '2', category: 'Personal', name: 'doc2.pdf' },
        { id: '3', category: 'Work', name: 'doc3.pdf' }
      ];

      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue(mockDocuments);

      const result = await DocumentService.getDocumentsByCategory('user123', 'Work');

      expect(DatabaseService.getDocumentsByUser).toHaveBeenCalledWith('user123');
      expect(result).toEqual([
        { id: '1', category: 'Work', name: 'doc1.pdf' },
        { id: '3', category: 'Work', name: 'doc3.pdf' }
      ]);
    });

    it('should return all documents when no category specified', async () => {
      const mockDocuments = [
        { id: '1', category: 'Work', name: 'doc1.pdf' },
        { id: '2', category: 'Personal', name: 'doc2.pdf' }
      ];

      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue(mockDocuments);

      const result = await DocumentService.getDocumentsByCategory('user123');

      expect(result).toEqual(mockDocuments);
    });
  });

  describe('getDocumentsPaginated', () => {
    it('should get paginated documents', async () => {
      const mockResult = {
        documents: [{ id: '1', name: 'doc1.pdf' }],
        totalCount: 50,
        hasMore: true
      };

      (DatabaseService.getDocumentsByUserPaginated as jest.Mock).mockResolvedValue(mockResult);

      const result = await DocumentService.getDocumentsPaginated('user123', 1, 20);

      expect(DatabaseService.getDocumentsByUserPaginated).toHaveBeenCalledWith('user123', 1, 20);
      expect(result).toEqual(mockResult);
    });
  });

  describe('searchDocuments', () => {
    it('should search documents by name', async () => {
      const mockDocuments = [
        { id: '1', name: 'work_report.pdf', category: 'Work' },
        { id: '2', name: 'personal_letter.pdf', category: 'Personal' }
      ];

      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue(mockDocuments);

      const result = await DocumentService.searchDocuments('user123', 'work');

      expect(result).toEqual([{ id: '1', name: 'work_report.pdf', category: 'Work' }]);
    });

    it('should search documents by category', async () => {
      const mockDocuments = [
        { id: '1', name: 'doc1.pdf', category: 'Work' },
        { id: '2', name: 'doc2.pdf', category: 'Personal' }
      ];

      (DatabaseService.getDocumentsByUser as jest.Mock).mockResolvedValue(mockDocuments);

      const result = await DocumentService.searchDocuments('user123', 'personal');

      expect(result).toEqual([{ id: '2', name: 'doc2.pdf', category: 'Personal' }]);
    });
  });

  describe('searchDocumentsPaginated', () => {
    it('should search documents with pagination', async () => {
      const mockResult = {
        documents: [{ id: '1', name: 'work_doc.pdf' }],
        totalCount: 10,
        hasMore: false
      };

      (DatabaseService.searchDocumentsPaginated as jest.Mock).mockResolvedValue(mockResult);

      const result = await DocumentService.searchDocumentsPaginated('user123', 'work', 1, 20);

      expect(DatabaseService.searchDocumentsPaginated).toHaveBeenCalledWith('user123', 'work', 1, 20);
      expect(result).toEqual(mockResult);
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const result = await DocumentService.createCategory('user123', 'New Category', '#FF0000');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('updateDocumentCategory', () => {
    it('should update document category', async () => {
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await DocumentService.updateDocumentCategory('doc123', 'New Category', 'user123');

      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'DOCUMENT_CATEGORY_UPDATED',
        'Document doc123 category updated to New Category'
      );
    });
  });
});
