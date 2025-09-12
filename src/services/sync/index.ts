// Sync service for bidirectional synchronization between Redux and database

import { store } from '../../store/store';
import { DatabaseService, Document, Category } from '../database';
import { setCategories } from '../../store/slices/documentsSlice';

class SyncServiceClass {
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = true;
  private isSyncing = false; // Prevent overlapping syncs

  // Initialize sync service
  initialize() {
    this.startPeriodicSync();
    this.setupOnlineOfflineListeners();
  }

  // Start periodic sync every 5 minutes (increased from 30 seconds to reduce load)
  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 300000); // 5 minutes instead of 30 seconds
  }

  // Setup online/offline listeners
  private setupOnlineOfflineListeners() {
    // In React Native, we can use NetInfo for network status
    // For now, we'll assume online status
    this.isOnline = true;
  }

  // Main sync function
  async sync() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    
    try {
      const state = store.getState();
      const userId = state.auth.user?.id;

      if (!userId) {
        this.isSyncing = false;
        return;
      }

      console.log('Starting sync...');

      // Sync documents
      await this.syncDocuments(userId);

      // Sync categories
      await this.syncCategories(userId);

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync documents between Redux and database
  private async syncDocuments(userId: string) {
    try {
      // Get documents from database
      const dbDocuments = await DatabaseService.getDocumentsByUser(userId);

      // Get documents from Redux
      const reduxDocuments = store.getState().documents.documents;

      // Only sync on initial load (when Redux is completely empty)
      // This prevents the infinite loop by avoiding unnecessary Redux updates
      if (reduxDocuments.length === 0 && dbDocuments.length > 0) {
        console.log(
          `Syncing ${dbDocuments.length} documents from database to Redux`
        );
        store.dispatch({
          type: 'documents/setDocuments',
          payload: dbDocuments,
          meta: { skipSync: true }, // Flag to prevent sync middleware from triggering
        });
        return;
      }

      // Find documents that exist in Redux but not in database (need to be saved)
      const documentsToSync = reduxDocuments.filter(
        (reduxDoc) =>
          reduxDoc.userId === userId &&
          (!reduxDoc.isSynced ||
            !dbDocuments.some((dbDoc) => dbDoc.id === reduxDoc.id))
      );

      // Sync unsynced documents to database (without triggering Redux updates)
      for (const doc of documentsToSync) {
        try {
          await DatabaseService.saveDocumentMetadata(
            doc.userId,
            doc.name,
            doc.path,
            doc.size,
            doc.mimeType,
            doc.category,
            doc.folder,
            doc.tags,
            doc.ocrText,
            doc.id // Use existing ID to prevent duplicates
          );
          console.log(`Synced document ${doc.name} to database`);
        } catch (error) {
          console.error(`Failed to sync document ${doc.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Document sync failed:', error);
    }
  }

  // Sync categories between Redux and database
  private async syncCategories(userId: string) {
    try {
      // Get categories from database
      const dbCategories = await DatabaseService.getCategoriesByUser(userId);

      // Get categories from Redux
      const reduxCategories = store.getState().documents.categories;

      // Find categories that need to be synced to Redux
      const categoriesToAdd = dbCategories.filter(
        (dbCat) => !reduxCategories.some((reduxCat) => reduxCat.id === dbCat.id)
      );

      // Add new categories to Redux
      if (categoriesToAdd.length > 0) {
        const transformedCategories = dbCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          userId: userId,
          createdAt: cat.createdAt,
          updatedAt: cat.createdAt, // Use createdAt as fallback for updatedAt
        }));
        store.dispatch(setCategories(transformedCategories));
      }
    } catch (error) {
      console.error('Category sync failed:', error);
    }
  }

  // Force immediate sync
  async forceSync() {
    await this.sync();
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: new Date().toISOString(),
    };
  }

  // Handle individual document changes
  async handleDocumentChange(
    action: 'add' | 'update' | 'delete',
    document: Document
  ) {
    try {
      const state = store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      switch (action) {
        case 'add': {
          // Check if document already exists in database to avoid duplicates
          const existingDocs = await DatabaseService.getDocumentsByUser(userId);
          const docExists = existingDocs.some((doc) => doc.id === document.id);
          
          if (!docExists) {
            // Document is already added to Redux, now save to database with existing ID
            await DatabaseService.saveDocumentMetadata(
              userId,
              document.name,
              document.path,
              document.size,
              document.mimeType,
              document.category,
              document.folder,
              document.tags,
              document.ocrText,
              document.id // Pass the existing document ID
            );
            console.log(`Document ${document.name} synced to database`);
          } else {
            console.log(
              `Document ${document.name} already exists in database, skipping`
            );
          }
          break;
        }
        case 'update':
          // Update document in database
          await DatabaseService.updateDocument(document.id, {
            ...document,
            userId,
          });
          break;
        case 'delete':
          // Delete document from database
          await DatabaseService.deleteDocument(document.id, userId);
          break;
      }
    } catch (error) {
      console.error('Failed to handle document change:', error);
      // Don't rethrow to avoid breaking the app
    }
  }

  // Handle individual category changes
  async handleCategoryChange(
    action: 'add' | 'update' | 'delete',
    category: Category
  ) {
    try {
      const state = store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      switch (action) {
        case 'add':
          // Category is already added to Redux, create in database
          await DatabaseService.createCategory({
            userId,
            name: category.name,
            color: category.color,
          });
          break;
        case 'update':
          // Update category in database
          await DatabaseService.updateCategory(category.id, {
            name: category.name,
            color: category.color,
          });
          break;
        case 'delete':
          // Delete category from database
          await DatabaseService.deleteCategory(category.id, userId);
          break;
      }
    } catch (error) {
      console.error('Failed to handle category change:', error);
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const SyncService = new SyncServiceClass();
