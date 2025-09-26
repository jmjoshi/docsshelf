# Step-by-Step Testing Guide for DocsShelf on Windows

## Summary

This guide provides comprehensive instructions for testing your React Native DocsShelf app on both Android and iOS platforms from a Windows machine.

## Quick Reference Commands

### Android Testing

```powershell
# 1. Start emulator, then:
npm install
npm start
npm run android

# 2. Run tests
npm test
npm run test:all
```

### iOS Testing (Limited on Windows)

```powershell
# Development testing with Expo Go
npm start
# Scan QR code with Expo Go app

# Cloud building
eas build --platform ios --profile development
```

---

## PART 1: ANDROID TESTING (Full Support on Windows)

### Prerequisites Installation

1. **Install Required Software**:
   - Node.js 16+ from [nodejs.org](https://nodejs.org)
   - Android Studio from [developer.android.com](https://developer.android.com/studio)
   - Git

2. **Run Setup Script** (Optional):

   ```powershell
   cd "c:\Users\Jayant\Documents\projects\docsshelf"
   powershell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1
   ```

3. **Set Environment Variables**:
   - `ANDROID_HOME`: `C:\Users\{YourUsername}\AppData\Local\Android\Sdk`
   - Add to PATH: `%ANDROID_HOME%\platform-tools`

### Step-by-Step Android Testing

#### Step 1: Create Virtual Device

1. Open Android Studio
2. Go to **Tools > AVD Manager**
3. Click **Create Virtual Device**
4. Choose **Pixel 4** or newer
5. Select **API level 30+** system image
6. Name your AVD (e.g., "DocsShelf_Test")

#### Step 2: Start Development Environment

```powershell
# Terminal 1: Start Android Emulator
emulator -avd DocsShelf_Test

# Terminal 2: Start project
cd "c:\Users\Jayant\Documents\projects\docsshelf"
npm install
npm start
```

#### Step 3: Run on Android

```powershell
# Terminal 3: Deploy to Android
npm run android

# Alternative: Direct Expo command
expo run:android --device
```

#### Step 4: Testing Features

- **Camera functionality**: Test document scanning
- **Storage**: Test document saving/loading
- **OCR**: Test text recognition
- **Navigation**: Test all screens
- **Performance**: Monitor memory usage

#### Step 5: Run Automated Tests

```powershell
# Unit tests
npm test

# All test suites
npm run test:all

# E2E tests (requires built APK)
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

#### Step 6: Physical Device Testing

1. Enable **Developer Options** on Android device
2. Enable **USB Debugging**
3. Connect via USB
4. Verify connection: `adb devices`
5. Run: `npm run android`

---

## PART 2: iOS TESTING (Limited Options on Windows)

### Understanding iOS Limitations

**What you CANNOT do on Windows**:

- Run iOS Simulator natively
- Build iOS apps locally
- Debug iOS apps directly with Xcode

**What you CAN do on Windows**:

- Test with Expo Go app (development)
- Build iOS apps in the cloud (EAS)
- Run unit tests for iOS-specific code
- Test web version with iOS simulation

### Method 1: Expo Go Testing (Recommended for Development)

#### Step 1: Setup

```powershell
cd "c:\Users\Jayant\Documents\projects\docsshelf"
npm install
```

#### Step 2: Start Development Server

```powershell
# Start with tunnel for external device access
expo start --tunnel

# Or regular start for local network
npm start
```

#### Step 3: Test on iOS Device

1. Install **Expo Go** app from App Store on iOS device
2. Scan QR code displayed in terminal/browser
3. App loads in Expo Go for testing

#### Limitations of Expo Go:

- Limited to Expo SDK features
- Cannot test native modules fully
- Cannot test app store builds

### Method 2: Cloud Building with EAS

#### Step 1: Setup EAS

```powershell
# Install and login
npm install -g @expo/eas-cli
eas login
```

#### Step 2: Configure Project (if not done)

```powershell
eas build:configure
```

#### Step 3: Build iOS App

```powershell
# Development build
eas build --platform ios --profile development

# Preview build for testing
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production
```

#### Step 4: Distribute for Testing

1. **Internal Distribution**: Download `.ipa` file directly
2. **TestFlight**: Submit to App Store Connect for beta testing
3. **Ad-hoc Distribution**: Install on registered devices

### Method 3: Web Testing with iOS Simulation

```powershell
# Start web version
npm run web

# Production web build
npm run build:web:prod
```

Test in browser with:

1. Chrome DevTools > Toggle Device Toolbar
2. Select iPhone device
3. Test responsive behavior and touch interactions

---

## PART 3: COMPREHENSIVE TESTING WORKFLOW

### Daily Development Testing

```powershell
# 1. Pre-flight checks
npm run typecheck
npm run lint
npm test

# 2. Android testing
npm run android
# Manual testing of features

# 3. iOS testing (Expo Go)
expo start --tunnel
# Test on iOS device via Expo Go

# 4. Performance testing
npm run test:performance
npm run profile:memory
```

### Pre-Release Testing Checklist

- [ ] **Android Emulator**: All features working
- [ ] **Android Physical Device**: Tested on real device
- [ ] **iOS Expo Go**: Core functionality verified
- [ ] **iOS TestFlight**: Production build tested (if available)
- [ ] **Unit Tests**: All passing (`npm test`)
- [ ] **Integration Tests**: All passing (`npm run test:integration`)
- [ ] **E2E Tests**: Android tests passing
- [ ] **Performance Tests**: Memory/CPU within limits
- [ ] **Web Version**: Responsive design verified

### Build Testing

```powershell
# Android builds
eas build --platform android --profile development
eas build --platform android --profile production

# iOS builds
eas build --platform ios --profile development
eas build --platform ios --profile production

# Both platforms
npm run build:all
```

---

## PART 4: TROUBLESHOOTING

### Common Android Issues

```powershell
# Cache issues
npx expo start --clear
npx react-native start --reset-cache

# Build issues
cd android
./gradlew clean
cd ..

# ADB issues
adb kill-server
adb start-server
adb devices
```

### Common iOS Issues

```powershell
# Expo cache
expo r -c

# Check builds
eas build:list

# Network issues with tunnel
expo start --localhost
```

### General Issues

```powershell
# Dependency issues
rm -rf node_modules
npm install

# Update Expo
npx expo upgrade

# Check for conflicts
npm outdated
```

---

## PART 5: TESTING AUTOMATION

### Automated Test Scripts

Your project already includes these test commands:

```powershell
# Individual test types
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:components    # Component tests
npm run test:performance   # Performance tests

# Combined testing
npm run test:all          # All tests with coverage
npm run test:coverage     # Generate coverage report
```

### E2E Testing with Detox

```powershell
# Android E2E
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug

# Run specific test
npx detox test --configuration android.emu.debug e2e/firstTest.test.js
```

---

## Summary

1. **For Android**: Full development and testing capabilities on Windows
2. **For iOS**: Limited to Expo Go testing and cloud building
3. **Best Practice**: Use Android for primary development, iOS for final testing
4. **Production**: Use EAS cloud builds for both platforms

The testing setup is now complete with all necessary documentation and scripts in your `documents/` folder.
