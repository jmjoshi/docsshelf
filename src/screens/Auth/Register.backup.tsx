import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Title, HelperText, IconButton } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { loginSuccess } from '../../store/slices/authSlice';
import { AuthService } from '../../services/auth';

interface RegisterScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

interface PhoneNumber {
  type: string;
  number: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumbers: PhoneNumber[];
}

// Validation schema with comprehensive rules
const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(
      /^[A-Za-z\s'-]+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(
      /^[A-Za-z\s'-]+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .lowercase('Email must be lowercase')
    .max(255, 'Email cannot exceed 255 characters'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(12, 'Password must be at least 12 characters long')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  phoneNumbers: yup
    .array()
    .of(
      yup.object().shape({
        type: yup
          .string()
          .required('Phone type is required')
          .oneOf(
            ['mobile', 'home', 'work'],
            'Phone type must be mobile, home, or work'
          ),
        number: yup
          .string()
          .required('Phone number is required')
          .matches(/^\+?[\d\s\-().\s]+$/, 'Please enter a valid phone number')
          .min(10, 'Phone number must be at least 10 digits')
          .max(15, 'Phone number cannot exceed 15 digits'),
      })
    )
    .required('Phone numbers are required')
    .min(1, 'At least one phone number is required')
    .max(3, 'Maximum 3 phone numbers allowed'),
});

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();

  // Initialize react-hook-form with validation schema
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumbers: [{ type: 'mobile', number: '' }],
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Use field array for dynamic phone numbers
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  const password = watch('password');

  const addPhoneNumber = () => {
    if (fields.length < 3) {
      append({ type: 'home', number: '' });
    }
  };

  const removePhoneNumber = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const user = await AuthService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumbers: data.phoneNumbers.filter((p) => p.number.trim()),
      });

      dispatch(loginSuccess(user));
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Main') },
      ]);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: '#ccc' };
    
    let score = 0;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[@$!%*?&]/.test(pwd)) score++;

    const levels = [
      { score: 0, text: '', color: '#ccc' },
      { score: 1, text: 'Very Weak', color: '#f44336' },
      { score: 2, text: 'Weak', color: '#ff9800' },
      { score: 3, text: 'Fair', color: '#ffeb3b' },
      { score: 4, text: 'Good', color: '#8bc34a' },
      { score: 5, text: 'Strong', color: '#4caf50' },
    ];

    return levels[score] || levels[0];
  };

  const strengthInfo = getPasswordStrength(password || '');

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Register for DocsShelf</Title>
          
          {/* First Name */}
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="First Name *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.firstName}
                style={styles.input}
                autoCapitalize="words"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.firstName}>
            {errors.firstName?.message}
          </HelperText>

          {/* Last Name */}
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Last Name *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.lastName}
                style={styles.input}
                autoCapitalize="words"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.lastName}>
            {errors.lastName?.message}
          </HelperText>

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email Address *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email?.message}
          </HelperText>

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.password}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                autoComplete="new-password"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>
          {password && (
            <Text style={[styles.passwordStrength, { color: strengthInfo.color }]}>
              Password Strength: {strengthInfo.text}
            </Text>
          )}

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Confirm Password *"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                autoComplete="new-password"
              />
            )}
          />
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword?.message}
          </HelperText>

          {/* Phone Numbers */}
          <Text style={styles.subtitle}>Phone Numbers *</Text>
          {fields.map((field, index) => (
            <View key={field.id} style={styles.phoneContainer}>
              <Controller
                control={control}
                name={`phoneNumbers.${index}.type`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Type"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.phoneNumbers?.[index]?.type}
                    style={[styles.input, styles.phoneTypeInput]}
                  />
                )}
              />
              <Controller
                control={control}
                name={`phoneNumbers.${index}.number`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.phoneNumbers?.[index]?.number}
                    keyboardType="phone-pad"
                    style={[styles.input, styles.phoneNumberInput]}
                  />
                )}
              />
              {fields.length > 1 && (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => removePhoneNumber(index)}
                  style={styles.removeButton}
                />
              )}
            </View>
          ))}
          
          <HelperText type="error" visible={!!errors.phoneNumbers}>
            {errors.phoneNumbers?.message}
          </HelperText>

          <Button
            mode="outlined"
            onPress={addPhoneNumber}
            disabled={fields.length >= 3}
            style={styles.button}
          >
            Add Phone Number ({fields.length}/3)
          </Button>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isLoading}
            loading={isLoading}
            style={[styles.button, styles.primaryButton]}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            style={styles.button}
          >
            Back to Login
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 10,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    marginBottom: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  phoneTypeInput: {
    flex: 1,
    marginRight: 10,
  },
  phoneNumberInput: {
    flex: 2,
    marginRight: 10,
  },
  removeButton: {
    margin: 0,
  },
  button: {
    marginTop: 15,
  },
  primaryButton: {
    marginTop: 20,
  },
  passwordStrength: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'right',
  },
});
