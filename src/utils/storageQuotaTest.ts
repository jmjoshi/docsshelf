// Test the storage quota management functionality
import { StorageQuotaManager } from './storageQuota';

// Test function to simulate quota exceeded scenario
export function testStorageQuotaManager() {
  console.log('Testing Storage Quota Manager...');

  // Get current storage info
  const storageInfo = StorageQuotaManager.getStorageInfo();
  console.log('Current storage info:', {
    used: StorageQuotaManager.formatBytes(storageInfo.used),
    total: StorageQuotaManager.formatBytes(storageInfo.total),
    remaining: StorageQuotaManager.formatBytes(storageInfo.remaining),
    usagePercent: `${Math.round(storageInfo.usagePercent * 100)}%`,
  });

  // Check quota status
  const quotaStatus = StorageQuotaManager.checkQuotaStatus();
  console.log('Quota status:', quotaStatus);

  // Get storage breakdown
  const breakdown = StorageQuotaManager.getStorageBreakdown();
  console.log('Storage breakdown:');
  Object.entries(breakdown).forEach(([category, size]) => {
    console.log(`  ${category}: ${StorageQuotaManager.formatBytes(size)}`);
  });

  // Test space check for a large file (1MB)
  const largeFileSize = 1024 * 1024; // 1MB
  const canUpload = StorageQuotaManager.hasSpaceFor(largeFileSize);
  console.log(`Can upload 1MB file: ${canUpload}`);

  return {
    storageInfo,
    quotaStatus,
    breakdown,
    canUpload,
  };
}

// Test function to be called from browser console
declare global {
  interface Window {
    testStorageQuota: typeof testStorageQuotaManager;
  }
}

window.testStorageQuota = testStorageQuotaManager;
