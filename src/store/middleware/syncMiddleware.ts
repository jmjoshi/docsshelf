// Redux middleware for automatic database synchronization
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Middleware } from '@reduxjs/toolkit';
import { SyncService } from '../../services/sync';

export const syncMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Get the current state after the action
  const state = store.getState();
  const userId = state.auth.user?.id;

  if (!userId) return result;

  // Handle document actions (but ignore bulk sync actions to prevent loops)
  if (
    action &&
    typeof action === 'object' &&
    'type' in action &&
    action.type &&
    typeof action.type === 'string' &&
    action.type.startsWith('documents/') &&
    // Ignore bulk sync actions to prevent infinite loops
    action.type !== 'documents/setDocuments' &&
    action.type !== 'documents/setCategories'
  ) {
    // Add a flag to prevent sync loops
    const actionWithMeta = action as any;
    if (actionWithMeta.meta?.skipSync) {
      return result;
    }

    switch (action.type) {
      case 'documents/addDocument':
        // Use setTimeout to avoid blocking the main thread
        setTimeout(() => {
          SyncService.handleDocumentChange('add', (action as any).payload);
        }, 0);
        break;
      case 'documents/updateDocument':
        setTimeout(() => {
          SyncService.handleDocumentChange('update', (action as any).payload);
        }, 0);
        break;
      case 'documents/deleteDocument':
        // For delete, we need to get the document from state before deletion
        // This is a limitation - we might need to modify the action to include the full document
        break;
      case 'documents/addCategory':
        setTimeout(() => {
          SyncService.handleCategoryChange('add', (action as any).payload);
        }, 0);
        break;
      case 'documents/updateCategory':
        setTimeout(() => {
          SyncService.handleCategoryChange('update', (action as any).payload);
        }, 0);
        break;
      case 'documents/deleteCategory':
        // Similar issue with delete
        break;
    }
  }

  return result;
};
