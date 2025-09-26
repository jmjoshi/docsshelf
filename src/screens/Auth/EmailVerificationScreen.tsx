import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  TextInput,
  Button,
  Text,
  HelperText,
  IconButton,
  ProgressBar,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { EmailVerificationService } from '../../services/emailVerification';

interface EmailVerificationScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
  route?: {
    params?: {
      email?: string;
    };
  };
}

export default function EmailVerificationScreen({ 
  navigation, 
  route 
}: EmailVerificationScreenProps) {
  const user = useSelector(selectUser);
  const email = route?.params?.email || user?.email || '';

  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(3);
  const [canResend, setCanResend] = useState(false);

  // Timer for code expiry and resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft]);

  // Load verification code info on mount
  useEffect(() => {
    loadVerificationInfo();
  }, []);

  const loadVerificationInfo = async () => {
    if (!user?.id) return;

    try {
      const info = await EmailVerificationService.getVerificationCodeInfo(user.id);
      setAttempts(info.attempts || 0);
      setCanResend(info.canResend);
      
      if (info.expiresAt) {
        const expiryTime = new Date(info.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeLeft(remaining);
      }
    } catch (error) {
      console.error('Failed to load verification info:', error);
    }
  };

  const handleSendCode = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      await EmailVerificationService.sendVerificationEmail(user.id, email);
      Alert.alert(
        'Verification Code Sent',
        `A 6-digit verification code has been sent to ${email}`
      );
      
      // Set 10-minute timer for code expiry
      setTimeLeft(600); // 10 minutes in seconds
      setCanResend(false);
      await loadVerificationInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await EmailVerificationService.verifyEmailCode(
        user.id, 
        verificationCode
      );

      if (isValid) {
        Alert.alert(
          'Email Verified',
          'Your email has been successfully verified!',
          [
            { 
              text: 'Continue', 
              onPress: () => navigation.navigate('Profile') 
            }
          ]
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      await loadVerificationInfo(); // Refresh attempts count
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) {
      Alert.alert('Please Wait', 'You can request a new code in a few minutes');
      return;
    }

    await handleSendCode();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressValue = (): number => {
    return timeLeft > 0 ? timeLeft / 600 : 0; // 600 seconds = 10 minutes
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Title style={styles.title}>Verify Email</Title>
          </View>

          <View style={styles.content}>
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>Verifying email for:</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <Paragraph style={styles.description}>
              We've sent a 6-digit verification code to your email address. 
              Please enter the code below to verify your email.
            </Paragraph>

            {/* Verification Code Input */}
            <TextInput
              label="Verification Code"
              value={verificationCode}
              onChangeText={(text) => {
                // Only allow numbers and limit to 6 digits
                const numbers = text.replace(/[^0-9]/g, '').substring(0, 6);
                setVerificationCode(numbers);
                if (error) setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              error={!!error}
              disabled={isVerifying || attempts >= maxAttempts}
              style={styles.codeInput}
              autoFocus
            />

            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>

            {/* Timer and Progress */}
            {timeLeft > 0 && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  Code expires in: {formatTime(timeLeft)}
                </Text>
                <ProgressBar
                  progress={getProgressValue()}
                  color="#2196F3"
                  style={styles.progressBar}
                />
              </View>
            )}

            {/* Attempts Info */}
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                Attempts: {attempts}/{maxAttempts}
              </Text>
              {attempts >= maxAttempts && (
                <Text style={styles.maxAttemptsText}>
                  Maximum attempts reached. Please request a new code.
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleVerifyCode}
                disabled={
                  !verificationCode || 
                  verificationCode.length !== 6 || 
                  isVerifying || 
                  attempts >= maxAttempts
                }
                loading={isVerifying}
                style={styles.verifyButton}
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>

              <Button
                mode="outlined"
                onPress={handleResendCode}
                disabled={!canResend || isResending || timeLeft > 0}
                loading={isResending}
                style={styles.resendButton}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </Button>
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Didn't receive the code? Check your spam folder or try again in a few minutes.
              </Text>
              
              <Button
                mode="text"
                onPress={() => navigation.navigate('ContactSupport')}
                style={styles.supportButton}
              >
                Contact Support
              </Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  card: {
    margin: 20,
    maxWidth: 400,
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
  },
  content: {
    paddingHorizontal: 10,
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
  description: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  codeInput: {
    marginBottom: 10,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
  },
  timerContainer: {
    marginTop: 20,
    marginBottom: 15,
  },
  timerText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  attemptsContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  attemptsText: {
    color: '#666',
    fontSize: 14,
  },
  maxAttemptsText: {
    color: '#f44336',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 30,
  },
  verifyButton: {
    paddingVertical: 8,
  },
  resendButton: {
    paddingVertical: 8,
  },
  helpContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  helpText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  supportButton: {
    marginTop: 10,
  },
});