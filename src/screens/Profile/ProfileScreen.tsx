import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Text,
  Chip,
  ProgressBar,
  Divider,
  List,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import {
  selectProfile,
  selectProfileIsLoading,
  selectProfileError,
  selectProfileCompleteness,
  loadUserProfile,
  enableBiometrics,
} from '../../store/slices/profileSlice';
import { selectUser, logoutUser } from '../../store/slices/authSlice';

interface ProfileScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isLoading = useSelector(selectProfileIsLoading);
  const error = useSelector(selectProfileError);
  const completeness = useSelector(selectProfileCompleteness);

  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    if (user?.id && !profile) {
      dispatch(loadUserProfile(user.id));
    }
  }, [user?.id, profile, dispatch]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleEnableBiometrics = async () => {
    if (!user?.id) return;
    
    try {
      await dispatch(enableBiometrics(user.id)).unwrap();
      setBiometricEnabled(true);
      Alert.alert('Success', 'Biometric authentication has been enabled');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to enable biometrics');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.id) {
                await dispatch(logoutUser(user.id)).unwrap();
              }
              navigation.navigate('Login');
            } catch (err) {
              console.error('Logout error:', err);
              // Navigate to login anyway
              navigation.navigate('Login');
            }
          },
        },
      ]
    );
  };

  const getInitials = () => {
    if (!profile) return 'U';
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  };

  const getCompletionColor = () => {
    if (completeness < 50) return '#f44336';
    if (completeness < 80) return '#ff9800';
    return '#4caf50';
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>Error loading profile: {error}</Text>
            <Button
              mode="contained"
              onPress={() => user?.id && dispatch(loadUserProfile(user.id))}
              style={styles.retryButton}
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={getInitials()}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Title style={styles.name}>
              {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading...'}
            </Title>
            <Paragraph style={styles.email}>
              {profile?.email || user?.email}
            </Paragraph>
            
            {/* Profile Completion */}
            <View style={styles.completionContainer}>
              <Text style={styles.completionLabel}>
                Profile Completion: {completeness}%
              </Text>
              <ProgressBar
                progress={completeness / 100}
                color={getCompletionColor()}
                style={styles.progressBar}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Profile Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title>Profile Management</Title>
          
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleEditProfile}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Phone Numbers"
            description={`${profile?.phoneNumbers?.length || 0} phone numbers`}
            left={(props) => <List.Icon {...props} icon="phone" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PhoneNumbers')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Change Password"
            description="Update your account password"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleChangePassword}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Security Settings */}
      <Card style={styles.securityCard}>
        <Card.Content>
          <Title>Security Settings</Title>
          
          <List.Item
            title="Biometric Authentication"
            description={biometricEnabled ? "Enabled" : "Not enabled"}
            left={(props) => <List.Icon {...props} icon="fingerprint" />}
            right={() => (
              <Button
                mode={biometricEnabled ? "outlined" : "contained"}
                onPress={biometricEnabled ? undefined : handleEnableBiometrics}
                disabled={biometricEnabled}
                compact
              >
                {biometricEnabled ? 'Enabled' : 'Enable'}
              </Button>
            )}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Account Information */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title>Account Information</Title>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since:</Text>
            <Text style={styles.infoValue}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>
              {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Status:</Text>
            <Chip
              icon={profile?.emailVerified ? "check-circle" : "clock"}
              mode="outlined"
              style={styles.statusChip}
            >
              {profile?.emailVerified ? 'Verified' : 'Pending Verification'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('DeleteAccount')}
          style={styles.deleteButton}
          textColor="#f44336"
        >
          Delete Account
        </Button>
        
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginBottom: 12,
  },
  completionContainer: {
    marginTop: 8,
  },
  completionLabel: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionsCard: {
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  securityCard: {
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusChip: {
    backgroundColor: 'transparent',
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  logoutButton: {
    marginTop: 8,
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'center',
  },
});