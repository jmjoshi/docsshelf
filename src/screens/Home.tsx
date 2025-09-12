import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  useTheme,
  Surface,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { RootState } from '../store/store';
import { MainTabParamList } from '../navigation/types';
import HapticFeedback from '../utils/haptic-feedback';

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;

export default function HomeScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const documentsCount = useSelector(
    (state: RootState) => state.documents.documents.length
  );
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const handleQuickAction = (action: string) => {
    HapticFeedback.trigger('impactLight');
    console.log(`Navigating to ${action}`);

    switch (action) {
      case 'Upload':
        // Navigate to Documents tab which should handle document upload
        navigation.navigate('Documents');
        break;
      case 'Scan':
        // For now, also navigate to Documents tab
        // In the future, this could navigate to a specific scan screen
        navigation.navigate('Documents');
        break;
      default:
        console.log(`No navigation defined for action: ${action}`);
    }
  };

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Title
          style={[styles.welcome, { color: theme.colors.onBackground }]}
          accessibilityRole="header"
          accessibilityLabel="Welcome to DocsShelf"
        >
          Welcome to DocsShelf
        </Title>
      </View>

      {user && (
        <Card
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          accessible={true}
          accessibilityLabel={`Hello ${user.firstName}, you have ${documentsCount} documents stored`}
        >
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface }}>
              Hello, {user.firstName}!
            </Title>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
              You have {documentsCount} documents stored.
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        accessible={true}
        accessibilityLabel="Quick actions for document management"
      >
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>Quick Actions</Title>
          <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
            Upload, scan, or manage your documents.
          </Paragraph>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handleQuickAction('Upload')}
              style={styles.button}
              accessibilityLabel="Upload a new document"
              accessibilityHint="Opens document picker to select and upload a file"
            >
              Upload Document
            </Button>
            <Button
              mode="contained"
              onPress={() => handleQuickAction('Scan')}
              style={styles.button}
              accessibilityLabel="Scan a document"
              accessibilityHint="Opens camera to scan a document"
            >
              Scan Document
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        accessible={true}
        accessibilityLabel="Recent activity summary"
      >
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>
            Recent Activity
          </Title>
          <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
            No recent activity. Start by uploading your first document!
          </Paragraph>
        </Card.Content>
      </Card>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcome: {
    fontSize: isLandscape ? 24 : 28,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  buttonContainer: {
    flexDirection: isLandscape ? 'row' : 'column',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: isLandscape ? 1 : undefined,
    marginHorizontal: isLandscape ? 5 : 0,
    marginVertical: 5,
  },
});
