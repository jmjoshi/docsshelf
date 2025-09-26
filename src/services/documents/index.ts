// Document service for upload, scanning, and management
import { Platform } from 'react-native';
import * as ImagePicker from '../../mocks/expo-image-picker';
import * as DocumentPicker from '../../mocks/expo-document-picker';
import * as FileSystem from '../../mocks/expo-file-system';
// import { Camera } from 'expo-camera'; // Temporarily disabled due to build issues
import { StorageService } from '../storage';
import { DatabaseService, Document, QuotaExceededError } from '../database';
import { StorageQuotaManager } from '../../utils/storageQuota';

export interface UploadResult {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
}

export class DocumentService {
  // Request permissions for camera and media library
  static async requestPermissions(): Promise<{
    camera: boolean;
    mediaLibrary: boolean;
  }> {
    if (Platform.OS === 'web') {
      // Web doesn't need explicit permissions for file input
      return {
        camera: true,
        mediaLibrary: true,
      };
    }

    // Temporarily disabled camera permissions due to build issues
    // const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const cameraPermission = { granted: false }; // Mock response

    try {
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      return {
        camera: cameraPermission.granted,
        mediaLibrary: mediaLibraryPermission.granted,
      };
    } catch (error) {
      console.warn('Failed to request permissions:', error);
      return {
        camera: false,
        mediaLibrary: false,
      };
    }
  }

  // Upload document from device
  static async uploadFromDevice(
    userId: string,
    encryptionKey: string
  ): Promise<UploadResult | null> {
    if (Platform.OS === 'web') {
      return await this.uploadFromDeviceWeb(userId, encryptionKey);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = asset.name;
      const mimeType = asset.mimeType || 'application/octet-stream';

      // Read file data
      const fileData = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      // Save encrypted file
      const filePath = await StorageService.saveEncryptedFile(
        fileData,
        fileName,
        userId,
        encryptionKey,
        mimeType,
        undefined, // category
        undefined // folder
      );

      // Get file info
      const fileInfo = await StorageService.getFileInfo(filePath);

      return {
        id: filePath.split('/').pop() || '',
        name: fileName,
        path: filePath,
        size: fileInfo.size,
        mimeType,
      };
    } catch (error) {
      console.error('Failed to upload from device:', error);
      throw error;
    }
  }

  // Upload document from device (Web version)
  static async uploadFromDeviceWeb(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _encryptionKey: string // Future: implement web-based encryption
  ): Promise<UploadResult | null> {
    return new Promise((resolve, reject) => {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '*/*';
      fileInput.style.display = 'none';

      fileInput.addEventListener('change', async (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          resolve(null);
          return;
        }

        try {
          // Read file as base64
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const base64Data = (e.target?.result as string).split(',')[1];
              const fileName = file.name;
              const mimeType = file.type || 'application/octet-stream';

              // Calculate storage requirements
              const fileDataSize = base64Data.length;
              const metadataSize = JSON.stringify({
                name: fileName,
                size: file.size,
                mimeType,
              }).length;
              const totalSize = fileDataSize + metadataSize;

              // Check storage quota before saving
              if (!StorageQuotaManager.hasSpaceFor(totalSize)) {
                const quotaStatus = StorageQuotaManager.checkQuotaStatus();

                if (quotaStatus === 'critical') {
                  // Try to free space automatically
                  const spaceFreed =
                    await StorageQuotaManager.ensureSpaceFor(totalSize);
                  if (!spaceFreed) {
                    throw new QuotaExceededError(
                      'Storage full! Please delete some documents before uploading new ones.'
                    );
                  }
                } else {
                  throw new QuotaExceededError(
                    'Not enough storage space. Please delete some documents first.'
                  );
                }
              }

              // Save file using storage service (simulate encryption)
              const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;

              // For web demo, we'll just save to localStorage
              const fileData = {
                id,
                name: fileName,
                data: base64Data,
                size: file.size,
                mimeType,
                userId,
                createdAt: new Date().toISOString(),
              };

              // Save to localStorage (simulate encrypted storage)
              const existingFiles = JSON.parse(
                localStorage.getItem('docsshelf_files') || '[]'
              );
              existingFiles.push(fileData);
              localStorage.setItem(
                'docsshelf_files',
                JSON.stringify(existingFiles)
              );

              // Also save metadata to database
              await DatabaseService.saveDocumentMetadata(
                userId,
                fileName,
                `web-storage://${id}`, // Virtual path for web storage
                file.size,
                mimeType,
                'General',
                'Uploads'
              );

              resolve({
                id,
                name: fileName,
                path: `web-storage://${id}`,
                size: file.size,
                mimeType,
              });
            } catch (error) {
              if (error instanceof QuotaExceededError) {
                // Show user-friendly error message
                const storageInfo = StorageQuotaManager.getStorageInfo();
                alert(
                  `Upload failed: ${error.message}\n\nStorage info:\n${StorageQuotaManager.formatBytes(storageInfo.used)} used of ${StorageQuotaManager.formatBytes(storageInfo.total)} available.`
                );
              }
              reject(error);
            }
          };

          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };

          reader.readAsDataURL(file);
        } catch (error) {
          reject(error);
        } finally {
          // Clean up
          document.body.removeChild(fileInput);
        }
      });

      fileInput.addEventListener('cancel', () => {
        document.body.removeChild(fileInput);
        resolve(null);
      });

      // Add to DOM and trigger click
      document.body.appendChild(fileInput);
      fileInput.click();
    });
  }

  // Upload image from gallery
  static async uploadImage(
    userId: string,
    encryptionKey: string
  ): Promise<UploadResult | null> {
    if (Platform.OS === 'web') {
      // Web functionality temporarily disabled
      throw new Error('Image upload not available on web platform');
    }

    try {
      // Request permission
      await ImagePicker.requestMediaLibraryPermissionsAsync();

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || 'uploaded_file';
      const mimeType =
        asset.type === 'image'
          ? 'image/jpeg'
          : asset.type || 'application/octet-stream';

      // Read file data
      const fileData = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });

      // Save encrypted file
      const filePath = await StorageService.saveEncryptedFile(
        fileData,
        fileName,
        userId,
        encryptionKey,
        mimeType,
        undefined, // category
        undefined // folder
      );

      // Get file info
      const fileInfo = await StorageService.getFileInfo(filePath);

      return {
        id: filePath.split('/').pop() || '',
        name: fileName,
        path: filePath,
        size: fileInfo.size,
        mimeType,
      };
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  // Scan document using camera
  static async scanWithCamera(
    userId: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    encryptionKey: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<UploadResult | null> {
    // Temporarily disabled due to build issues
    throw new Error(
      'Camera functionality is temporarily disabled due to build issues. ' +
        'Please use upload from device instead.'
    );
  }

  // Get documents by category
  static async getDocumentsByCategory(
    userId: string,
    category?: string
  ): Promise<Document[]> {
    try {
      const documents = await DatabaseService.getDocumentsByUser(userId);
      if (category) {
        return documents.filter((doc: Document) => doc.category === category);
      }
      return documents;
    } catch (error) {
      console.error('Failed to get documents by category:', error);
      throw error;
    }
  }

  // Get documents with pagination
  static async getDocumentsPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ documents: Document[]; totalCount: number; hasMore: boolean }> {
    try {
      return await DatabaseService.getDocumentsByUserPaginated(
        userId,
        page,
        pageSize
      );
    } catch (error) {
      console.error('Failed to get paginated documents:', error);
      throw error;
    }
  }

  // Search documents
  static async searchDocuments(
    userId: string,
    query: string
  ): Promise<Document[]> {
    try {
      const documents = await DatabaseService.getDocumentsByUser(userId);
      const lowerQuery = query.toLowerCase();
      return documents.filter(
        (doc: Document) =>
          doc.name.toLowerCase().includes(lowerQuery) ||
          (doc.category && doc.category.toLowerCase().includes(lowerQuery)) ||
          (doc.tags &&
            doc.tags.some((tag: string) =>
              tag.toLowerCase().includes(lowerQuery)
            ))
      );
    } catch (error) {
      console.error('Failed to search documents:', error);
      throw error;
    }
  }

  // Delete document
  static async deleteDocument(
    documentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await DatabaseService.deleteDocument(documentId, userId);
      // Also delete the file from storage
      await StorageService.deleteFile(documentId, userId);
      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  // Update document
  static async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<boolean> {
    try {
      await DatabaseService.updateDocument(documentId, updates);
      return true;
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  }
}
