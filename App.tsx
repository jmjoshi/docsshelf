import React from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';

console.log('=== APP LOADING ===');

export default function App() {
  console.log('=== APP COMPONENT RENDERING ===');

  return (
    <Provider store={store}>
      <AppNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}
