// Web-compatible storage service using browser APIs

const STORAGE_KEY_PREFIX = 'docsshelf_file_';
const METADATA_KEY_PREFIX = 'docsshelf_meta_';

interface FileMetadata {
  id: string;
  name: string;
  userId: string;
  mimeType?: string;
  category?: string;
  folder?: string;
  size: number;
  createdAt: string;
}

// Web implementation using localStorage/IndexedDB
export const WebStorageService = {
  // Initialize storage (no-op for web)
  async initStorage(): Promise<void> {
    // Web storage is always available
    return Promise.resolve();
  },

  // Save file data to browser storage
  async saveEncryptedFile(
    fileData: string,
    fileName: string,
    userId: string,
    encryptionKey: string,
    mimeType?: string,
    category?: string,
    folder?: string
  ): Promise<string> {
    try {
      const fileId = `${userId}_${Date.now()}_${fileName}`;
      const filePath = `${STORAGE_KEY_PREFIX}${fileId}`;

      // Store file data in localStorage
      localStorage.setItem(filePath, fileData);

      // Store metadata
      const metadata = {
        id: fileId,
        name: fileName,
        userId,
        mimeType,
        category,
        folder,
        size: fileData.length,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        `${METADATA_KEY_PREFIX}${fileId}`,
        JSON.stringify(metadata)
      );

      return filePath;
    } catch (error) {
      console.error('Web storage error:', error);
      throw error;
    }
  },

  // Read encrypted file from browser storage
  async readEncryptedFile(filePath: string): Promise<string> {
    try {
      const data = localStorage.getItem(filePath);
      if (!data) {
        throw new Error('File not found');
      }
      return data;
    } catch (error) {
      console.error('Web file read error:', error);
      throw error;
    }
  },

  // Get file info
  async getFileInfo(filePath: string): Promise<FileMetadata> {
    try {
      const fileId = filePath.replace(STORAGE_KEY_PREFIX, '');
      const metadataStr = localStorage.getItem(
        `${METADATA_KEY_PREFIX}${fileId}`
      );

      if (!metadataStr) {
        throw new Error('File metadata not found');
      }

      return JSON.parse(metadataStr) as FileMetadata;
    } catch (error) {
      console.error('Web file info error:', error);
      throw error;
    }
  },

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileId = filePath.replace(STORAGE_KEY_PREFIX, '');
      localStorage.removeItem(filePath);
      localStorage.removeItem(`${METADATA_KEY_PREFIX}${fileId}`);
    } catch (error) {
      console.error('Web file delete error:', error);
      throw error;
    }
  },
};

export default WebStorageService;
