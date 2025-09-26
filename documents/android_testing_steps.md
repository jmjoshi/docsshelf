# Android Testing Steps - UPDATED WITH FIXES

## QUICK START (Recommended Method)

### Method 1: Expo Go Development Testing (Easiest)

```powershell
# 1. Start development server
cd "c:\Users\Jayant\Documents\projects\docsshelf"
expo start

# 2. On your Android device:
# - Install "Expo Go" app from Google Play Store
# - Open Expo Go app
# - Scan the QR code displayed in your terminal
# - Your app will load instantly for testing
```

**✅ This method avoids all the build issues we encountered!**

### Method 2: EAS Cloud Build (For Production Testing)

```powershell
# 1. Install EAS CLI
npm install -g @expo/eas-cli

# 2. Login and build in cloud
eas login
eas build --platform android --profile development

# 3. Download the APK when ready and install on device
```

## Previous Build Issues Encountered

We encountered several dependency conflicts trying to build locally:

1. **React Native Reanimated version incompatibility**
2. **expo-camera compilation errors**
3. **react-native-gesture-handler compilation errors**
4. **androidx.fragment D8 dexing errors**
5. **Android SDK version mismatches**

## Local Build Fixes (If You Want to Try Again)

If you want to attempt local building again, here are the fixes we applied:

```powershell
# 1. Fix dependency versions
npm install react-native-reanimated@~3.3.0 --legacy-peer-deps
npm install expo-camera@~13.4.0 --legacy-peer-deps
npm install react-native-gesture-handler@~2.12.0 --legacy-peer-deps
npm install react-native-safe-area-context@~4.7.0 react-native-screens@~3.22.0 --legacy-peer-deps

# 2. Update Android SDK versions in android/build.gradle:
# Change compileSdkVersion from 33 to 34
# Change targetSdkVersion from 33 to 34

# 3. Clean and rebuild
Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue
npx expo prebuild --platform android --no-install
cd android
.\gradlew clean
cd ..
npm run android
```

## Testing Strategy

### For Development (Use This):

1. **Expo Go method** - Works immediately, no build issues
2. Test all app functionality through Expo Go
3. Iterate quickly with hot reload

### For Production Testing:

1. **EAS Build** - Professional cloud building
2. Generates actual APK files
3. Can be distributed for testing

## Testing Checklist

Once you have the app running (via Expo Go or EAS build):

- [ ] Navigation between screens
- [ ] Camera functionality for document scanning
- [ ] Document storage and retrieval
- [ ] OCR text recognition
- [ ] Authentication flows
- [ ] Offline functionality
- [ ] Performance testing

## Troubleshooting Common Issues

### If Expo Go doesn't connect:

```powershell
# Try with tunnel mode
expo start --tunnel
```

### If you get network errors:

```powershell
# Clear Expo cache
expo r -c
```

### For production testing:

```powershell
# Use EAS build instead of local build
eas build --platform android --profile development
```
