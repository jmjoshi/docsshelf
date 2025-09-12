import React, { useEffect, useState } from 'react';
import { StatusBar, Alert } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { store, persistor } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthService } from './src/services/auth';
import { DatabaseService } from './src/services/database';
import { StorageService } from './src/services/storage';
import { SyncService } from './src/services/sync';
import { emergencyCleanup } from './src/utils/emergencyCleanup';

// Enhanced theme with accessibility support
const createTheme = (isDark: boolean) => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // High contrast colors for accessibility
      primary: '#0066cc',
      onPrimary: '#ffffff',
      secondary: '#666666',
      onSecondary: '#ffffff',
      surface: '#ffffff',
      onSurface: '#000000',
      surfaceVariant: '#f5f5f5',
      onSurfaceVariant: '#333333',
      background: '#ffffff',
      onBackground: '#000000',
      error: '#d32f2f',
      onError: '#ffffff',
    },
  };
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Initialize all services with enhanced error handling
  const initializeApp = async () => {
    try {
      console.log('Initializing DocsShelf application...');

      const initStartTime = Date.now();

      // Initialize core services first
      console.log('Initializing database...');
      await DatabaseService.initDatabase();

      console.log('Initializing authentication service...');
      await AuthService.init();

      console.log('Initializing storage service...');
      await StorageService.initStorage();

      // Initialize sync service last
      console.log('Initializing sync service...');
      await SyncService.initialize();

      const initTime = Date.now() - initStartTime;
      console.log(`App initialized successfully in ${initTime}ms`);

      // Check performance benchmark
      if (initTime > 1500) {
        console.warn(
          `App initialization time (${initTime}ms) exceeds target (1500ms)`
        );
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize application:', error);
      setInitializationError(
        error instanceof Error ? error.message : 'Unknown initialization error'
      );
      setIsLoading(false);

      // Show user-friendly error with retry option
      Alert.alert(
        'Initialization Error',
        'Failed to start the application. Please check your internet connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setInitializationError(null);
              setIsLoading(true);
              initializeApp();
            },
          },
          {
            text: 'Continue Offline',
            onPress: () => {
              setInitializationError(null);
              setIsLoading(false);
            },
          },
        ]
      );
    }
  };

  useEffect(() => {
    // Make emergency cleanup available in browser console for debugging
    if (typeof window !== 'undefined') {
      (
        window as typeof window & { emergencyCleanup: typeof emergencyCleanup }
      ).emergencyCleanup = emergencyCleanup;
      console.log('🚨 Emergency cleanup available: window.emergencyCleanup');
    }

    initializeApp();

    return () => {
      // Cleanup services
      DatabaseService.closeDatabase().catch(console.error);
    };
  }, []);

  // Create theme
  const theme = React.useMemo(() => {
    return createTheme(isDark);
  }, [isDark]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.surface}
          />
          {/* Loading screen - implement your loading component here */}
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (initializationError) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.surface}
          />
          {/* Error screen - implement your error component here */}
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              backgroundColor={theme.colors.surface}
            />
            <AppNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
