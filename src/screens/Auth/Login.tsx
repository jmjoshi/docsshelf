import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';

interface LoginScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const available = await AuthService.authenticateWithBiometrics();
      setIsBiometricAvailable(available);
    } catch {
      console.log('Biometric not available');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await AuthService.authenticateWithBiometrics();
      if (success) {
        // For demo, use stored credentials or prompt for email
        Alert.alert('Biometric Success', 'Please enter your email to proceed');
      }
    } catch {
      Alert.alert('Error', 'Biometric authentication failed');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    dispatch(loginStart());

    try {
      const user = await AuthService.login({ email, password });
      if (user) {
        dispatch(loginSuccess(user));
        Alert.alert('Success', 'Login successful!');
      } else {
        dispatch(loginFailure('Invalid credentials'));
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch {
      dispatch(loginFailure('Login failed'));
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Login to DocsShelf</Title>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Button mode="contained" onPress={handleLogin} style={styles.button}>
            Login
          </Button>
          {isBiometricAvailable && (
            <Button
              mode="outlined"
              onPress={handleBiometricLogin}
              style={styles.button}
              icon="fingerprint"
            >
              Use Biometric Login
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Register')}
            style={styles.button}
          >
            Register
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
});
