import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Text,
  IconButton,
} from 'react-native-paper';

interface ContactSupportScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function ContactSupportScreen({ navigation }: ContactSupportScreenProps) {
  const handleEmailSupport = () => {
    const email = 'support@docsshelf.com';
    const subject = 'DocsShelf Support Request';
    const body = 'Please describe your issue or question:';
    
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(emailUrl).catch(() => {
      // If no email client is available, you could show an alert with the email address
      console.log('Unable to open email client');
    });
  };

  const handleWebSupport = () => {
    const supportUrl = 'https://docsshelf.com/support';
    Linking.openURL(supportUrl).catch(() => {
      console.log('Unable to open support URL');
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Title style={styles.title}>Contact Support</Title>
          </View>

          <Paragraph style={styles.description}>
            Need help? We're here to assist you. Choose from the options below to get support.
          </Paragraph>

          <View style={styles.optionsContainer}>
            <List.Section>
              <List.Item
                title="Email Support"
                description="Send us an email and we'll get back to you within 24 hours"
                left={props => <List.Icon {...props} icon="email" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleEmailSupport}
                style={styles.listItem}
              />
              
              <List.Item
                title="Online Help Center"
                description="Browse our comprehensive FAQ and documentation"
                left={props => <List.Icon {...props} icon="web" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleWebSupport}
                style={styles.listItem}
              />
            </List.Section>
          </View>

          <View style={styles.quickHelp}>
            <Title style={styles.quickHelpTitle}>Quick Help</Title>
            
            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>Can't receive verification emails?</Text>
              <Text style={styles.helpAnswer}>
                • Check your spam/junk folder{'\n'}
                • Ensure your email address is correct{'\n'}
                • Try requesting a new code after a few minutes
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>Forgot your password?</Text>
              <Text style={styles.helpAnswer}>
                Use the "Forgot Password" link on the login screen to reset your password.
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>Having trouble with biometric login?</Text>
              <Text style={styles.helpAnswer}>
                • Ensure biometrics are enabled in your device settings{'\n'}
                • Try logging in with your password and re-enable biometrics in settings
              </Text>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <Title style={styles.contactTitle}>Contact Information</Title>
            <Text style={styles.contactText}>
              Email: support@docsshelf.com{'\n'}
              Website: https://docsshelf.com{'\n'}
              Response Time: Within 24 hours
            </Text>
          </View>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backToAppButton}
          >
            Back to App
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 20,
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    margin: 0,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  listItem: {
    paddingVertical: 5,
  },
  quickHelp: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  quickHelpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2e7d32',
  },
  helpItem: {
    marginBottom: 15,
  },
  helpQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b5e20',
    marginBottom: 5,
  },
  helpAnswer: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  contactInfo: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1976d2',
  },
  contactText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 22,
  },
  backToAppButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});