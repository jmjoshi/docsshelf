// Storage service for file operations with encryption
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { EncryptionService } from '../encryption';
import { DatabaseService } from '../database';

export class StorageService {
  private static readonly DOCUMENTS_DIR =
    FileSystem.documentDirectory + 'documents/';

  // Initialize storage directories
  static async initStorage(): Promise<void> {
    if (Platform.OS === 'web') {
      // Web storage doesn't need initialization
      return Promise.resolve();
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(this.DOCUMENTS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DOCUMENTS_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  // Save encrypted file
  static async saveEncryptedFile(
    fileData: string,
    fileName: string,
    userId: string,
    encryptionKey: string,
    mimeType?: string,
    category?: string,
    folder?: string
  ): Promise<string> {
    if (Platform.OS === 'web') {
      // For web, just return a mock path for now
      return Promise.resolve(`web-${userId}-${fileName}`);
    }

    try {
      // Encrypt the file data
      const encryptedData = await EncryptionService.encryptFile(
        fileData,
        encryptionKey
      );

      // Generate unique file path
      const filePath = `${this.DOCUMENTS_DIR}${userId}_${Date.now()}_${fileName}`;

      // Write encrypted data to file
      await FileSystem.writeAsStringAsync(filePath, encryptedData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save metadata to database
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      await DatabaseService.saveDocumentMetadata(
        userId,
        fileName,
        filePath,
        fileInfo.exists ? fileInfo.size || 0 : 0,
        mimeType,
        category,
        folder
      );

      return filePath;
    } catch (error) {
      console.error('Failed to save encrypted file:', error);
      throw error;
    }
  }

  // Read and decrypt file
  static async readEncryptedFile(
    filePath: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      // Read encrypted data from file
      const encryptedData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decrypt the data
      const decryptedData = await EncryptionService.decryptFile(
        encryptedData,
        encryptionKey
      );

      return decryptedData;
    } catch (error) {
      console.error('Failed to read encrypted file:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(filePath: string, userId: string): Promise<void> {
    try {
      // Delete physical file
      await FileSystem.deleteAsync(filePath);

      // Log deletion in audit
      await DatabaseService.logAudit(
        userId,
        'FILE_DELETED',
        `File deleted: ${filePath}`
      );
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  static async getFileInfo(
    filePath: string
  ): Promise<{ size: number; modificationTime: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return {
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        modificationTime: fileInfo.exists ? fileInfo.modificationTime || 0 : 0,
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  // List user files
  static async listUserFiles(userId: string): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.DOCUMENTS_DIR);
      return files
        .filter((file) => file.startsWith(`${userId}_`))
        .map((file) => `${this.DOCUMENTS_DIR}${file}`);
    } catch (error) {
      console.error('Failed to list user files:', error);
      return [];
    }
  }

  // Move file to new location
  static async moveFile(
    oldPath: string,
    newPath: string,
    userId: string
  ): Promise<void> {
    try {
      await FileSystem.moveAsync({
        from: oldPath,
        to: newPath,
      });
      await DatabaseService.logAudit(
        userId,
        'FILE_MOVED',
        `File moved from ${oldPath} to ${newPath}`
      );
    } catch (error) {
      console.error('Failed to move file:', error);
      throw error;
    }
  }

  // Copy file
  static async copyFile(
    sourcePath: string,
    destinationPath: string,
    userId: string
  ): Promise<void> {
    try {
      await FileSystem.copyAsync({
        from: sourcePath,
        to: destinationPath,
      });
      await DatabaseService.logAudit(
        userId,
        'FILE_COPIED',
        `File copied from ${sourcePath} to ${destinationPath}`
      );
    } catch (error) {
      console.error('Failed to copy file:', error);
      throw error;
    }
  }
}
