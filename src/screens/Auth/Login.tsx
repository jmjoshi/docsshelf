import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';
import HapticFeedback from '../../utils/haptic-feedback';

interface LoginScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      try {
        // Check if biometric sensor is available (without prompting)
        const { available } =
          await AuthService['biometrics'].isSensorAvailable();
        setIsBiometricAvailable(!!available);
      } catch {
        setIsBiometricAvailable(false);
      }
    })();
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleBiometricLogin = async () => {
    HapticFeedback.trigger('impactLight');
    const success = await AuthService.authenticateWithBiometrics();
    if (success) {
      showSnackbar(
        'Biometric authentication successful! Please enter your email to proceed.'
      );
      HapticFeedback.trigger('notificationSuccess');
    } else {
      showSnackbar('Biometric authentication not available or failed.');
      HapticFeedback.trigger('notificationError');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showSnackbar('Please fill all fields');
      HapticFeedback.trigger('notificationError');
      return;
    }

    HapticFeedback.trigger('impactMedium');
    setIsLoading(true);
    dispatch(loginStart());

    try {
      const user = await AuthService.login({ email, password });
      if (user) {
        dispatch(loginSuccess(user));
        showSnackbar('Login successful!');
        HapticFeedback.trigger('notificationSuccess');
      } else {
        dispatch(loginFailure('Invalid credentials'));
        showSnackbar('Invalid credentials');
        HapticFeedback.trigger('notificationError');
      }
    } catch {
      dispatch(loginFailure('Login failed'));
      showSnackbar('Login failed. Please try again.');
      HapticFeedback.trigger('notificationError');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title
            style={[styles.title, { color: theme.colors.onSurface }]}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel="Login to DocsShelf"
          >
            Login to DocsShelf
          </Title>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            accessible={true}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your email address"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            accessible={true}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
          />
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Login button"
            accessibilityHint="Tap to log in with your credentials"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            style={styles.button}
            icon="fingerprint"
            disabled={!isBiometricAvailable}
            accessible={true}
            accessibilityLabel="Biometric login"
            accessibilityHint="Use fingerprint or face ID to log in"
          >
            {isBiometricAvailable
              ? 'Use Biometric Login'
              : 'Biometric Unavailable'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              HapticFeedback.trigger('impactLight');
              navigation.navigate('Register');
            }}
            style={styles.button}
            accessible={true}
            accessibilityLabel="Register new account"
            accessibilityHint="Navigate to registration screen"
          >
            Register
          </Button>
        </Card.Content>
      </Card>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        accessible={true}
        accessibilityLabel={snackbarMessage}
      >
        {snackbarMessage}
      </Snackbar>
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
