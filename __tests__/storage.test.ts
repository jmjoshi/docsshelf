/// <reference types="jest" />

// Unit tests for StorageService
import { StorageService } from '../src/services/storage';
import { EncryptionService } from '../src/services/encryption';
import { DatabaseService } from '../src/services/database';

// Mock dependencies
jest.mock('../src/services/encryption');
jest.mock('../src/services/database');
jest.mock('expo-file-system', () => ({
  documentDirectory: 'mock/documentDirectory/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static properties
    (StorageService as any).DOCUMENTS_DIR = 'mock/documents/';
  });

  describe('initStorage', () => {
    it('should initialize storage directory successfully', async () => {
      const mockDirInfo = { exists: false };

      (require('expo-file-system').getInfoAsync as jest.Mock).mockResolvedValue(
        mockDirInfo
      );
      (
        require('expo-file-system').makeDirectoryAsync as jest.Mock
      ).mockResolvedValue(undefined);

      await StorageService.initStorage();

      expect(require('expo-file-system').getInfoAsync).toHaveBeenCalledWith(
        'mock/documents/'
      );
      expect(
        require('expo-file-system').makeDirectoryAsync
      ).toHaveBeenCalledWith('mock/documents/', {
        intermediates: true,
      });
    });

    it('should not create directory if it already exists', async () => {
      const mockDirInfo = { exists: true };

      (require('expo-file-system').getInfoAsync as jest.Mock).mockResolvedValue(
        mockDirInfo
      );

      await StorageService.initStorage();

      expect(
        require('expo-file-system').makeDirectoryAsync
      ).not.toHaveBeenCalled();
    });
  });

  describe('saveEncryptedFile', () => {
    it('should save encrypted file successfully', async () => {
      const mockEncryptedData = 'encryptedData';

      (EncryptionService.encryptFile as jest.Mock).mockResolvedValue(
        mockEncryptedData
      );
      (
        require('expo-file-system').writeAsStringAsync as jest.Mock
      ).mockResolvedValue(undefined);
      (DatabaseService.saveDocumentMetadata as jest.Mock).mockResolvedValue(
        'doc123'
      );
      (require('expo-file-system').getInfoAsync as jest.Mock).mockResolvedValue(
        {
          exists: true,
          size: 1024,
        }
      );

      const result = await StorageService.saveEncryptedFile(
        'fileData',
        'test.pdf',
        'user123',
        'encryptionKey',
        'application/pdf',
        'Work',
        'Projects'
      );

      expect(EncryptionService.encryptFile).toHaveBeenCalledWith(
        'fileData',
        'encryptionKey'
      );
      expect(
        require('expo-file-system').writeAsStringAsync
      ).toHaveBeenCalledWith(
        expect.stringMatching(/^mock\/documents\/user123_\d+_test\.pdf$/),
        mockEncryptedData,
        { encoding: require('expo-file-system').EncodingType.Base64 }
      );
      expect(DatabaseService.saveDocumentMetadata).toHaveBeenCalledWith(
        'user123',
        'test.pdf',
        expect.stringMatching(/^mock\/documents\/user123_\d+_test\.pdf$/),
        1024,
        'application/pdf',
        'Work',
        'Projects'
      );
      expect(result).toMatch(/^mock\/documents\/user123_\d+_test\.pdf$/);
    });
  });

  describe('readEncryptedFile', () => {
    it('should read and decrypt file successfully', async () => {
      const mockEncryptedData = 'encryptedData';
      const mockDecryptedData = 'decryptedData';

      (
        require('expo-file-system').readAsStringAsync as jest.Mock
      ).mockResolvedValue(mockEncryptedData);
      (EncryptionService.decryptFile as jest.Mock).mockResolvedValue(
        mockDecryptedData
      );

      const result = await StorageService.readEncryptedFile(
        '/path/to/file.pdf',
        'encryptionKey'
      );

      expect(
        require('expo-file-system').readAsStringAsync
      ).toHaveBeenCalledWith('/path/to/file.pdf', {
        encoding: require('expo-file-system').EncodingType.Base64,
      });
      expect(EncryptionService.decryptFile).toHaveBeenCalledWith(
        mockEncryptedData,
        'encryptionKey'
      );
      expect(result).toBe(mockDecryptedData);
    });
  });

  describe('deleteFile', () => {
    it('should delete file and log audit successfully', async () => {
      (require('expo-file-system').deleteAsync as jest.Mock).mockResolvedValue(
        undefined
      );
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await StorageService.deleteFile('/path/to/file.pdf', 'user123');

      expect(require('expo-file-system').deleteAsync).toHaveBeenCalledWith(
        '/path/to/file.pdf'
      );
      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'FILE_DELETED',
        'File deleted: /path/to/file.pdf'
      );
    });
  });

  describe('getFileInfo', () => {
    it('should get file info successfully', async () => {
      const mockFileInfo = {
        exists: true,
        size: 2048,
        modificationTime: 1234567890,
      };

      (require('expo-file-system').getInfoAsync as jest.Mock).mockResolvedValue(
        mockFileInfo
      );

      const result = await StorageService.getFileInfo('/path/to/file.pdf');

      expect(require('expo-file-system').getInfoAsync).toHaveBeenCalledWith(
        '/path/to/file.pdf'
      );
      expect(result).toEqual({
        size: 2048,
        modificationTime: 1234567890,
      });
    });

    it('should return zero values for non-existent file', async () => {
      const mockFileInfo = { exists: false };

      (require('expo-file-system').getInfoAsync as jest.Mock).mockResolvedValue(
        mockFileInfo
      );

      const result = await StorageService.getFileInfo('/path/to/missing.pdf');

      expect(result).toEqual({
        size: 0,
        modificationTime: 0,
      });
    });
  });

  describe('listUserFiles', () => {
    it('should list user files successfully', async () => {
      const mockFiles = [
        'user123_1234567890_doc1.pdf',
        'user456_1234567891_doc2.pdf',
        'user123_1234567892_doc3.pdf',
      ];

      (
        require('expo-file-system').readDirectoryAsync as jest.Mock
      ).mockResolvedValue(mockFiles);

      const result = await StorageService.listUserFiles('user123');

      expect(
        require('expo-file-system').readDirectoryAsync
      ).toHaveBeenCalledWith('mock/documents/');
      expect(result).toEqual([
        'mock/documents/user123_1234567890_doc1.pdf',
        'mock/documents/user123_1234567892_doc3.pdf',
      ]);
    });

    it('should return empty array when no files found', async () => {
      (
        require('expo-file-system').readDirectoryAsync as jest.Mock
      ).mockResolvedValue([]);

      const result = await StorageService.listUserFiles('user123');

      expect(result).toEqual([]);
    });
  });

  describe('moveFile', () => {
    it('should move file successfully', async () => {
      (require('expo-file-system').moveAsync as jest.Mock).mockResolvedValue(
        undefined
      );
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await StorageService.moveFile(
        '/old/path/file.pdf',
        '/new/path/file.pdf',
        'user123'
      );

      expect(require('expo-file-system').moveAsync).toHaveBeenCalledWith({
        from: '/old/path/file.pdf',
        to: '/new/path/file.pdf',
      });
      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'FILE_MOVED',
        'File moved from /old/path/file.pdf to /new/path/file.pdf'
      );
    });
  });

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      (require('expo-file-system').copyAsync as jest.Mock).mockResolvedValue(
        undefined
      );
      (DatabaseService.logAudit as jest.Mock).mockResolvedValue(undefined);

      await StorageService.copyFile(
        '/source/file.pdf',
        '/dest/file.pdf',
        'user123'
      );

      expect(require('expo-file-system').copyAsync).toHaveBeenCalledWith({
        from: '/source/file.pdf',
        to: '/dest/file.pdf',
      });
      expect(DatabaseService.logAudit).toHaveBeenCalledWith(
        'user123',
        'FILE_COPIED',
        'File copied from /source/file.pdf to /dest/file.pdf'
      );
    });
  });
});
