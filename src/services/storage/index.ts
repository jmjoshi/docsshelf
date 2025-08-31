// Storage service for file operations with encryption
import RNFS from 'react-native-fs';
import { EncryptionService } from '../encryption';
import { DatabaseService } from '../database';

export class StorageService {
  private static readonly DOCUMENTS_DIR =
    RNFS.DocumentDirectoryPath + '/documents';

  // Initialize storage directories
  static async initStorage(): Promise<void> {
    try {
      const exists = await RNFS.exists(this.DOCUMENTS_DIR);
      if (!exists) {
        await RNFS.mkdir(this.DOCUMENTS_DIR);
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
    mimeType?: string
  ): Promise<string> {
    try {
      // Encrypt the file data
      const encryptedData = await EncryptionService.encryptFile(
        fileData,
        encryptionKey
      );

      // Generate unique file path
      const filePath = `${this.DOCUMENTS_DIR}/${userId}_${Date.now()}_${fileName}`;

      // Write encrypted data to file
      await RNFS.writeFile(filePath, encryptedData, 'base64');

      // Save metadata to database
      const fileStats = await RNFS.stat(filePath);
      await DatabaseService.saveDocumentMetadata(
        userId,
        fileName,
        filePath,
        parseInt(fileStats.size.toString(), 10),
        mimeType
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
      const encryptedData = await RNFS.readFile(filePath, 'base64');

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
      await RNFS.unlink(filePath);

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
  ): Promise<{ size: number; mtime: Date }> {
    try {
      const stat = await RNFS.stat(filePath);
      return {
        size: parseInt(stat.size.toString(), 10),
        mtime: new Date(stat.mtime),
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  // List user files
  static async listUserFiles(userId: string): Promise<string[]> {
    try {
      const files = await RNFS.readDir(this.DOCUMENTS_DIR);
      return files
        .filter((file: { name: string }) => file.name.startsWith(`${userId}_`))
        .map((file: { path: string }) => file.path);
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
      await RNFS.moveFile(oldPath, newPath);
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
      await RNFS.copyFile(sourcePath, destinationPath);
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
