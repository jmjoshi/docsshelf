import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import LoginSimple from '../screens/Auth/LoginSimple';

const RootStack = createStackNavigator();

// Simple placeholder components
function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>🏠 Home Screen</Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>
        Navigation is working!
      </Text>
    </View>
  );
}

function RegisterScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        📝 Register Screen
      </Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>
        Registration form will go here
      </Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginSimple} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
    </RootStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Home" component={HomeScreen} />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  console.log('[DEBUG] AppNavigator - isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
