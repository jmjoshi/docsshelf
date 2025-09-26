import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ViewStyle,
} from 'react-native';
import { useStorageManagement } from '../../hooks/useStorageManagement';

interface StorageStatusProps {
  style?: ViewStyle;
  showDetails?: boolean;
}

export const StorageStatus: React.FC<StorageStatusProps> = ({
  style,
  showDetails = false,
}) => {
  const {
    storageInfo,
    quotaStatus,
    cleanup,
    refreshStorage,
    getStorageBreakdown,
    formatBytes,
  } = useStorageManagement();

  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Debug logging
  console.log('StorageStatus render:', {
    quotaStatus,
    usagePercent: storageInfo.usagePercent,
    showDetails,
    shouldShowCleanupButton: quotaStatus !== 'normal',
  });

  const getStatusColor = () => {
    switch (quotaStatus) {
      case 'critical':
        return '#FF4444';
      case 'warning':
        return '#FFA726';
      default:
        return '#4CAF50';
    }
  };

  const getStatusText = () => {
    const usagePercent = Math.round(storageInfo.usagePercent * 100);
    switch (quotaStatus) {
      case 'critical':
        return `Storage Critical: ${usagePercent}%`;
      case 'warning':
        return `Storage Warning: ${usagePercent}%`;
      default:
        return `Storage: ${usagePercent}%`;
    }
  };

  const handleCleanup = async () => {
    console.log('🔥 CLEANUP BUTTON CLICKED!');

    // Use window.alert for web platform
    if (typeof window !== 'undefined') {
      if (
        !window.confirm(
          'Clean Up Storage\n\nThis will remove the oldest documents to free up space. This action cannot be undone.\n\nContinue?'
        )
      ) {
        return;
      }
    }

    setIsCleaningUp(true);
    console.log('🚀 Starting cleanup...');

    try {
      const result = await cleanup();
      console.log('🎯 Cleanup result:', result);

      refreshStorage(); // Refresh storage info after cleanup

      if (result) {
        const message = `Storage cleanup completed successfully!`;
        console.log('✅ ' + message);

        if (typeof window !== 'undefined') {
          window.alert('Cleanup Successful\n\n' + message);
        } else {
          Alert.alert('Cleanup Successful', message);
        }
      } else {
        const message = 'No documents were found to clean up.';
        console.log('⚠️ ' + message);

        if (typeof window !== 'undefined') {
          window.alert('Cleanup Complete\n\n' + message);
        } else {
          Alert.alert('Cleanup Complete', message);
        }
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      const errorMessage =
        'An error occurred during cleanup. Please try again.';

      if (typeof window !== 'undefined') {
        window.alert('Cleanup Failed\n\n' + errorMessage);
      } else {
        Alert.alert('Cleanup Failed', errorMessage);
      }
    } finally {
      setIsCleaningUp(false);
      console.log('🏁 Cleanup finished');
    }
  };

  const showStorageDetails = () => {
    const breakdown = getStorageBreakdown();
    const details = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([key, size]) => `${key}: ${formatBytes(size)}`)
      .join('\n');

    Alert.alert(
      'Storage Details',
      `Total Used: ${formatBytes(storageInfo.used)}\n` +
        `Available: ${formatBytes(storageInfo.remaining)}\n` +
        `Total Capacity: ${formatBytes(storageInfo.total)}\n\n` +
        `Breakdown:\n${details}`,
      [{ text: 'Refresh', onPress: refreshStorage }, { text: 'Close' }]
    );
  };

  if (!showDetails && quotaStatus === 'normal') {
    // For testing: always show the cleanup button when showDetails is true
    if (!showDetails) {
      return null;
    }
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.statusBar, { backgroundColor: getStatusColor() }]}
        onPress={showStorageDetails}
      >
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, storageInfo.usagePercent * 100)}%`,
                backgroundColor: '#FFF',
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {(quotaStatus !== 'normal' || showDetails) && (
        <TouchableOpacity
          style={[
            styles.cleanupButton,
            isCleaningUp && styles.cleanupButtonDisabled,
          ]}
          onPress={handleCleanup}
          disabled={isCleaningUp}
        >
          <Text style={styles.cleanupButtonText}>
            {isCleaningUp ? 'Cleaning...' : 'Clean Up'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cleanupButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cleanupButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  cleanupButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
