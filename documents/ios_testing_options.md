# iOS Testing Options from Windows

## Option 1: EAS Build (Cloud Building) - RECOMMENDED

### Prerequisites

```powershell
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

### Steps

```powershell
# Navigate to project directory
cd "c:\Users\Jayant\Documents\projects\docsshelf"

# Configure EAS (if not already done)
eas build:configure

# Build for iOS in the cloud
npm run build:ios

# Or directly
eas build --platform ios --profile preview
```

### Testing the Build

1. Download the `.ipa` file from EAS dashboard
2. Use TestFlight for distribution to test devices
3. Install on physical iOS devices via TestFlight

## Option 2: Expo Go App Testing

### Steps

```powershell
# Start development server
npm start

# Or start with tunnel for external access
expo start --tunnel
```

### Testing Process

1. Install **Expo Go** app on iOS device from App Store
2. Scan QR code from Expo CLI
3. App will load in Expo Go for testing
4. **Note**: Limited to Expo SDK features only

## Option 3: iOS Simulator via Cloud macOS

### If using cloud macOS service:

1. Connect to cloud macOS instance
2. Install Xcode and iOS Simulator
3. Run the same commands as local macOS:

```bash
# On cloud macOS
npm install
npm run ios

# Or
expo run:ios
```

## Option 4: Web Testing (Limited iOS Testing)

```powershell
# Test web version that simulates mobile behavior
npm run web

# Or with production build
npm run web:prod
```

### Testing in Browser

1. Open Chrome/Edge DevTools
2. Toggle device toolbar (mobile view)
3. Select iPhone device simulation
4. Test responsive behavior

## Unit Testing (Platform Independent)

```powershell
# These work on Windows for iOS-specific code
npm run test:unit
npm run test:integration
npm run test:components

# Test with iOS-specific mocks
npm test -- --testNamePattern="iOS"
```

## Limitations of Windows-based iOS Testing

### What you CAN'T do on Windows:

- Run iOS Simulator natively
- Build iOS apps locally without cloud services
- Debug iOS apps directly
- Use iOS-specific development tools

### What you CAN do on Windows:

- Build iOS apps using EAS (cloud)
- Test React Native logic with unit tests
- Test in Expo Go app
- Test web version with mobile simulation
- Use cloud macOS services
