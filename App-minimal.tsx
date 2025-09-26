import React from 'react';
import { View, Text } from 'react-native';

console.log('=== MINIMAL APP LOADING ===');

export default function App() {
  console.log('=== APP COMPONENT RENDERING ===');

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      }}
    >
      <Text style={{ fontSize: 24, color: 'black' }}>Hello DocsShelf!</Text>
      <Text style={{ fontSize: 16, color: 'gray', marginTop: 10 }}>
        App is working!
      </Text>
    </View>
  );
}
