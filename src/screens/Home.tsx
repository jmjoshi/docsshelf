import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export default function HomeScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const documentsCount = useSelector((state: RootState) => state.documents.documents.length);

  return (
    <View style={styles.container}>
      <Title style={styles.welcome}>Welcome to DocsShelf</Title>
      {user && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Hello, {user.firstName}!</Title>
            <Paragraph>You have {documentsCount} documents stored.</Paragraph>
          </Card.Content>
        </Card>
      )}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <Paragraph>Upload, scan, or manage your documents.</Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcome: {
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
});
