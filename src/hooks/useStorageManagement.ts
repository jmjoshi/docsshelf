import { useState, useEffect } from 'react';
import { StorageQuotaManager, StorageQuotaInfo } from '../utils/storageQuota';

export interface UseStorageManagement {
  storageInfo: StorageQuotaInfo;
  quotaStatus: 'normal' | 'warning' | 'critical';
  canUpload: (fileSize: number) => boolean;
  cleanup: () => Promise<boolean>;
  refreshStorage: () => void;
  getStorageBreakdown: () => { [key: string]: number };
  formatBytes: (bytes: number) => string;
}

export function useStorageManagement(): UseStorageManagement {
  const [storageInfo, setStorageInfo] = useState<StorageQuotaInfo>(
    StorageQuotaManager.getStorageInfo()
  );
  const [quotaStatus, setQuotaStatus] = useState<
    'normal' | 'warning' | 'critical'
  >(StorageQuotaManager.checkQuotaStatus());

  const refreshStorage = () => {
    const newStorageInfo = StorageQuotaManager.getStorageInfo();
    const newQuotaStatus = StorageQuotaManager.checkQuotaStatus();

    setStorageInfo(newStorageInfo);
    setQuotaStatus(newQuotaStatus);
  };

  const canUpload = (fileSize: number): boolean => {
    return StorageQuotaManager.hasSpaceFor(fileSize);
  };

  const cleanup = async (): Promise<boolean> => {
    try {
      const result = await StorageQuotaManager.cleanupOldDocuments();

      if (result.cleaned) {
        refreshStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Storage cleanup failed:', error);
      return false;
    }
  };

  const getStorageBreakdown = () => {
    return StorageQuotaManager.getStorageBreakdown();
  };

  const formatBytes = (bytes: number): string => {
    return StorageQuotaManager.formatBytes(bytes);
  };

  // Refresh storage info periodically
  useEffect(() => {
    const interval = setInterval(refreshStorage, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Refresh on mount
  useEffect(() => {
    refreshStorage();
  }, []);

  return {
    storageInfo,
    quotaStatus,
    canUpload,
    cleanup,
    refreshStorage,
    getStorageBreakdown,
    formatBytes,
  };
}

// Storage warning component hook
export function useStorageWarnings() {
  const { quotaStatus, storageInfo, formatBytes } = useStorageManagement();
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    if (quotaStatus === 'critical' && !warningShown) {
      setWarningShown(true);

      if (typeof window !== 'undefined' && window.confirm) {
        const shouldCleanup = window.confirm(
          `Storage is almost full (${Math.round(storageInfo.usagePercent * 100)}%)!\n\n` +
            `Used: ${formatBytes(storageInfo.used)}\n` +
            `Available: ${formatBytes(storageInfo.total)}\n\n` +
            `Would you like to automatically clean up old documents?`
        );

        if (shouldCleanup) {
          StorageQuotaManager.cleanupOldDocuments().then((result) => {
            if (result.cleaned) {
              alert(
                `Cleanup successful! Freed ${formatBytes(result.freedSpace)} of storage.`
              );
            } else {
              alert('Cleanup failed. Please manually delete some documents.');
            }
          });
        }
      }
    } else if (quotaStatus === 'normal') {
      setWarningShown(false);
    }
  }, [quotaStatus, storageInfo, warningShown, formatBytes]);

  return {
    quotaStatus,
    storageInfo,
    warningShown,
  };
}
