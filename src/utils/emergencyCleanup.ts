// Emergency storage cleanup utility
// Use this in browser console to fix the infinite loop issue

export const emergencyCleanup = {
  // Clear all localStorage related to documents
  clearDocuments: () => {
    try {
      localStorage.removeItem('docsshelf_documents');
      localStorage.removeItem('docsshelf_files');
      localStorage.removeItem('persist:documents');
      console.log('✅ Document storage cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear documents:', error);
      return false;
    }
  },

  // Clear only Redux persist data
  clearReduxPersist: () => {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('persist:')
      );
      keys.forEach((key) => localStorage.removeItem(key));
      console.log(`✅ Cleared ${keys.length} Redux persist keys:`, keys);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear Redux persist:', error);
      return false;
    }
  },

  // Clear everything
  clearAll: () => {
    try {
      const docCleared = emergencyCleanup.clearDocuments();
      const reduxCleared = emergencyCleanup.clearReduxPersist();
      
      // Also clear any other app data
      const appKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('docsshelf_')
      );
      appKeys.forEach(key => localStorage.removeItem(key));
      
      console.log(`✅ Emergency cleanup complete. Cleared ${appKeys.length} additional keys.`);
      console.log('🔄 Please refresh the page to restart with clean state.');
      
      return docCleared && reduxCleared;
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
      return false;
    }
  },

  // Show current storage usage
  showStorageInfo: () => {
    try {
      const info = {
        totalKeys: Object.keys(localStorage).length,
        docsKeys: Object.keys(localStorage).filter(k => k.startsWith('docsshelf_')),
        persistKeys: Object.keys(localStorage).filter(k => k.startsWith('persist:')),
      };
      
      console.table(info);
      
      // Show size breakdown
      let totalSize = 0;
      const sizeBreakdown: { [key: string]: number } = {};
      
      for (let key in localStorage) {
        const value = localStorage.getItem(key) || '';
        const size = key.length + value.length;
        totalSize += size;
        
        if (key.startsWith('docsshelf_')) {
          sizeBreakdown[key] = size;
        } else if (key.startsWith('persist:')) {
          sizeBreakdown[key] = size;
        }
      }
      
      console.log('📊 Storage size breakdown:');
      console.table(sizeBreakdown);
      console.log(`📈 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
      
      return info;
    } catch (error) {
      console.error('❌ Failed to show storage info:', error);
      return null;
    }
  },

  // Check for duplicate documents
  checkDuplicates: () => {
    try {
      const docsData = localStorage.getItem('docsshelf_documents');
      const filesData = localStorage.getItem('docsshelf_files');
      const persistData = localStorage.getItem('persist:documents');
      
      const issues = [];
      
      if (docsData) {
        const docs = JSON.parse(docsData);
        const ids = docs.map((d: any) => d.id);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
          issues.push(`🔴 Found ${ids.length - uniqueIds.length} duplicate documents in docsshelf_documents`);
        } else {
          issues.push(`✅ No duplicates in docsshelf_documents (${docs.length} documents)`);
        }
      }
      
      if (filesData) {
        const files = JSON.parse(filesData);
        const ids = files.map((f: any) => f.id);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
          issues.push(`🔴 Found ${ids.length - uniqueIds.length} duplicate files in docsshelf_files`);
        } else {
          issues.push(`✅ No duplicates in docsshelf_files (${files.length} files)`);
        }
      }
      
      if (persistData) {
        try {
          const parsed = JSON.parse(persistData);
          if (parsed.documents) {
            const reduxDocs = JSON.parse(parsed.documents);
            const ids = reduxDocs.map((d: any) => d.id);
            const uniqueIds = [...new Set(ids)];
            if (ids.length !== uniqueIds.length) {
              issues.push(`🔴 Found ${ids.length - uniqueIds.length} duplicate documents in Redux persist`);
            } else {
              issues.push(`✅ No duplicates in Redux persist (${reduxDocs.length} documents)`);
            }
          }
        } catch (e) {
          issues.push(`⚠️ Could not parse Redux persist data`);
        }
      }
      
      console.log('🔍 Duplicate check results:');
      issues.forEach(issue => console.log(issue));
      
      return issues;
    } catch (error) {
      console.error('❌ Failed to check duplicates:', error);
      return [];
    }
  }
};

// Make it available globally for emergency use
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup;
}

export default emergencyCleanup;
