import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  RadioButton,
  Text,
  Divider,
  HelperText,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { 
  AccountDeletionService, 
  AccountDeletionStatus,
  AccountDeletionUtils 
} from '../../services/accountDeletion';

interface AccountDeletionScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function AccountDeletionScreen({ navigation }: AccountDeletionScreenProps) {
  const user = useSelector(selectUser);
  
  const [currentStep, setCurrentStep] = useState<'reason' | 'confirm' | 'verify'>('reason');
  const [selectedReason, setSelectedReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus>({
    isPending: false,
    confirmationCodeSent: false,
    canResendCode: true,
    attemptsRemaining: 3,
  });

  const reasons = AccountDeletionUtils.getDeletionReasons();

  // Load deletion status on mount
  useEffect(() => {
    loadDeletionStatus();
  }, []);

  const loadDeletionStatus = async () => {
    if (!user?.id) return;

    try {
      const status = await AccountDeletionService.getAccountDeletionStatus(user.id);
      setDeletionStatus(status);
      
      if (status.isPending && status.confirmationCodeSent) {
        setCurrentStep('verify');
      }
    } catch (error) {
      console.error('Failed to load deletion status:', error);
    }
  };

  const handleReasonSubmit = () => {
    if (!selectedReason) {
      setError('Please select a reason for account deletion');
      return;
    }
    
    setError('');
    setCurrentStep('confirm');
  };

  const handleInitiateDeletion = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await AccountDeletionService.initiateAccountDeletion(
        user.id,
        selectedReason,
        feedbackText.trim()
      );

      Alert.alert(
        'Confirmation Code Sent',
        `A confirmation code has been sent to ${user.email}. Please check your email and enter the code to confirm account deletion.`,
        [{ text: 'OK', onPress: () => setCurrentStep('verify') }]
      );

      await loadDeletionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate account deletion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!confirmationCode.trim() || confirmationCode.length !== 6) {
      setError('Please enter a valid 6-digit confirmation code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await AccountDeletionService.confirmAccountDeletion(user.id, confirmationCode);
      
      Alert.alert(
        'Account Deletion Confirmed',
        'Your account has been marked for deletion. You have 7 days to change your mind before permanent deletion. You will be logged out now.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to logout or login screen
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account deletion confirmation failed');
      await loadDeletionStatus(); // Refresh status
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError('');

    try {
      await AccountDeletionService.resendConfirmationCode(user.id);
      Alert.alert('Code Resent', 'A new confirmation code has been sent to your email');
      await loadDeletionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend confirmation code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Cancel Account Deletion',
      'Are you sure you want to cancel the account deletion process?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          onPress: async () => {
            try {
              await AccountDeletionService.cancelAccountDeletion(user.id);
              Alert.alert('Cancelled', 'Account deletion has been cancelled', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel account deletion');
            }
          },
        },
      ]
    );
  };

  const renderReasonStep = () => (
    <View>
      <Title style={styles.stepTitle}>Why are you deleting your account?</Title>
      <Paragraph style={styles.description}>
        We're sorry to see you go. Please help us understand why you're leaving.
      </Paragraph>

      <View style={styles.reasonsContainer}>
        {reasons.map((reason) => (
          <View key={reason.value} style={styles.reasonItem}>
            <RadioButton.Item
              label={reason.label}
              value={reason.value}
              status={selectedReason === reason.value ? 'checked' : 'unchecked'}
              onPress={() => {
                setSelectedReason(reason.value);
                setError('');
              }}
              mode="android"
            />
          </View>
        ))}
      </View>

      <TextInput
        label="Additional feedback (optional)"
        value={feedbackText}
        onChangeText={setFeedbackText}
        multiline
        numberOfLines={4}
        style={styles.feedbackInput}
        placeholder="Help us improve by sharing more details..."
      />

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleReasonSubmit}
          style={[styles.button, { backgroundColor: '#f44336' }]}
        >
          Continue
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View>
      <Title style={styles.stepTitle}>Confirm Account Deletion</Title>
      
      <View style={styles.warningContainer}>
        <IconButton icon="alert-circle" size={40} iconColor="#f44336" />
        <Text style={styles.warningTitle}>This action cannot be undone!</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>What will happen:</Text>
        <Text style={styles.bulletPoint}>• All your documents will be permanently deleted</Text>
        <Text style={styles.bulletPoint}>• Your profile and settings will be removed</Text>
        <Text style={styles.bulletPoint}>• You will lose access to your account immediately</Text>
        <Text style={styles.bulletPoint}>• This action cannot be reversed</Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Deletion Summary:</Text>
        <Text style={styles.summaryText}>
          <Text style={styles.label}>Reason: </Text>
          {reasons.find(r => r.value === selectedReason)?.label}
        </Text>
        {feedbackText && (
          <Text style={styles.summaryText}>
            <Text style={styles.label}>Feedback: </Text>
            {feedbackText}
          </Text>
        )}
        <Text style={styles.summaryText}>
          <Text style={styles.label}>Account: </Text>
          {user?.email}
        </Text>
      </View>

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleInitiateDeletion}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.button, { backgroundColor: '#f44336' }]}
        >
          {isLoading ? 'Sending Code...' : 'Send Confirmation Code'}
        </Button>
        <Button
          mode="outlined"
          onPress={() => setCurrentStep('reason')}
          disabled={isLoading}
          style={styles.button}
        >
          Back
        </Button>
      </View>
    </View>
  );

  const renderVerifyStep = () => (
    <View>
      <Title style={styles.stepTitle}>Enter Confirmation Code</Title>
      
      <View style={styles.emailContainer}>
        <Text style={styles.emailLabel}>Code sent to:</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
      </View>

      <Paragraph style={styles.description}>
        Please enter the 6-digit confirmation code sent to your email to finalize 
        the account deletion process.
      </Paragraph>

      <TextInput
        label="Confirmation Code"
        value={confirmationCode}
        onChangeText={(text) => {
          const numbers = text.replace(/[^0-9]/g, '').substring(0, 6);
          setConfirmationCode(numbers);
          if (error) setError('');
        }}
        keyboardType="number-pad"
        maxLength={6}
        error={!!error}
        disabled={isLoading}
        style={styles.codeInput}
        autoFocus
      />

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      {deletionStatus.attemptsRemaining < 3 && (
        <Text style={styles.attemptsText}>
          Attempts remaining: {deletionStatus.attemptsRemaining}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleConfirmDeletion}
          loading={isLoading}
          disabled={!confirmationCode || confirmationCode.length !== 6 || isLoading}
          style={[styles.button, { backgroundColor: '#f44336' }]}
        >
          {isLoading ? 'Confirming...' : 'Confirm Deletion'}
        </Button>

        <Button
          mode="outlined"
          onPress={handleResendCode}
          disabled={!deletionStatus.canResendCode || isLoading}
          style={styles.button}
        >
          Resend Code
        </Button>

        <Button
          mode="text"
          onPress={handleCancelDeletion}
          disabled={isLoading}
          style={styles.button}
        >
          Cancel Deletion
        </Button>
      </View>
    </View>
  );

  const getStepProgress = () => {
    switch (currentStep) {
      case 'reason': return 0.33;
      case 'confirm': return 0.66;
      case 'verify': return 1.0;
      default: return 0;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Title style={styles.title}>Delete Account</Title>
          </View>

          <ProgressBar
            progress={getStepProgress()}
            color="#f44336"
            style={styles.progressBar}
          />

          <Text style={styles.stepIndicator}>
            Step {currentStep === 'reason' ? '1' : currentStep === 'confirm' ? '2' : '3'} of 3
          </Text>

          {currentStep === 'reason' && renderReasonStep()}
          {currentStep === 'confirm' && renderConfirmStep()}
          {currentStep === 'verify' && renderVerifyStep()}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 20,
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    margin: 0,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  stepIndicator: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonItem: {
    marginBottom: 5,
  },
  feedbackInput: {
    marginBottom: 10,
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#e65100',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#bf360c',
    marginBottom: 5,
    marginLeft: 10,
  },
  divider: {
    marginVertical: 20,
  },
  summaryContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  emailContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  codeInput: {
    marginBottom: 10,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  attemptsText: {
    textAlign: 'center',
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 15,
    marginTop: 20,
  },
  button: {
    paddingVertical: 8,
  },
});