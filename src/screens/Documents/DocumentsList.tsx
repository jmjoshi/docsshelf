import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Title, Paragraph, FAB } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function DocumentsListScreen() {
  const documents = useSelector((state: RootState) => state.documents.documents);

  const renderDocument = ({ item }: any) => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>{item.category}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Your Documents</Title>
      {documents.length === 0 ? (
        <Text style={styles.empty}>No documents yet. Start by uploading one!</Text>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
          keyExtractor={(item) => item.id}
        />
      )}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => console.log('Add document')}
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
