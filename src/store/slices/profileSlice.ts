import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '../../services/auth';
import { DatabaseService } from '../../services/database/mock';

interface PhoneNumber {
  type: string;
  number: string;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: PhoneNumber[];
  createdAt?: string;
  updatedAt?: string;
  profileCompleteness: number;
  emailVerified: boolean;
  biometricsEnabled: boolean;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  isDirty: boolean; // Track if profile has unsaved changes
}

const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
  validationErrors: {},
  isDirty: false,
};

// Calculate profile completeness percentage
const calculateProfileCompleteness = (profile: Partial<UserProfile>): number => {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.email,
    profile.phoneNumbers?.length ? profile.phoneNumbers[0]?.number : null,
  ];
  
  const completedFields = fields.filter(field => field && field.toString().trim()).length;
  return Math.round((completedFields / fields.length) * 100);
};

// Async thunks for profile management
export const loadUserProfile = createAsyncThunk<
  UserProfile,
  string,
  { rejectValue: string }
>('profile/loadUserProfile', async (userId, { rejectWithValue }) => {
  try {
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return rejectWithValue('User profile not found');
    }
    
    const profileCompleteness = calculateProfileCompleteness(user);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumbers: user.phoneNumbers || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileCompleteness,
      emailVerified: false, // TODO: Implement email verification
      biometricsEnabled: false, // TODO: Check biometric status
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to load profile'
    );
  }
});

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  { userId: string; updates: Partial<UserProfile> },
  { rejectValue: string }
>('profile/updateUserProfile', async ({ userId, updates }, { rejectWithValue }) => {
  try {
    // Validate updates
    if (updates.email && !isValidEmail(updates.email)) {
      return rejectWithValue('Please enter a valid email address');
    }
    
    if (updates.firstName && (updates.firstName.length < 2 || updates.firstName.length > 50)) {
      return rejectWithValue('First name must be between 2 and 50 characters');
    }
    
    if (updates.lastName && (updates.lastName.length < 2 || updates.lastName.length > 50)) {
      return rejectWithValue('Last name must be between 2 and 50 characters');
    }

    // Update user in database
    const updatedUser = await DatabaseService.updateUser(userId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedUser) {
      return rejectWithValue('Failed to update profile');
    }

    const profileCompleteness = calculateProfileCompleteness(updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumbers: updatedUser.phoneNumbers || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      profileCompleteness,
      emailVerified: false, // TODO: Implement email verification status
      biometricsEnabled: false, // TODO: Check biometric status
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update profile'
    );
  }
});

export const addPhoneNumber = createAsyncThunk<
  UserProfile,
  { userId: string; phoneNumber: PhoneNumber },
  { rejectValue: string }
>('profile/addPhoneNumber', async ({ userId, phoneNumber }, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { profile: ProfileState };
    const currentProfile = state.profile.profile;
    
    if (!currentProfile) {
      return rejectWithValue('Profile not loaded');
    }

    if (currentProfile.phoneNumbers.length >= 3) {
      return rejectWithValue('Maximum 3 phone numbers allowed');
    }

    // Validate phone number
    if (!isValidPhoneNumber(phoneNumber.number)) {
      return rejectWithValue('Please enter a valid phone number');
    }

    const updatedPhoneNumbers = [...currentProfile.phoneNumbers, phoneNumber];

    // Update user in database
    const updatedUser = await DatabaseService.updateUser(userId, {
      phoneNumbers: updatedPhoneNumbers,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedUser) {
      return rejectWithValue('Failed to add phone number');
    }

    const profileCompleteness = calculateProfileCompleteness(updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumbers: updatedUser.phoneNumbers || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      profileCompleteness,
      biometricEnabled: false, // Default for new profiles
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to add phone number'
    );
  }
});

export const removePhoneNumber = createAsyncThunk<
  UserProfile,
  { userId: string; index: number },
  { rejectValue: string }
>('profile/removePhoneNumber', async ({ userId, index }, { rejectWithValue, getState }) => {
  try {
    const state = getState() as { profile: ProfileState };
    const currentProfile = state.profile.profile;
    
    if (!currentProfile) {
      return rejectWithValue('Profile not loaded');
    }

    if (currentProfile.phoneNumbers.length <= 1) {
      return rejectWithValue('At least one phone number is required');
    }

    const updatedPhoneNumbers = currentProfile.phoneNumbers.filter((_, i) => i !== index);

    // Update user in database
    const updatedUser = await DatabaseService.updateUser(userId, {
      phoneNumbers: updatedPhoneNumbers,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedUser) {
      return rejectWithValue('Failed to remove phone number');
    }

    const profileCompleteness = calculateProfileCompleteness(updatedUser);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumbers: updatedUser.phoneNumbers || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      profileCompleteness,
      biometricEnabled: false, // Default for new profiles
    };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to remove phone number'
    );
  }
});

export const enableBiometrics = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>('profile/enableBiometrics', async (userId, { rejectWithValue }) => {
  try {
    const success = await AuthService.setupBiometricAuth(userId);
    if (!success) {
      return rejectWithValue('Failed to enable biometric authentication');
    }
    return true;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to enable biometrics'
    );
  }
});

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-().\s]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
      state.validationErrors = {};
    },
    setValidationError: (state, action: PayloadAction<{ field: string; message: string }>) => {
      state.validationErrors[action.payload.field] = action.payload.message;
    },
    clearValidationError: (state, action: PayloadAction<string>) => {
      delete state.validationErrors[action.payload];
    },
    markAsDirty: (state) => {
      state.isDirty = true;
    },
    markAsClean: (state) => {
      state.isDirty = false;
    },
    resetProfile: () => initialState,
  },
  extraReducers: (builder) => {
    // Load user profile
    builder
      .addCase(loadUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isLoading = false;
        state.error = null;
        state.isDirty = false;
      })
      .addCase(loadUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load profile';
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.validationErrors = {};
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isSaving = false;
        state.error = null;
        state.isDirty = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload || 'Failed to update profile';
      });

    // Add phone number
    builder
      .addCase(addPhoneNumber.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(addPhoneNumber.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isSaving = false;
        state.error = null;
      })
      .addCase(addPhoneNumber.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload || 'Failed to add phone number';
      });

    // Remove phone number
    builder
      .addCase(removePhoneNumber.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(removePhoneNumber.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.isSaving = false;
        state.error = null;
      })
      .addCase(removePhoneNumber.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload || 'Failed to remove phone number';
      });

    // Enable biometrics
    builder
      .addCase(enableBiometrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableBiometrics.fulfilled, (state) => {
        if (state.profile) {
          state.profile.biometricsEnabled = true;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(enableBiometrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to enable biometrics';
      });
  },
});

export const {
  clearError,
  setValidationError,
  clearValidationError,
  markAsDirty,
  markAsClean,
  resetProfile,
} = profileSlice.actions;

// Selectors
export const selectProfile = (state: { profile: ProfileState }) => state.profile.profile;
export const selectProfileIsLoading = (state: { profile: ProfileState }) => state.profile.isLoading;
export const selectProfileIsSaving = (state: { profile: ProfileState }) => state.profile.isSaving;
export const selectProfileError = (state: { profile: ProfileState }) => state.profile.error;
export const selectValidationErrors = (state: { profile: ProfileState }) => state.profile.validationErrors;
export const selectIsProfileDirty = (state: { profile: ProfileState }) => state.profile.isDirty;
export const selectProfileCompleteness = (state: { profile: ProfileState }) => 
  state.profile.profile?.profileCompleteness || 0;

export default profileSlice.reducer;