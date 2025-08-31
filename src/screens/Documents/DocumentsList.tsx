import React, { useEffect, useState } from 'react';
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
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Document } from '../../types';
import { DocumentService } from '../../services/documents';
import { addDocument } from '../../store/slices/documentsSlice';
import HapticFeedback from 'react-native-haptic-feedback';

export default function DocumentsListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>(
    'success'
  );

  const documents = useSelector(
    (state: RootState) => state.documents.documents
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    if (searchQuery) {
      // Filter documents based on search query
      const filtered = documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments(documents);
    }
  }, [documents, searchQuery]);

  const showSnackbar = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

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
        showSnackbar('Document uploaded successfully');
        HapticFeedback.trigger('notificationSuccess');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      showSnackbar('Failed to upload document', 'error');
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

      {filteredDocuments.length === 0 ? (
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
      ) : (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
          accessible={true}
          accessibilityLabel={`List of ${filteredDocuments.length} documents`}
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
});
