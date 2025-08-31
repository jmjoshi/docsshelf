// Sync service for bidirectional synchronization between Redux and database
declare const setInterval: (callback: () => void, delay: number) => number;
declare const clearInterval: (id: number) => void;

import { store } from '../../store/store';
import { DatabaseService, Document, Category } from '../database';
import { setDocuments, setCategories } from '../../store/slices/documentsSlice';

class SyncServiceClass {
  private syncInterval: number | null = null;
  private isOnline = true;

  // Initialize sync service
  initialize() {
    this.startPeriodicSync();
    this.setupOnlineOfflineListeners();
  }

  // Start periodic sync every 30 seconds
  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, 30000);
  }

  // Setup online/offline listeners
  private setupOnlineOfflineListeners() {
    // In React Native, we can use NetInfo for network status
    // For now, we'll assume online status
    this.isOnline = true;
  }

  // Main sync function
  async sync() {
    try {
      const state = store.getState();
      const userId = state.auth.user?.id;

      if (!userId) return;

      // Sync documents
      await this.syncDocuments(userId);

      // Sync categories
      await this.syncCategories(userId);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Sync documents between Redux and database
  private async syncDocuments(userId: string) {
    try {
      // Get documents from database
      const dbDocuments = await DatabaseService.getDocumentsByUser(userId);

      // Get documents from Redux
      const reduxDocuments = store.getState().documents.documents;

      // Find documents that need to be synced to Redux
      const documentsToAdd = dbDocuments.filter(
        (dbDoc) => !reduxDocuments.some((reduxDoc) => reduxDoc.id === dbDoc.id)
      );

      // Find documents that need to be synced to database
      const documentsToSync = reduxDocuments.filter(
        (reduxDoc) => !reduxDoc.isSynced && reduxDoc.userId === userId
      );

      // Add new documents to Redux
      if (documentsToAdd.length > 0) {
        store.dispatch(setDocuments(dbDocuments));
      }

      // Sync unsynced documents to database
      for (const doc of documentsToSync) {
        await DatabaseService.saveDocumentMetadata(
          doc.userId,
          doc.name,
          doc.path,
          doc.size,
          doc.mimeType,
          doc.category,
          doc.folder,
          doc.tags,
          doc.ocrText
        );
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
        store.dispatch(setCategories(dbCategories));
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
        case 'add':
          // Document is already added to Redux, mark as synced in database
          await DatabaseService.saveDocumentMetadata(
            userId,
            document.name,
            document.path,
            document.size,
            document.mimeType,
            document.category,
            document.folder,
            document.tags,
            document.ocrText
          );
          break;
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
          await DatabaseService.createCategory(
            userId,
            category.name,
            category.color
          );
          break;
        case 'update':
          // Update category in database
          await DatabaseService.updateCategory(category.id, userId, {
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
