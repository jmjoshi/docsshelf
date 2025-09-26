import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/store';

console.log('=== LOGIN SCREEN LOADING ===');

interface LoginScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export default function LoginSimple({ navigation }: LoginScreenProps) {
  console.log('=== LOGIN SCREEN RENDERING ===');
  const dispatch = useDispatch();

  const handleTestLogin = () => {
    console.log('[DEBUG] Test login pressed');
    dispatch(
      loginSuccess({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumbers: [],
      })
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DocsShelf Login</Text>
      <Text style={styles.subtitle}>Navigation Test</Text>

      <Button mode="contained" onPress={handleTestLogin} style={styles.button}>
        Test Login (Skip Auth)
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Register')}
        style={styles.button}
      >
        Go to Register
      </Button>

      <Text style={styles.debug}>✅ Navigation Working</Text>
      <Text style={styles.debug}>✅ Redux Connected</Text>
      <Text style={styles.debug}>✅ React Native Paper UI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    width: 250,
    marginVertical: 10,
  },
  debug: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 5,
  },
});
