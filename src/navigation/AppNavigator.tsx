import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import LoginSimple from '../screens/Auth/LoginSimple';
import RegisterScreen from '../screens/Auth/Register';
import EmailVerificationScreen from '../screens/Auth/EmailVerificationScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import AccountDeletionScreen from '../screens/Auth/AccountDeletionScreen';
import ContactSupportScreen from '../screens/Auth/ContactSupportScreen';
import HomeScreen from '../screens/Home';

const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Simple placeholder components for screens not yet implemented
function DocumentsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>📄 Documents</Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>
        Documents management will go here
      </Text>
    </View>
  );
}

function SettingsMainScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>⚙️ Settings</Text>
      <Text style={{ fontSize: 16, marginTop: 10 }}>
        Settings options will go here
      </Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Login" component={LoginSimple} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <RootStack.Screen name="ContactSupport" component={ContactSupportScreen} />
    </RootStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="SettingsMain" component={SettingsMainScreen} />
      <RootStack.Screen name="Profile" component={ProfileScreen} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
      <RootStack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
    </RootStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen}
        options={{
          tabBarLabel: 'Documents',
          tabBarIcon: () => <Text>📄</Text>,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      {/* Add profile screens that can be accessed from anywhere in main flow */}
      <RootStack.Screen name="Profile" component={ProfileScreen} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
      <RootStack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <RootStack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <RootStack.Screen name="ContactSupport" component={ContactSupportScreen} />
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
