import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export default function SettingsMainScreen() {
  const settings = useSelector((state: RootState) => state.settings);

  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
      <Text>Theme: {settings.theme}</Text>
      <Text>Language: {settings.language}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
