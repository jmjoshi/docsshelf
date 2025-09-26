import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService, User, RegisterData, LoginCredentials } from '../../services/auth';
import { EmailVerificationService } from '../../services/emailVerification';

interface AuthState {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumbers: { type: string; number: string }[];
    emailVerified?: boolean;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean;
  biometricAvailable: boolean;
  emailVerification: {
    isLoading: boolean;
    error: string | null;
    isVerified: boolean;
    verificationSent: boolean;
  };
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registrationSuccess: false,
  biometricAvailable: false,
  emailVerification: {
    isLoading: false,
    error: null,
    isVerified: false,
    verificationSent: false,
  },
};

// Async thunks for authentication actions
export const registerUser = createAsyncThunk<
  User,
  RegisterData,
  { rejectValue: string }
>('auth/registerUser', async (userData, { rejectWithValue }) => {
  try {
    const user = await AuthService.register(userData);
    return user;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Registration failed'
    );
  }
});

export const loginUser = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: string }
>('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const user = await AuthService.login(credentials);
    if (!user) {
      return rejectWithValue('Login failed - invalid credentials');
    }
    return user;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Login failed'
    );
  }
});

export const authenticateWithBiometrics = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>('auth/authenticateWithBiometrics', async (_, { rejectWithValue }) => {
  try {
    const success = await AuthService.authenticateWithBiometrics();
    if (success) {
      // Get current user after biometric success
      return await AuthService.getCurrentUser();
    }
    return rejectWithValue('Biometric authentication failed');
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Biometric authentication failed'
    );
  }
});

export const logoutUser = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('auth/logoutUser', async (userId, { rejectWithValue }) => {
  try {
    await AuthService.logout(userId);
    return;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Logout failed'
    );
  }
});

export const changePassword = createAsyncThunk<
  void,
  { userId: string; currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  'auth/changePassword',
  async ({ userId, currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await AuthService.changePassword(userId, currentPassword, newPassword);
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password change failed'
      );
    }
  }
);

// Email verification async thunks
export const sendEmailVerification = createAsyncThunk<
  void,
  { userId: string; email: string },
  { rejectValue: string }
>(
  'auth/sendEmailVerification',
  async ({ userId, email }, { rejectWithValue }) => {
    try {
      await EmailVerificationService.sendVerificationEmail(userId, email);
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to send verification email'
      );
    }
  }
);

export const verifyEmail = createAsyncThunk<
  void,
  { userId: string; verificationCode: string },
  { rejectValue: string }
>(
  'auth/verifyEmail',
  async ({ userId, verificationCode }, { rejectWithValue }) => {
    try {
      const isValid = await EmailVerificationService.verifyEmailCode(userId, verificationCode);
      if (!isValid) {
        return rejectWithValue('Invalid verification code');
      }
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Email verification failed'
      );
    }
  }
);

export const checkEmailVerificationStatus = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>(
  'auth/checkEmailVerificationStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const isVerified = await EmailVerificationService.checkVerificationStatus(userId);
      return isVerified;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to check verification status'
      );
    }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
    setBiometricAvailability: (state, action: PayloadAction<boolean>) => {
      state.biometricAvailable = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearEmailVerificationError: (state) => {
      state.emailVerification.error = null;
    },
    resetEmailVerification: (state) => {
      state.emailVerification = {
        isLoading: false,
        error: null,
        isVerified: false,
        verificationSent: false,
      };
    },
    // Legacy actions for backward compatibility
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthState['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        state.registrationSuccess = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
        state.registrationSuccess = false;
      });

    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Biometric authentication
    builder
      .addCase(authenticateWithBiometrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithBiometrics.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
        state.isLoading = false;
        state.error = null;
      })
      .addCase(authenticateWithBiometrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Biometric authentication failed';
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Logout failed';
        // Still log out user even if service call fails
        state.user = null;
        state.isAuthenticated = false;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Password change failed';
      });

    // Send email verification
    builder
      .addCase(sendEmailVerification.pending, (state) => {
        state.emailVerification.isLoading = true;
        state.emailVerification.error = null;
      })
      .addCase(sendEmailVerification.fulfilled, (state) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.verificationSent = true;
        state.emailVerification.error = null;
      })
      .addCase(sendEmailVerification.rejected, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.error = action.payload || 'Failed to send verification email';
      });

    // Verify email
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.emailVerification.isLoading = true;
        state.emailVerification.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.isVerified = true;
        state.emailVerification.error = null;
        // Update user's email verified status
        if (state.user) {
          state.user.emailVerified = true;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.error = action.payload || 'Email verification failed';
      });

    // Check email verification status
    builder
      .addCase(checkEmailVerificationStatus.pending, (state) => {
        state.emailVerification.isLoading = true;
      })
      .addCase(checkEmailVerificationStatus.fulfilled, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.isVerified = action.payload;
        // Update user's email verified status
        if (state.user) {
          state.user.emailVerified = action.payload;
        }
      })
      .addCase(checkEmailVerificationStatus.rejected, (state, action) => {
        state.emailVerification.isLoading = false;
        state.emailVerification.error = action.payload || 'Failed to check verification status';
      });
  },
});

export const {
  clearError,
  clearRegistrationSuccess,
  setBiometricAvailability,
  updateUser,
  clearEmailVerificationError,
  resetEmailVerification,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
} = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
export const selectRegistrationSuccess = (state: { auth: AuthState }) =>
  state.auth.registrationSuccess;
export const selectBiometricAvailable = (state: { auth: AuthState }) =>
  state.auth.biometricAvailable;

// Email verification selectors
export const selectEmailVerification = (state: { auth: AuthState }) =>
  state.auth.emailVerification;
export const selectEmailVerificationLoading = (state: { auth: AuthState }) =>
  state.auth.emailVerification.isLoading;
export const selectEmailVerificationError = (state: { auth: AuthState }) =>
  state.auth.emailVerification.error;
export const selectEmailVerified = (state: { auth: AuthState }) =>
  state.auth.emailVerification.isVerified;
export const selectVerificationSent = (state: { auth: AuthState }) =>
  state.auth.emailVerification.verificationSent;

export default authSlice.reducer;
