// Document service for upload, scanning, and management
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';
import { StorageService } from '../storage';
import { DatabaseService, Document } from '../database';

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
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    const mediaLibraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return {
      camera: cameraPermission.granted,
      mediaLibrary: mediaLibraryPermission.granted,
    };
  }

  // Upload document from device
  static async uploadFromDevice(
    userId: string,
    encryptionKey: string
  ): Promise<UploadResult | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
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
        encoding: FileSystem.EncodingType.Base64,
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

  // Scan document using camera
  static async scanWithCamera(
    userId: string,
    encryptionKey: string
  ): Promise<UploadResult | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const fileName = `scan_${Date.now()}.jpg`;
      const mimeType = 'image/jpeg';

      // Read file data
      const fileData = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
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
      console.error('Failed to scan with camera:', error);
      throw error;
    }
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

  // Create category
  static async createCategory(
    userId: string,
    name: string,
    color: string = '#007AFF' // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<string> {
    try {
      // For now, categories are not stored in DB, just return id
      // TODO: Implement category storage in DB with color: ${color}
      const id = Date.now().toString();
      return id;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  // Update document category
  static async updateDocumentCategory(
    documentId: string,
    category: string,
    userId: string
  ): Promise<void> {
    try {
      // TODO: Implement update in DB
      await DatabaseService.logAudit(
        userId,
        'DOCUMENT_CATEGORY_UPDATED',
        `Document ${documentId} category updated to ${category}`
      );
    } catch (error) {
      console.error('Failed to update document category:', error);
      throw error;
    }
  }
}
