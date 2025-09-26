# Complete Testing Workflow for DocsShelf App

## Quick Start Testing Commands

### For Android Testing

```powershell
# 1. Start Android emulator from Android Studio or:
emulator -avd YourAVDName

# 2. In project directory:
cd "c:\Users\Jayant\Documents\projects\docsshelf"
npm install
npm start

# 3. In another terminal:
npm run android
```

### For iOS Testing (Cloud Build)

```powershell
# 1. Build in cloud:
eas build --platform ios --profile development

# 2. For Expo Go testing:
npm start
# Scan QR code with Expo Go app on iOS device
```

## Development Testing Workflow

### 1. Pre-Testing Setup

```powershell
# Ensure all dependencies are installed
npm install

# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests
npm test
```

### 2. Android Development Testing

#### A. Emulator Testing

```powershell
# Start emulator
emulator -avd YourAVDName

# Start dev server with clearing cache
npx expo start --clear

# Run on Android
npm run android

# For debugging
npm run android -- --variant debug
```

#### B. Physical Device Testing

```powershell
# Enable USB debugging on device
# Connect via USB
adb devices

# Run on connected device
npm run android
```

#### C. Performance Testing on Android

```powershell
# Test with low-end device simulation
npm run test:low-end

# Monitor memory usage
npm run profile:memory

# Run performance tests
npm run test:performance
```

### 3. iOS Development Testing

#### A. Expo Go Testing (Recommended for Development)

```powershell
# Start with tunnel for external access
expo start --tunnel

# Use Expo Go app on iOS device to scan QR code
```

#### B. Cloud Build Testing

```powershell
# Development build
eas build --platform ios --profile development

# Preview build for testing
eas build --platform ios --profile preview

# Check build status
eas build:list
```

#### C. TestFlight Distribution

```powershell
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store Connect (requires Apple Developer account)
eas submit --platform ios
```

### 4. E2E Testing with Detox

#### Android E2E Testing

```powershell
# Build the app for testing
npx detox build --configuration android.debug

# Run E2E tests
npx detox test --configuration android.debug

# Run specific test file
npx detox test --configuration android.debug e2e/firstTest.test.js
```

#### iOS E2E Testing (Requires macOS or cloud macOS)

```powershell
# On macOS or cloud macOS:
npx detox build --configuration ios.debug
npx detox test --configuration ios.debug
```

### 5. Comprehensive Testing Suite

#### Run All Tests

```powershell
# Run complete test suite
npm run test:all

# Individual test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:components    # Component tests
npm run test:performance   # Performance tests

# Generate coverage report
npm run test:coverage
```

### 6. Build Testing

#### Development Builds

```powershell
# Android development build
eas build --platform android --profile development

# iOS development build
eas build --platform ios --profile development
```

#### Production Builds

```powershell
# Android production (AAB for Play Store)
eas build --platform android --profile production

# iOS production (for App Store)
eas build --platform ios --profile production

# Build for both platforms
npm run build:all
```

### 7. Web Testing (Additional Platform)

```powershell
# Development web server
npm run web:dev

# Production web build
npm run build:web:prod

# Test production build locally
npm run web:prod
```

## Testing Checklist

### Before Each Release

- [ ] All unit tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Android emulator testing completed
- [ ] Android physical device testing completed
- [ ] iOS Expo Go testing completed
- [ ] iOS TestFlight testing completed (if applicable)
- [ ] E2E tests pass on Android
- [ ] Performance tests pass
- [ ] Web version tested
- [ ] Production builds successful

### Device-Specific Testing

- [ ] Test on various Android API levels (28, 29, 30, 31+)
- [ ] Test on different screen sizes
- [ ] Test camera functionality
- [ ] Test document picker
- [ ] Test storage permissions
- [ ] Test offline functionality
- [ ] Test biometric authentication (if implemented)

## Troubleshooting Common Issues

### Android Issues

```powershell
# Clear cache and restart
npx expo start --clear

# Clean Android build
cd android && ./gradlew clean && cd ..

# Reset Metro bundler
npx react-native start --reset-cache

# Check ADB connection
adb devices
adb kill-server
adb start-server
```

### iOS Issues

```powershell
# Clear Expo cache
expo r -c

# Check EAS build logs
eas build:list
```

### General Issues

```powershell
# Reinstall dependencies
rm -rf node_modules
npm install

# Check for outdated packages
npm outdated

# Update Expo SDK
npx expo upgrade
```
