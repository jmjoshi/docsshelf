import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthService } from './src/services/auth';
import { DatabaseService } from './src/services/database';
import { StorageService } from './src/services/storage';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
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

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize services
        await AuthService.init();
        await DatabaseService.initDatabase();
        await StorageService.initStorage();
        console.log('App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <AppNavigator />
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
