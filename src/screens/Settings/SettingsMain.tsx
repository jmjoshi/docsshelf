import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Switch } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { toggleTheme } from '../../store/slices/settingsSlice';

export default function SettingsMainScreen() {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Settings</Title>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Appearance</Title>
          <View style={styles.setting}>
            <Paragraph>Dark Mode</Paragraph>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={() => {
                dispatch(toggleTheme());
              }}
            />
          </View>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Language</Title>
          <Paragraph>{settings.language}</Paragraph>
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Security</Title>
          <Paragraph>Biometric authentication enabled</Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
