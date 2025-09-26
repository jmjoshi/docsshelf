import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  HelperText,
  Text,
  IconButton,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  selectProfile,
  selectProfileIsSaving,
  selectProfileError,
  selectValidationErrors,
  selectIsProfileDirty,
  updateUserProfile,
  markAsDirty,
  markAsClean,
  clearError,
} from '../../store/slices/profileSlice';
import { selectUser } from '../../store/slices/authSlice';

interface EditProfileScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

// Validation schema
const editProfileSchema = yup.object().shape({
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
});

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const profile = useSelector(selectProfile);
  const isSaving = useSelector(selectProfileIsSaving);
  const error = useSelector(selectProfileError);
  const validationErrors = useSelector(selectValidationErrors);
  const isDirty = useSelector(selectIsProfileDirty);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<EditProfileFormData>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
    },
    mode: 'onChange',
  });

  // Watch for form changes
  const formValues = watch();

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
    }
  }, [profile, reset]);

  // Track unsaved changes
  useEffect(() => {
    if (profile) {
      const hasChanges = 
        formValues.firstName !== profile.firstName ||
        formValues.lastName !== profile.lastName ||
        formValues.email !== profile.email;
      
      setHasUnsavedChanges(hasChanges);
      
      if (hasChanges && !isDirty) {
        dispatch(markAsDirty());
      } else if (!hasChanges && isDirty) {
        dispatch(markAsClean());
      }
    }
  }, [formValues, profile, isDirty, dispatch]);

  // Handle form submission
  const onSubmit = async (data: EditProfileFormData) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    dispatch(clearError());

    try {
      await dispatch(updateUserProfile({
        userId: user.id,
        updates: {
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim().toLowerCase(),
        },
      })).unwrap();

      setHasUnsavedChanges(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update profile'
      );
    }
  };

  // Handle back navigation with unsaved changes warning
  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard Changes',
            style: 'destructive',
            onPress: () => {
              dispatch(markAsClean());
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Handle reset form
  const handleReset = () => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
      setHasUnsavedChanges(false);
      dispatch(markAsClean());
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
              onPress={handleGoBack}
              style={styles.backButton}
            />
            <Title style={styles.title}>Edit Profile</Title>
            <View style={styles.placeholder} />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

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
                error={!!errors.firstName || !!validationErrors.firstName}
                style={styles.input}
                autoCapitalize="words"
                disabled={isSaving}
              />
            )}
          />
          <HelperText
            type="error"
            visible={!!errors.firstName || !!validationErrors.firstName}
          >
            {errors.firstName?.message || validationErrors.firstName}
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
                error={!!errors.lastName || !!validationErrors.lastName}
                style={styles.input}
                autoCapitalize="words"
                disabled={isSaving}
              />
            )}
          />
          <HelperText
            type="error"
            visible={!!errors.lastName || !!validationErrors.lastName}
          >
            {errors.lastName?.message || validationErrors.lastName}
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
                error={!!errors.email || !!validationErrors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={isSaving}
              />
            )}
          />
          <HelperText
            type="error"
            visible={!!errors.email || !!validationErrors.email}
          >
            {errors.email?.message || validationErrors.email}
          </HelperText>

          {/* Profile Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Profile created: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
            <Text style={styles.infoText}>
              Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleReset}
              disabled={!hasUnsavedChanges || isSaving}
              style={styles.resetButton}
            >
              Reset
            </Button>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || !hasUnsavedChanges || isSaving}
              loading={isSaving}
              style={styles.saveButton}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </View>

          {hasUnsavedChanges && (
            <Text style={styles.unsavedText}>
              You have unsaved changes
            </Text>
          )}
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
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    margin: 0,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    flex: 1,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
  },
  input: {
    marginBottom: 5,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  unsavedText: {
    textAlign: 'center',
    color: '#ff9800',
    fontWeight: '600',
    marginTop: 12,
    fontSize: 14,
  },
});