import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import { DatabaseService } from './src/services/database/mock';

console.log('=== APP LOADING ===');

function AppWrapper() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('=== INITIALIZING DATABASE ===');
        await DatabaseService.init();
        console.log('=== DATABASE INITIALIZED ===');
        setIsInitialized(true);
      } catch (error) {
        console.error('=== APP INITIALIZATION ERROR ===', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Continue anyway for testing
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20, fontSize: 16 }}>Loading DocsShelf...</Text>
      </View>
    );
  }

  if (initError) {
    console.warn('App continuing with initialization error:', initError);
  }

  return <AppNavigator />;
}

export default function App() {
  console.log('=== APP COMPONENT RENDERING ===');

  return (
    <Provider store={store}>
      <AppWrapper />
      <StatusBar style="auto" />
    </Provider>
  );
}
