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
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { Document } from '../../types';
import { DocumentService } from '../../services/documents';
import { addDocument } from '../../store/slices/documentsSlice';

export default function DocumentsListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const documents = useSelector(
    (state: RootState) => state.documents.documents
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  const dispatch = useDispatch();

  useEffect(() => {
    if (searchQuery) {
      // Filter documents based on search query
      const filtered = documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments(documents);
    }
  }, [documents, searchQuery]);

  const handleUpload = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Request permissions
      const permissions = await DocumentService.requestPermissions();
      if (!permissions.mediaLibrary) {
        Alert.alert('Permission Required', 'Please grant media library access');
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
          name: result.name,
          path: result.path,
          category: 'General',
          folder: 'Uploads',
          size: result.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch(addDocument(doc));
        Alert.alert('Success', 'Document uploaded successfully');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const handleScan = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Request permissions
      const permissions = await DocumentService.requestPermissions();
      if (!permissions.camera) {
        Alert.alert('Permission Required', 'Please grant camera access');
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
          name: result.name,
          path: result.path,
          category: 'Scanned',
          folder: 'Scans',
          size: result.size,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        dispatch(addDocument(doc));
        Alert.alert('Success', 'Document scanned successfully');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      Alert.alert('Error', 'Failed to scan document');
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>Category: {item.category}</Paragraph>
        <Paragraph>Folder: {item.folder}</Paragraph>
        <Paragraph>Size: {(item.size / 1024).toFixed(2)} KB</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Your Documents</Title>

      <Searchbar
        placeholder="Search documents..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={handleUpload} style={styles.button}>
          Upload Document
        </Button>
        <Button mode="contained" onPress={handleScan} style={styles.button}>
          Scan Document
        </Button>
      </View>

      {filteredDocuments.length === 0 ? (
        <Text style={styles.empty}>
          {searchQuery
            ? 'No documents match your search'
            : 'No documents yet. Start by uploading one!'}
        </Text>
      ) : (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() =>
          Alert.alert('Add Document', 'Choose an option', [
            { text: 'Upload', onPress: handleUpload },
            { text: 'Scan', onPress: handleScan },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      />
    </View>
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
