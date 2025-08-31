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

  // Handle document actions
  if (
    action &&
    typeof action === 'object' &&
    'type' in action &&
    action.type &&
    typeof action.type === 'string' &&
    action.type.startsWith('documents/')
  ) {
    switch (action.type) {
      case 'documents/addDocument':
        SyncService.handleDocumentChange('add', (action as any).payload);
        break;
      case 'documents/updateDocument':
        SyncService.handleDocumentChange('update', (action as any).payload);
        break;
      case 'documents/deleteDocument':
        // For delete, we need to get the document from state before deletion
        // This is a limitation - we might need to modify the action to include the full document
        break;
      case 'documents/addCategory':
        SyncService.handleCategoryChange('add', (action as any).payload);
        break;
      case 'documents/updateCategory':
        SyncService.handleCategoryChange('update', (action as any).payload);
        break;
      case 'documents/deleteCategory':
        // Similar issue with delete
        break;
    }
  }

  return result;
};
