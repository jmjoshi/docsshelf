import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  FAB,
  Button,
  Searchbar,
  Snackbar,
  useTheme,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Document } from '../../types';
import { DocumentService } from '../../services/documents';
import { addDocument } from '../../store/slices/documentsSlice';
import HapticFeedback from '../../utils/haptic-feedback';
import { PerformanceMonitor } from '../../utils/performance';
import { StorageStatus } from '../../components/common/StorageStatus';
import { StorageQuotaManager } from '../../utils/storageQuota';
import { useStorageWarnings } from '../../hooks/useStorageManagement';
import { QuotaExceededError } from '../../services/database';

export default function DocumentsListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>(
    'success'
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const dispatch = useDispatch();
  const theme = useTheme();

  // Add storage warning hook
  useStorageWarnings();

  const showSnackbar = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setSnackbarMessage(message);
      setSnackbarType(type);
      setSnackbarVisible(true);
    },
    []
  );

  // Load initial documents
  const loadDocuments = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      if (!userId) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          PerformanceMonitor.startTimer(`Load Documents Page ${page}`);
        }

        const result = await DocumentService.getDocumentsPaginated(
          userId,
          page,
          PAGE_SIZE
        );

        if (isLoadMore) {
          setDocuments((prev) => [...prev, ...result.documents]);
        } else {
          setDocuments(result.documents);
          PerformanceMonitor.endTimer(`Load Documents Page ${page}`);
          PerformanceMonitor.logMemoryUsage('After Document Load');
        }

        setHasMore(result.hasMore);
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to load documents:', error);
        showSnackbar('Failed to load documents', 'error');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, showSnackbar]
  );

  // Load more documents for infinite scroll
  const loadMoreDocuments = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading && userId) {
      const nextPage = currentPage + 1;
      loadDocuments(nextPage, true);
    }
  }, [hasMore, isLoading, isLoadingMore, userId, currentPage, loadDocuments]);

  // Search documents with pagination
  const searchDocuments = useCallback(
    async (query: string, page: number = 1, isLoadMore: boolean = false) => {
      if (!userId) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          PerformanceMonitor.startTimer(`Search: ${query}`);
        }

        const result = await DocumentService.searchDocuments(userId, query);
        const startIndex = (page - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        const paginatedResult = {
          documents: result.slice(startIndex, endIndex),
          totalCount: result.length,
          hasMore: endIndex < result.length,
        };

        if (isLoadMore) {
          setDocuments((prev) => [...prev, ...paginatedResult.documents]);
        } else {
          setDocuments(paginatedResult.documents);
          PerformanceMonitor.endTimer(`Search: ${query}`);
          PerformanceMonitor.logMemoryUsage('After Search');
        }

        setHasMore(paginatedResult.hasMore);
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to search documents:', error);
        showSnackbar('Failed to search documents', 'error');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [userId, showSnackbar]
  );

  // Handle search query changes with debouncing
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!userId) return;

      if (searchQuery.trim()) {
        searchDocuments(searchQuery.trim());
      } else {
        // Reset to first page and load documents using the centralized function
        loadDocuments(1, false);
      }
    }, 300); // Debounce search

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, userId, loadDocuments, searchDocuments]);

  // Initial load - only when userId changes
  useEffect(() => {
    if (userId) {
      loadDocuments(1, false);
    }
  }, [userId, loadDocuments]);

  const handleUpload = async () => {
    if (!userId) {
      showSnackbar('User not authenticated', 'error');
      return;
    }

    HapticFeedback.trigger('impactMedium');
    setIsUploading(true);

    try {
      // Request permissions
      const permissions = await DocumentService.requestPermissions();
      if (!permissions.mediaLibrary) {
        showSnackbar('Please grant media library access', 'error');
        return;
      }

      // For demo, use a simple key. In real app, get from keychain
      const encryptionKey = 'demo-key-12345';

      const result = await DocumentService.uploadFromDevice(
        userId,
        encryptionKey
      );
      if (result) {
        // Add to Redux store
        const doc: Document = {
          id: result.id,
          userId: userId,
          name: result.name,
          path: result.path,
          category: 'General',
          folder: 'Uploads',
          size: result.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };
        dispatch(addDocument(doc));

        // Update local state immediately to prevent UI lag
        setDocuments((prev) => [doc, ...prev]);

        showSnackbar('Document uploaded successfully');
        HapticFeedback.trigger('notificationSuccess');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      
      if (error instanceof QuotaExceededError) {
        showSnackbar(error.message, 'error');
        Alert.alert(
          'Storage Full',
          `${error.message}\n\nWould you like to clean up old documents automatically?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clean Up',
              onPress: async () => {
                setIsUploading(true);
                try {
                  const result =
                    await StorageQuotaManager.cleanupOldDocuments();

                  if (result.cleaned) {
                    // Refresh documents list after cleanup
                    await loadDocuments(1, false);
                    Alert.alert(
                      'Cleanup Complete',
                      `Successfully freed ${StorageQuotaManager.formatBytes(result.freedSpace)} of storage space. You can now try uploading again.`
                    );
                  } else {
                    Alert.alert(
                      'Cleanup Failed',
                      result.error ||
                        'No documents could be cleaned up. Please delete some documents manually.'
                    );
                  }
                } catch (cleanupError) {
                  console.error('Cleanup error:', cleanupError);
                  Alert.alert(
                    'Cleanup Error',
                    'An error occurred during cleanup. Please try again.'
                  );
                } finally {
                  setIsUploading(false);
                }
              },
            },
          ]
        );
      } else {
        showSnackbar('Failed to upload document', 'error');
      }
      HapticFeedback.trigger('notificationError');
    } finally {
      setIsUploading(false);
    }
  };

  const handleScan = async () => {
    if (!userId) {
      showSnackbar('User not authenticated', 'error');
      return;
    }

    HapticFeedback.trigger('impactMedium');
    setIsScanning(true);

    try {
      // Request permissions
      const permissions = await DocumentService.requestPermissions();
      if (!permissions.camera) {
        showSnackbar('Please grant camera access', 'error');
        return;
      }

      // For demo, use a simple key
      const encryptionKey = 'demo-key-12345';

      const result = await DocumentService.scanWithCamera(
        userId,
        encryptionKey
      );
      if (result) {
        // Add to Redux store
        const doc: Document = {
          id: result.id,
          userId: userId,
          name: result.name,
          path: result.path,
          category: 'Scanned',
          folder: 'Scans',
          size: result.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
        };
        dispatch(addDocument(doc));

        // Update local state immediately to prevent UI lag
        setDocuments((prev) => [doc, ...prev]);

        showSnackbar('Document scanned successfully');
        HapticFeedback.trigger('notificationSuccess');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      showSnackbar('Failed to scan document', 'error');
      HapticFeedback.trigger('notificationError');
    } finally {
      setIsScanning(false);
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      accessible={true}
      accessibilityLabel={`Document: ${item.name}, Category: ${item.category || 'Uncategorized'}, Size: ${item.size ? (item.size / 1024).toFixed(2) + ' KB' : 'Unknown'}`}
    >
      <Card.Content>
        <Title style={{ color: theme.colors.onSurface }}>{item.name}</Title>
        <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
          Category: {item.category || 'Uncategorized'}
        </Paragraph>
        <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
          Folder: {item.folder || 'No folder'}
        </Paragraph>
        <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
          Size: {item.size ? (item.size / 1024).toFixed(2) + ' KB' : 'Unknown'}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Title
        style={[styles.title, { color: theme.colors.onBackground }]}
        accessibilityRole="header"
        accessibilityLabel="Your Documents"
      >
        Your Documents
      </Title>

      {/* Storage Status Component */}
      <StorageStatus showDetails={true} style={styles.storageStatus} />

      <Searchbar
        placeholder="Search documents..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
        accessible={true}
        accessibilityLabel="Search documents"
        accessibilityHint="Type to filter documents by name or category"
      />

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleUpload}
          style={styles.button}
          disabled={isUploading}
          loading={isUploading}
          accessibilityLabel="Upload document"
          accessibilityHint="Select a file from your device to upload"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </Button>
        <Button
          mode="outlined"
          onPress={async () => {
            try {
              const result = await StorageQuotaManager.cleanupOldDocuments();
              Alert.alert('Debug Cleanup', JSON.stringify(result, null, 2));
            } catch (error) {
              Alert.alert(
                'Debug Error',
                error instanceof Error ? error.message : String(error)
              );
            }
          }}
          style={[styles.button, { backgroundColor: '#FFE0B2' }]}
        >
          Test Cleanup
        </Button>
        <Button
          mode="contained"
          onPress={handleScan}
          style={styles.button}
          disabled={isScanning}
          loading={isScanning}
          accessibilityLabel="Scan document"
          accessibilityHint="Use camera to scan a document"
        >
          {isScanning ? 'Scanning...' : 'Scan Document'}
        </Button>
      </View>

      {documents.length === 0 ? (
        isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Loading documents...
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}
            accessible={true}
            accessibilityLabel={
              searchQuery
                ? 'No documents match your search'
                : 'No documents yet. Start by uploading one!'
            }
          >
            {searchQuery
              ? 'No documents match your search'
              : 'No documents yet. Start by uploading one!'}
          </Text>
        )
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          onEndReached={loadMoreDocuments}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" />
                <Text
                  style={[
                    styles.loadingText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Loading more...
                </Text>
              </View>
            ) : null
          }
          accessible={true}
          accessibilityLabel={`List of ${documents.length} documents`}
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => {
          HapticFeedback.trigger('impactLight');
          Alert.alert('Add Document', 'Choose an option', [
            { text: 'Upload', onPress: handleUpload },
            { text: 'Scan', onPress: handleScan },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }}
        accessible={true}
        accessibilityLabel="Add new document"
        accessibilityHint="Opens menu to choose upload or scan option"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{
          backgroundColor:
            snackbarType === 'error'
              ? theme.colors.error
              : theme.colors.primary,
        }}
        accessible={true}
        accessibilityLabel={snackbarMessage}
      >
        {snackbarMessage}
      </Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 20,
  },
  storageStatus: {
    marginBottom: 15,
  },
  searchbar: {
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  card: {
    marginBottom: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
});
