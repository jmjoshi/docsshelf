#
## React Native/Expo Emulator Troubleshooting

### 1. Forward Metro port to Android emulator
```
adb reverse tcp:8081 tcp:8081
```

### 2. Start Metro in tunnel mode (if connection issues persist)
```
npx expo start --dev-client --tunnel
```

### 3. Start Metro normally (shows JS logs)
```
npx expo start
```

### 4. Launch app on Android emulator from Metro terminal
Press:
```
a
```

### 5. Check for debug logs in Metro terminal
Look for your `console.log` output here to debug JS initialization issues.

### 6. (Optional) View native logs
```
adb logcat
```

### 7. (Optional) Filter for JS/React errors in logcat
```
adb logcat *:E | findstr -i "react|js"
```
#
## View Emulator Logs and Errors

### Show All Logs from Emulator
```
adb logcat
```

### Show Only Errors from Emulator
```
adb logcat *:E
```
#
## Android App Uninstall/Package Troubleshooting

If you get an error when uninstalling the app, use these commands to find and remove the correct package:

### 1. Find Installed Package Name
```
adb shell pm list packages | findstr docsshelf
```

### 2. Uninstall Using Correct Package Name
Replace `<full.package.name>` with the result from the previous command (e.g., `com.pixel5.docsshelf`):
```
adb uninstall <full.package.name>
```

Example:
```
adb uninstall com.pixel5.docsshelf
```
#
## Expo/Metro Troubleshooting for Emulator Issues

If your app is not loading in the Android emulator, try these commands:

### 1. Start Metro with Tunnel (for emulator connection issues)
```
npx expo start --dev-client --tunnel
```

### 2. Clear Metro Bundler Cache
```
npx expo start -c
```

### 3. Uninstall App from Emulator
```
adb uninstall com.docsshelf
```

### 4. Open App on Android Emulator
In the Expo CLI terminal, press:
```
a
```
or run:
```
npx expo run:android
```

### 5. Check Emulator Logs
```
adb logcat
```

### Notes
- For Android emulators, use `10.0.2.2` instead of `127.0.0.1` to access your host machine.
- Make sure your firewall is not blocking connections.
# Useful Commands for Building, Running, Testing, and Debugging (Web, Android, iOS)

## Windows Environment Setup

### Enable Long Paths (Critical for React Native builds)
```powershell
# Run PowerShell as Administrator
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1

# Restart computer after running this command
# This fixes ninja build errors with "Filename longer than 260 characters"
```

## General

### Install Dependencies
```bash
npm install
```
*Install all project dependencies defined in package.json.*

### Handle Dependency Conflicts
```bash
# Force install when peer dependencies conflict
npm install package-name --force

# Use legacy peer deps resolution
npm install package-name --legacy-peer-deps

# Check for dependency conflicts
npm ls
```

## React Native Specific Dependencies

### Crypto Support (Required for Encryption)
```bash
# Install secure random values for React Native
npm install react-native-get-random-values

# Install with peer dependency conflicts
npm install react-native-get-random-values --legacy-peer-deps

# Import at top of your crypto/encryption files:
# import 'react-native-get-random-values';
```

---

## Web

### Start Web App (Expo/React Native Web)
```
npx expo start --web
```
*Start the Expo/React Native app in a web browser.*

### Build Web App (Expo)
```
npx expo export:web
```
*Build a static production version of your Expo web app.*

---

## Android

### Forward Metro Port to Emulator (Critical!)
```bash
adb reverse tcp:8081 tcp:8081
```
*Forward Metro port to emulator - required for localhost access. Run this after starting emulator.*

### Start Metro Bundler (required for all platforms)
```bash
npx expo start
```
*Start the Metro bundler for React Native/Expo projects.*

### Run on Android Emulator/Device
```bash
npm run android
# or
npx expo run:android
```
*Build and launch the app on an Android emulator or connected device.*

### Clean Build (Expo)
```bash
npx expo start -c
```
*Clear Metro cache and start fresh. Useful for resolving build issues.*

### List Connected Devices
```bash
adb devices
```
*Show all connected Android devices and emulators.*

### Check Package Installation
```bash
# Find installed packages
adb shell pm list packages | findstr your-app-name

# Uninstall app from emulator
adb uninstall com.yourpackagename
```

### View Android Logs
```bash
# Show all logs from Android emulator
adb logcat

# Show only error logs
adb logcat *:E

# Show only errors related to React Native/JS
adb logcat *:E | findstr -i "react|js|expo"

# Show recent logs (last 200 lines)
adb logcat -d -t 200

# Save logs to file
adb logcat > logcat.txt

# Real-time error monitoring
adb logcat *:E | findstr -i "fatal|exception|error"
```

---

## iOS

### Run on iOS Simulator (macOS only)
```
npm run ios
```
*Build and launch the app on an iOS simulator.*

### Install CocoaPods (iOS native dependencies)
```
cd ios
pod install
cd ..
```
*Install iOS native dependencies (required for some packages, not needed for Expo managed workflow).*

---

## Testing

### Run All Tests (Jest)
```
npm test
```
*Run all unit and integration tests using Jest.*

### Run Tests with Coverage
```
npm test -- --coverage
```
*Run tests and generate a code coverage report.*

---

## Linting & Formatting

### Format Code (Prettier)
```
npx prettier --write .
```
*Format all code files in the project.*

### Lint Code (ESLint)
```
npx eslint . --fix
```
*Lint and auto-fix code style and quality issues.*

## Troubleshooting Workflow

### When App Won't Load on Android Emulator

**Step 1: Verify Basic Connection**
```bash
# Check if emulator is detected
adb devices

# Forward Metro port to emulator
adb reverse tcp:8081 tcp:8081

# Check if Metro server is accessible from emulator
adb shell curl http://localhost:8081/status
```

**Step 2: Clean Start Metro**
```bash
# Stop any running Metro processes (Ctrl+C)
# Clear cache and restart
npx expo start -c

# Or start in LAN mode
npx expo start --dev-client
```

**Step 3: Check App Installation**
```bash
# List installed packages
adb shell pm list packages | findstr your-app-name

# Uninstall if found
adb uninstall com.yourpackagename

# Rebuild and install fresh
npx expo run:android
```

**Step 4: Debug JavaScript Issues**
```bash
# Add debug logs to your App.tsx:
console.log("App starting...");

# Check Metro terminal for logs
# If no logs appear, JS bundle isn't loading
```

**Step 5: Test with Minimal App**
```bash
# Create new test project
npx create-expo-app test-minimal
cd test-minimal
npx expo run:android

# If this works, issue is with your main project
# If this fails, issue is with environment setup
```

## Common Error Patterns & Solutions

### Path Length Issues (Windows)
```
Error: ninja: error: Stat(...): Filename longer than 260 characters
Solution: Enable long paths in Windows registry (see Windows section above)
```

### Metro Connection Issues
```
Error: Metro waiting but no logs appear
Solution: adb reverse tcp:8081 tcp:8081
```

### App Not Responding (ANR)
```
Error: "App isn't responding" dialog
Solution: Check for infinite loops or blocking operations in initialization code
```

### Development Build Not Found
```
Error: No development build for this project is installed
Solution: npx expo run:android (rebuilds and installs dev client)
```

### Crypto/Random Values Error
```
Error: Native crypto module could not be used to get secure random number
Solution: 
npm install react-native-get-random-values
// Add to top of entry file:
import 'react-native-get-random-values';
```

---

## Debugging

### View Device Logs (Android)
```
adb logcat
```
*Show real-time logs from an Android device or emulator.*

### View Device Logs (iOS)
```
npx react-native log-ios
```
*Show logs from the iOS simulator (React Native CLI only).*