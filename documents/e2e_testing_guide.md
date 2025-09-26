# End-to-End Testing Guide for DocsShelf Mobile App

## Overview

This guide provides comprehensive step-by-step instructions for end-to-end (E2E) testing of the DocsShelf mobile application. It covers testing on both Android and iOS platforms, using simulators and physical devices. The guide includes setup, test execution, and deployment procedures.

DocsShelf uses React Native with Expo and Detox for E2E testing. Detox allows for fast, reliable testing by running tests directly on the native mobile runtime.

## Prerequisites

Before starting E2E testing, ensure the following are installed:

### System Requirements

- Node.js (v18+)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For Android:
  - Android Studio (with Android SDK)
  - Java Development Kit (JDK 11+)
- For iOS:
  - macOS with Xcode (13+)
  - iOS Simulator
- Detox CLI (`npm install -g detox-cli`)
  ##Jayant## - Validated
  =============

### Project Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone <repository-url>
   cd docsshelf
   npm install
   ```

2. Ensure Detox is installed:
   ```bash
   npm install detox --save-dev
   ```
   # ##Jayant## - Validated

## Setting Up Detox for E2E Testing

### 1. Configure Detox

Create a `.detoxrc.js` file in the project root:

```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Debug-iphonesimulator/DocsShelf.app',
      build:
        'xcodebuild -workspace ios/DocsShelf.xcworkspace -scheme DocsShelf -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/DocsShelf.app',
      build:
        'xcodebuild -workspace ios/DocsShelf.xcworkspace -scheme DocsShelf -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_5_API_33',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*',
      },
    },
    ipad: {
      type: 'ios.simulator',
      device: {
        type: 'iPad Pro (12.9-inch) (6th generation)',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
    'android.attached.debug': {
      device: 'attached',
      app: 'android.debug',
    },
    'android.attached.release': {
      device: 'attached',
      app: 'android.release',
    },
  },
};
```

# ##Jayant## - Validated

### 2. Create Jest Configuration for E2E

Create `e2e/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/init.js'],
  reporters: ['detox/runners/jest/reporter'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testTimeout: 120000,
  resetModules: true,
  maxWorkers: 1,
};
```

# ##Jayant## - Validated

### 3. Create Detox Initialization File

Create `e2e/init.js`:

```javascript
const detox = require('detox');
const config = require('../.detoxrc.js');

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});
```

# ##Jayant## - Validated

### 4. Sample E2E Test

Create `e2e/firstTest.test.js`:

```javascript
describe('DocsShelf E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.id('welcome-text'))).toBeVisible();
  });

  it('should navigate to login screen', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should perform login', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should upload a document', async () => {
    await element(by.id('upload-button')).tap();
    await element(by.id('camera-option')).tap();
    // Note: Actual camera interaction may require additional setup
    await expect(element(by.id('document-list'))).toBeVisible();
  });
});
```

# ##Jayant## - Validated

## Testing on Simulators

### Android Emulator

#### 1. Set Up Android Emulator

1. Open Android Studio
2. Go to AVD Manager (Tools > Device Manager)
3. Create a new virtual device (e.g., Pixel 5 with API 33)
4. Start the emulator

#### 2. Build and Run Tests

```bash
# Build the app for Android
npx detox build --configuration android.emu.debug

# Run E2E tests
npx detox test --configuration android.emu.debug
```

#### 3. Alternative: Using Expo

```bash
# Start Expo development server
npm start

# In another terminal, run the app on emulator
expo run:android --device emulator-5554

# Run Detox tests (requires proper setup)
npx detox test --configuration android.emu.debug
```

### iOS Simulator

#### 1. Set Up iOS Simulator

1. Open Xcode
2. Go to Xcode > Open Developer Tool > Simulator
3. Create a new simulator (e.g., iPhone 14 with iOS 16.4)
4. Start the simulator

#### 2. Build and Run Tests

```bash
# Build the app for iOS
npx detox build --configuration ios.sim.debug

# Run E2E tests
npx detox test --configuration ios.sim.debug
```

#### 3. Alternative: Using Expo

```bash
# Start Expo development server
npm start

# In another terminal, run the app on simulator
expo run:ios --device "iPhone 14"

# Run Detox tests
npx detox test --configuration ios.sim.debug
```

## Testing on Physical Devices

### Android Physical Device

#### 1. Enable Developer Options

1. Go to Settings > About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go to Settings > Developer Options
4. Enable "USB Debugging"
5. Enable "Install via USB"

#### 2. Connect Device

1. Connect your Android device to your computer via USB
2. Accept the USB debugging authorization on your device
3. Verify connection:
   ```bash
   adb devices
   ```

#### 3. Build APK for Testing

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Or using Expo
expo build:android --type apk
```

#### 4. Install and Run Tests

```bash
# Install APK on device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Build Detox test APK
./gradlew assembleAndroidTest -DtestBuildType=debug

# Run E2E tests on device
npx detox test --configuration android.attached.debug
```

#### 5. Alternative: Using Expo Dev Client

```bash
# Install Expo Dev Client on device
npx expo install --fix

# Start development server
npm start

# Build development client
expo run:android --device

# Run tests
npx detox test --configuration android.attached.debug
```

### iOS Physical Device

#### 1. Set Up Device for Development

1. Connect your iPhone/iPad to your Mac via USB
2. Open Xcode
3. Go to Window > Devices and Simulators
4. Select your device and ensure it's recognized
5. Trust the computer on your device if prompted

#### 2. Configure Code Signing

1. In Xcode, open `ios/DocsShelf.xcworkspace`
2. Select the project in the navigator
3. Go to Signing & Capabilities
4. Select your development team
5. Ensure a valid provisioning profile is selected

#### 3. Build IPA for Testing

```bash
# Build for device
xcodebuild -workspace ios/DocsShelf.xcworkspace -scheme DocsShelf -configuration Debug -destination generic/platform=iOS -archivePath ios/build/DocsShelf.xcarchive archive

# Export IPA
xcodebuild -exportArchive -archivePath ios/build/DocsShelf.xcarchive -exportOptionsPlist ios/exportOptions.plist -exportPath ios/build

# Or using Expo
expo build:ios --type archive
```

#### 4. Install and Run Tests

```bash
# Install on device using Xcode
# Open ios/build/DocsShelf.xcarchive in Xcode
# Click "Distribute App" > "Development" > Select device > Install

# For Detox testing, ensure device is connected
npx detox test --configuration ios.device.debug
```

#### 5. Alternative: Using Expo Dev Client

```bash
# Install Expo Dev Client on device
npx expo install --fix

# Start development server
npm start

# Build and run on device
expo run:ios --device

# Run tests
npx detox test --configuration ios.device.debug
```

## Packaging the App for Distribution

### Android APK/AAB

#### 1. Build Release APK

```bash
# Using Gradle
cd android
./gradlew assembleRelease

# Using Expo
expo build:android --type apk
```

#### 2. Build AAB (for Google Play)

```bash
# Using Expo
expo build:android --type app-bundle
```

#### 3. Sign the APK (if not using Expo)

1. Generate keystore:

   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Configure signing in `android/app/build.gradle`

### iOS IPA

#### 1. Build Release Archive

```bash
# Using Xcode
xcodebuild -workspace ios/DocsShelf.xcworkspace -scheme DocsShelf -configuration Release -destination generic/platform=iOS -archivePath ios/build/DocsShelf.xcarchive archive

# Using Expo
expo build:ios --type archive
```

#### 2. Export IPA

1. Open `ios/build/DocsShelf.xcarchive` in Xcode
2. Click "Distribute App"
3. Select "App Store Connect" or "Ad Hoc"
4. Follow the prompts to generate the IPA

## Running Comprehensive Test Suite

### Automated Test Script

Create `scripts/run-e2e-tests.js`:

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');

const configurations = [
  'ios.sim.debug',
  'ios.sim.release',
  'android.emu.debug',
  'android.emu.release',
];

console.log('🚀 Running E2E Tests on All Configurations');

configurations.forEach((config) => {
  try {
    console.log(`\n📱 Testing ${config}`);
    execSync(`npx detox build --configuration ${config}`, { stdio: 'inherit' });
    execSync(`npx detox test --configuration ${config}`, { stdio: 'inherit' });
    console.log(`✅ ${config} tests passed`);
  } catch (error) {
    console.error(`❌ ${config} tests failed:`, error.message);
    process.exit(1);
  }
});

console.log('\n🎉 All E2E tests completed successfully!');
```

### Running All Tests

```bash
node scripts/run-e2e-tests.js
```

## Troubleshooting

### Common Issues

#### Android

- **Emulator not found**: Ensure AVD is created and running
- **ADB not found**: Add Android SDK platform-tools to PATH
- **Device not recognized**: Enable USB debugging and authorize computer

#### iOS

- **Simulator not available**: Install Xcode and create simulator
- **Code signing issues**: Ensure valid provisioning profile and certificate
- **Device not trusted**: Trust computer on iOS device

#### Detox

- **Build failures**: Clean build artifacts and rebuild
- **Test timeouts**: Increase timeout in Jest config
- **Element not found**: Verify test IDs match app components

### Performance Optimization

- Run tests in parallel where possible
- Use `device.disableSynchronization()` for faster tests
- Cache build artifacts between runs

## Best Practices

1. **Test Coverage**: Aim for 95% E2E coverage of critical user flows
2. **Test Data**: Use consistent test data across all environments
3. **CI/CD Integration**: Integrate E2E tests in your CI pipeline
4. **Regular Execution**: Run E2E tests before each release
5. **Device Diversity**: Test on various device models and OS versions

## Next Steps

- Implement more comprehensive test scenarios
- Set up CI/CD pipeline for automated E2E testing
- Add visual regression testing
- Monitor test performance and reliability

For more information, refer to the [Detox documentation](https://wix.github.io/Detox/) and [Expo documentation](https://docs.expo.dev/).</content>
<parameter name="filePath">c:\Users\Jayant\Documents\projects\docsshelf\documents\e2e_testing_guide.md
