import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  List,
  ProgressBar,
  useTheme,
  Surface,
  Divider,
} from 'react-native-paper';
import { useStorageManagement } from '../../hooks/useStorageManagement';

export default function StorageManagementScreen() {
  const {
    storageInfo,
    quotaStatus,
    cleanup,
    getStorageBreakdown,
    formatBytes,
    refreshStorage,
  } = useStorageManagement();
  
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [storageBreakdown, setStorageBreakdown] = useState<{
    [key: string]: number;
  }>({});
  const theme = useTheme();

  useEffect(() => {
    setStorageBreakdown(getStorageBreakdown());
  }, [storageInfo, getStorageBreakdown]);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const success = await cleanup();
      
      if (success) {
        Alert.alert(
          'Cleanup Successful',
          `Storage cleanup completed! Space has been freed up.`,
          [{ text: 'OK', onPress: refreshStorage }]
        );
      } else {
        Alert.alert(
          'Cleanup Failed',
          'Unable to clean up enough space. Consider manually deleting some documents.'
        );
      }
    } catch {
      Alert.alert('Error', 'Storage cleanup failed. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleEmergencyCleanup = () => {
    Alert.alert(
      'Emergency Cleanup',
      'This will remove ALL application data including documents, categories, and settings. This action cannot be undone.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            try {
              localStorage.clear();
              Alert.alert(
                'All Data Cleared',
                'All application data has been removed. The app will restart.',
                [{ text: 'OK', onPress: () => window.location.reload() }]
              );
            } catch {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (quotaStatus) {
      case 'critical':
        return theme.colors.error;
      case 'warning':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const usagePercent = storageInfo.usagePercent || 0;

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView>
        <Title style={[styles.title, { color: theme.colors.onBackground }]}>
          Storage Management
        </Title>

        {/* Storage Overview */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>
              Storage Usage
            </Title>
            <View style={styles.usageContainer}>
              <View style={styles.usageInfo}>
                <Text style={{ color: theme.colors.onSurface }}>
                  {formatBytes(storageInfo.used)} of{' '}
                  {formatBytes(storageInfo.total)} used
                </Text>
                <Text style={{ color: getStatusColor() }}>
                  {Math.round(usagePercent * 100)}% -{' '}
                  {quotaStatus.toUpperCase()}
                </Text>
              </View>
              <ProgressBar
                progress={usagePercent}
                color={getStatusColor()}
                style={styles.progressBar}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Storage Breakdown */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>
              Storage Breakdown
            </Title>
            {Object.entries(storageBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, size]) => (
                <List.Item
                  key={category}
                  title={category.replace('_', ' ').toUpperCase()}
                  description={`${formatBytes(size)} (${Math.round((size / storageInfo.used) * 100)}%)`}
                  left={() => <List.Icon icon="folder" />}
                  titleStyle={{ color: theme.colors.onSurface }}
                  descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              ))}
          </Card.Content>
        </Card>

        {/* Cleanup Options */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>
              Cleanup Options
            </Title>
            
            <Button
              mode="contained"
              onPress={() => handleCleanup()}
              style={styles.button}
              disabled={isCleaningUp || quotaStatus === 'normal'}
              loading={isCleaningUp}
            >
              {isCleaningUp ? 'Cleaning Up...' : 'Clean Up (Free 20%)'}
            </Button>

            <Button
              mode="contained"
              onPress={() => handleCleanup()}
              style={styles.button}
              disabled={isCleaningUp}
              loading={isCleaningUp}
            >
              Aggressive Cleanup (Free 50%)
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleEmergencyCleanup}
              style={[styles.button, styles.dangerButton]}
              textColor={theme.colors.error}
            >
              Emergency: Clear All Data
            </Button>
          </Card.Content>
        </Card>

        {/* Tips */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>
              Storage Tips
            </Title>
            <Text
              style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}
            >
              • Documents are stored locally in your browser's storage
              {'\n'}• Large files will use more storage space
              {'\n'}• Regular cleanup helps maintain performance
              {'\n'}• Consider compressing large documents before upload
              {'\n'}• Export important documents before cleaning up
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  usageContainer: {
    marginTop: 8,
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  button: {
    marginVertical: 8,
  },
  dangerButton: {
    borderColor: '#F44336',
  },
  divider: {
    marginVertical: 16,
  },
  tipText: {
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
