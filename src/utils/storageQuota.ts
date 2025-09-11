// Storage quota management utilities
import { Document } from '../types';

export interface StorageQuotaInfo {
  used: number;
  remaining: number;
  total: number;
  usagePercent: number;
}

export interface StorageCleanupResult {
  cleaned: boolean;
  freedSpace: number;
  error?: string;
}

export class StorageQuotaManager {
  private static readonly QUOTA_WARNING_THRESHOLD = 0.8; // 80%
  private static readonly QUOTA_CRITICAL_THRESHOLD = 0.95; // 95%
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB estimate for localStorage

  // Check current storage usage
  static getStorageInfo(): StorageQuotaInfo {
    let used = 0;
    const total = this.MAX_STORAGE_SIZE;

    try {
      // Calculate current usage
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          const value = localStorage.getItem(key) || '';
          used += key.length + value.length;
        }
      }

      const remaining = Math.max(0, total - used);
      const usagePercent = used / total;

      return {
        used,
        remaining,
        total,
        usagePercent,
      };
    } catch (error) {
      console.error('Failed to calculate storage info:', error);
      return {
        used: total, // Assume full if we can't calculate
        remaining: 0,
        total,
        usagePercent: 1,
      };
    }
  }

  // Check if there's enough space for new data
  static hasSpaceFor(dataSize: number): boolean {
    const info = this.getStorageInfo();
    return info.remaining >= dataSize * 1.1; // Add 10% buffer
  }

  // Check if storage is near quota limits
  static checkQuotaStatus(): 'normal' | 'warning' | 'critical' {
    const info = this.getStorageInfo();

    if (info.usagePercent >= this.QUOTA_CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (info.usagePercent >= this.QUOTA_WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'normal';
  }

  // Deduplicate documents based on ID and name
  static deduplicateDocuments(documents: Document[]): Document[] {
    const seen = new Set<string>();
    const unique: Document[] = [];

    for (const doc of documents) {
      const key = `${doc.id}_${doc.name}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(doc);
      } else {
        console.log(`Skipping duplicate document: ${doc.name} (${doc.id})`);
      }
    }

    return unique;
  }
  static async cleanupOldDocuments(): Promise<StorageCleanupResult> {
    try {
      console.log('Starting storage cleanup...');
      const initialInfo = this.getStorageInfo();
      console.log(
        `Initial storage usage: ${this.formatBytes(initialInfo.used)} (${Math.round(initialInfo.usagePercent * 100)}%)`
      );

      // Log what's currently in localStorage
      console.log('Current localStorage keys:', Object.keys(localStorage));

      // Get all storage items
      const documentsData = localStorage.getItem('docsshelf_documents');
      const filesData = localStorage.getItem('docsshelf_files');
      const persistDocsData = localStorage.getItem('persist:documents');

      let cleaned = false;

      // Remove files data (largest items) - always remove if exists
      if (filesData) {
        const filesSize = filesData.length;
        localStorage.removeItem('docsshelf_files');
        cleaned = true;
        console.log(`Removed files data: ${this.formatBytes(filesSize)}`);
      } else {
        console.log('No files data found to remove');
      }

      // Clear Redux persist documents - always remove if exists
      if (persistDocsData) {
        const persistSize = persistDocsData.length;
        localStorage.removeItem('persist:documents');
        cleaned = true;
        console.log(`Removed persist data: ${this.formatBytes(persistSize)}`);
      } else {
        console.log('No persist documents found to remove');
      }

      // Clean up documents - remove duplicates and keep only recent ones
      if (documentsData) {
        try {
          const documents = JSON.parse(documentsData);
          console.log(
            `Found ${documents.length} documents to potentially clean`
          );

          // Remove duplicates using helper function
          const uniqueDocuments = this.deduplicateDocuments(documents);

          if (uniqueDocuments.length !== documents.length) {
            console.log(
              `Removed ${documents.length - uniqueDocuments.length} duplicate documents`
            );
            cleaned = true;
          }

          // If we still have too many documents, keep only the most recent ones
          let documentsToKeep = uniqueDocuments;
          if (uniqueDocuments.length > 3) {
            // Sort by creation date (newest first)
            uniqueDocuments.sort(
              (a: Document, b: Document) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );

            documentsToKeep = uniqueDocuments.slice(0, 3); // Keep only 3 newest
            console.log(
              `Kept ${documentsToKeep.length} most recent documents, removed ${uniqueDocuments.length - documentsToKeep.length} older ones`
            );
            cleaned = true;
          }

          // Save the cleaned documents
          const newData = JSON.stringify(documentsToKeep);
          localStorage.setItem('docsshelf_documents', newData);
        } catch (parseError) {
          console.warn('Failed to parse documents data:', parseError);
          // If we can't parse it, remove it entirely
          localStorage.removeItem('docsshelf_documents');
          cleaned = true;
          console.log('Removed corrupted documents data');
        }
      } else {
        console.log('No documents data found');
      }

      // Clear any other persist data (more aggressive)
      const persistKeys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('persist:') &&
          key !== 'persist:auth' &&
          key !== 'persist:settings'
      );

      if (persistKeys.length > 0) {
        persistKeys.forEach((key) => {
          const itemSize = localStorage.getItem(key)?.length || 0;
          localStorage.removeItem(key);
          cleaned = true;
          console.log(`Removed ${key}: ${this.formatBytes(itemSize)}`);
        });
      } else {
        console.log('No additional persist data to clean');
      }

      // Also remove any large generic items if storage is still critical
      const storageAfterCleanup = this.getStorageInfo();
      if (storageAfterCleanup.usagePercent > 0.8) {
        console.log(
          'Storage still high after cleanup, removing additional items...'
        );

        // Remove any docsshelf_ prefixed items we might have missed
        const docShelfKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('docsshelf_') && key !== 'docsshelf_documents'
        );

        docShelfKeys.forEach((key) => {
          const itemSize = localStorage.getItem(key)?.length || 0;
          localStorage.removeItem(key);
          cleaned = true;
          console.log(
            `Removed additional item ${key}: ${this.formatBytes(itemSize)}`
          );
        });

        // If still critical, remove ALL documents
        if (storageAfterCleanup.usagePercent > 0.9) {
          console.log('Storage critically full, removing all documents');
          localStorage.removeItem('docsshelf_documents');
          cleaned = true;
        }
      }

      const finalInfo = this.getStorageInfo();
      const actualFreedSpace = initialInfo.used - finalInfo.used;

      console.log(
        `Cleanup completed: freed ${this.formatBytes(actualFreedSpace)}`
      );

      return {
        cleaned: actualFreedSpace > 0 || cleaned,
        freedSpace: actualFreedSpace,
      };
    } catch (error) {
      console.error('Storage cleanup failed:', error);
      return {
        cleaned: false,
        freedSpace: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Attempt to free space before storing new data
  static async ensureSpaceFor(dataSize: number): Promise<boolean> {
    // Check if we already have space
    if (this.hasSpaceFor(dataSize)) {
      return true;
    }

    console.log(
      `Insufficient space for ${dataSize} bytes, attempting cleanup...`
    );

    // Try to free space
    const cleanupResult = await this.cleanupOldDocuments();

    if (cleanupResult.cleaned) {
      console.log(
        `Cleanup successful: freed ${cleanupResult.freedSpace} bytes`
      );
      return this.hasSpaceFor(dataSize);
    }

    console.warn(
      'Storage cleanup failed or insufficient:',
      cleanupResult.error
    );
    return false;
  }

  // Clear all application data (emergency cleanup)
  static clearAllAppData(): void {
    const keysToRemove = [];

    for (const key in localStorage) {
      if (key.startsWith('docsshelf_') || key.startsWith('persist:')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} application storage keys`);
  }

  // Get storage usage by category
  static getStorageBreakdown(): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};

    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const value = localStorage.getItem(key) || '';
        const size = key.length + value.length;

        if (key.startsWith('docsshelf_')) {
          const category = key.replace('docsshelf_', '');
          breakdown[category] = size;
        } else if (key.startsWith('persist:')) {
          const category = key.replace('persist:', 'redux_');
          breakdown[category] = size;
        } else {
          breakdown['other'] = (breakdown['other'] || 0) + size;
        }
      }
    }

    return breakdown;
  }

  // Format bytes for display
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
