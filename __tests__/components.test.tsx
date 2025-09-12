// Component tests for React Native components
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import DocumentsListScreen from '../src/screens/Documents/DocumentsList';
import LoginScreen from '../src/screens/Auth/Login';
import { DocumentService } from '../src/services/documents';
import { AuthService } from '../src/services/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock Expo modules
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{ uri: 'file://test.jpg' }],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    cancelled: false,
    assets: [{ uri: 'file://test.jpg' }],
  }),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  cacheDirectory: 'file://cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  readAsStringAsync: jest.fn().mockResolvedValue('test content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  getContentUriAsync: jest.fn().mockResolvedValue('content://test'),
}));

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

// Mock our haptic feedback utility
jest.mock('../src/utils/haptic-feedback', () => ({
  trigger: jest.fn(),
  Types: {
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));
// Mock react-native-safe-area-context
jest.doMock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children?: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}));

// Mock react-native-paper minimally
jest.doMock('react-native-paper', () => {
  const React = require('react');

  return {
    Card: ({ children }: any) => React.createElement('View', null, children),
    CardContent: ({ children }: any) =>
      React.createElement('View', null, children),
    Title: ({ children }: any) => React.createElement('Text', null, children),
    Paragraph: ({ children }: any) =>
      React.createElement('Text', null, children),
    Button: ({ children, onPress, disabled, loading }: any) =>
      React.createElement(
        'TouchableOpacity',
        { onPress, disabled: disabled || loading },
        children
      ),
    TextInput: ({ label, placeholder, ...props }: any) =>
      React.createElement('TextInput', {
        placeholder: placeholder || label,
        ...props,
      }),
    Searchbar: ({ placeholder, ...props }: any) =>
      React.createElement('TextInput', { placeholder, ...props }),
    Surface: ({ children }: any) => React.createElement('View', null, children),
    ActivityIndicator: () => React.createElement('View', null, 'Loading...'),
    FAB: ({ onPress }: any) =>
      React.createElement('TouchableOpacity', { onPress }, '+'),
    Snackbar: ({ children, visible }: any) =>
      visible ? React.createElement('View', null, children) : null,
    useTheme: () => ({
      colors: {
        primary: '#6200ee',
        background: '#ffffff',
        surface: '#ffffff',
        onSurface: '#000000',
        onSurfaceVariant: '#666666',
        onBackground: '#000000',
        error: '#b00020',
      },
    }),
  };
});

// Mock services with specific method mocks
jest.mock('../src/services/documents', () => ({
  DocumentService: {
    getDocumentsPaginated: jest.fn(),
    requestPermissions: jest.fn(),
    uploadFromDevice: jest.fn(),
    scanWithCamera: jest.fn(),
    searchDocumentsPaginated: jest.fn(),
  },
}));

jest.mock('../src/services/auth', () => ({
  AuthService: {
    login: jest.fn(),
    authenticateWithBiometrics: jest.fn(),
  },
}));

const mockStore = configureStore([]);

describe('DocumentsListScreen', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    store = mockStore({
      auth: { user: { id: 'user123' } },
      documents: {
        documents: [],
        totalCount: 0,
        hasMore: false,
        isLoading: false,
      },
    });
    jest.clearAllMocks();
  });

  it('renders correctly', async () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <DocumentsListScreen />
        </Provider>
      </SafeAreaProvider>
    );

    expect(getByText('Your Documents')).toBeTruthy();
  });

  it('loads documents on mount', async () => {
    const mockDocuments = [
      {
        id: '1',
        userId: 'user123',
        name: 'test.pdf',
        path: '/path/test.pdf',
        category: 'Work',
        size: 1024,
        mimeType: 'application/pdf',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        tags: [],
      },
    ];

    (
      DocumentService.getDocumentsPaginated as jest.MockedFunction<
        typeof DocumentService.getDocumentsPaginated
      >
    ).mockResolvedValue({
      documents: mockDocuments,
      totalCount: 1,
      hasMore: false,
    });

    render(
      <SafeAreaProvider>
        <Provider store={store}>
          <DocumentsListScreen />
        </Provider>
      </SafeAreaProvider>
    );

    await waitFor(() => {
      expect(DocumentService.getDocumentsPaginated).toHaveBeenCalledWith(
        'user123',
        1,
        50
      );
    });
  });

  it('handles upload document', async () => {
    (
      DocumentService.requestPermissions as jest.MockedFunction<
        typeof DocumentService.requestPermissions
      >
    ).mockResolvedValue({
      camera: true,
      mediaLibrary: true,
    });
    (
      DocumentService.uploadFromDevice as jest.MockedFunction<
        typeof DocumentService.uploadFromDevice
      >
    ).mockResolvedValue({
      id: 'newDoc',
      name: 'uploaded.pdf',
      path: '/path/uploaded.pdf',
      size: 2048,
      mimeType: 'application/pdf',
    });

    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <DocumentsListScreen />
        </Provider>
      </SafeAreaProvider>
    );

    const uploadButton = getByText('Upload Document');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(DocumentService.uploadFromDevice).toHaveBeenCalledWith(
        'user123',
        'demo-key-12345'
      );
    });
  });

  it('handles scan document', async () => {
    (
      DocumentService.requestPermissions as jest.MockedFunction<
        typeof DocumentService.requestPermissions
      >
    ).mockResolvedValue({
      camera: true,
      mediaLibrary: true,
    });
    (
      DocumentService.scanWithCamera as jest.MockedFunction<
        typeof DocumentService.scanWithCamera
      >
    ).mockResolvedValue({
      id: 'scanDoc',
      name: 'scan.jpg',
      path: '/path/scan.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
    });

    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <DocumentsListScreen />
        </Provider>
      </SafeAreaProvider>
    );

    const scanButton = getByText('Scan Document');
    fireEvent.press(scanButton);

    await waitFor(() => {
      expect(DocumentService.scanWithCamera).toHaveBeenCalledWith(
        'user123',
        'demo-key-12345'
      );
    });
  });

  it('searches documents', async () => {
    const { getByPlaceholderText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <DocumentsListScreen />
        </Provider>
      </SafeAreaProvider>
    );

    const searchInput = getByPlaceholderText('Search documents...');
    fireEvent.changeText(searchInput, 'test query');

    await waitFor(() => {
      expect(DocumentService.getDocumentsPaginated).toHaveBeenCalledWith(
        'user123',
        'test query',
        1,
        50
      );
    });
  });
});

describe('LoginScreen', () => {
  let store: ReturnType<typeof mockStore>;
  let mockNavigation: {
    navigate: jest.MockedFunction<(screen: string) => void>;
  };

  beforeEach(() => {
    store = mockStore({
      auth: { user: null },
    });
    mockNavigation = { navigate: jest.fn() };
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    const { getByText, getByPlaceholderText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <LoginScreen navigation={mockNavigation} />
        </Provider>
      </SafeAreaProvider>
    );

    expect(getByText('Login to DocsShelf')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phoneNumbers: [],
      passwordHash: 'hashedpassword',
      salt: 'salt123',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };
    (
      AuthService.login as jest.MockedFunction<typeof AuthService.login>
    ).mockResolvedValue(mockUser);

    const { getByText, getByPlaceholderText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <LoginScreen navigation={mockNavigation} />
        </Provider>
      </SafeAreaProvider>
    );

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');
    const loginButton = getByText('Login');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows error for empty fields', async () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <LoginScreen navigation={mockNavigation} />
        </Provider>
      </SafeAreaProvider>
    );

    const loginButton = getByText('Login');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Please fill all fields')).toBeTruthy();
    });
  });

  it('handles biometric authentication', async () => {
    (
      AuthService.authenticateWithBiometrics as jest.MockedFunction<
        typeof AuthService.authenticateWithBiometrics
      >
    ).mockResolvedValue(true);

    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <LoginScreen navigation={mockNavigation} />
        </Provider>
      </SafeAreaProvider>
    );

    const biometricButton = getByText('Use Biometric Login');
    fireEvent.press(biometricButton);

    await waitFor(() => {
      expect(AuthService.authenticateWithBiometrics).toHaveBeenCalled();
    });
  });

  it('navigates to register screen', () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <Provider store={store}>
          <LoginScreen navigation={mockNavigation} />
        </Provider>
      </SafeAreaProvider>
    );

    const registerButton = getByText('Register');
    fireEvent.press(registerButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });
});
