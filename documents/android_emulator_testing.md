# Android Emulator Testing Guide for DocsShelf

## Prerequisites ✅
- Android Studio installed
- Android SDK configured (ANDROID_HOME set)
- Android Virtual Device (AVD) available: **Pixel_9a**

## Quick Start - Test on Android Emulator

### Step 1: Start Android Emulator
```powershell
# Navigate to your project
cd "c:\Users\Jayant\Documents\projects\docsshelf"

# Start your Pixel_9a emulator
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a
```

### Step 2: Wait for Emulator to Boot
- Wait for the Android emulator to fully load (2-3 minutes first time)
- You should see the Android home screen
- The emulator will appear in a separate window

### Step 3: Start Expo Development Server
```powershell
# In a new terminal, start the development server
npx @expo/cli start
```

### Step 4: Install Expo Go on Emulator
1. In the emulator, open **Google Play Store**
2. Search for **"Expo Go"**
3. Install the Expo Go app
4. Open Expo Go when installation completes

### Step 5: Connect to Your App
1. In your terminal where Expo is running, press **'s'** to switch to Expo Go mode
2. In the Expo Go app on emulator, tap **"Scan QR code"**
3. Use the emulator's camera to scan the QR code from your terminal
4. Your DocsShelf app will load automatically!

## Alternative Method - Direct Android Launch

If you prefer to launch directly to emulator without Expo Go:

```powershell
# Make sure emulator is running first
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a

# In another terminal, check emulator is detected
npx @expo/cli start

# Then press 'a' to launch on Android emulator
# Note: This requires a development build
```

## Emulator Management Commands

### List Available Emulators
```powershell
& "$env:ANDROID_HOME\emulator\emulator.exe" -list-avds
```

### Start Specific Emulator
```powershell
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a
```

### Start Emulator with Specific Options
```powershell
# Start with more RAM and storage
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a -memory 4096 -partition-size 2048
```

### Check Running Emulators
```powershell
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices
```

## Testing Your App Features

Once your app loads in the emulator, test these key features:

### 📱 Basic Navigation
- [ ] App launches successfully
- [ ] Navigation between screens works
- [ ] Bottom tabs/drawer navigation functions

### 📷 Camera Features (Emulated)
- [ ] Camera screen opens
- [ ] Document scanning interface loads
- [ ] Emulator simulates camera capture
- [ ] Image processing works

### 💾 Storage Features
- [ ] Documents save successfully
- [ ] Document list displays
- [ ] Document retrieval works
- [ ] Local storage functions

### 🔍 OCR and Text Recognition
- [ ] Text recognition processes
- [ ] Search functionality works
- [ ] Text extraction displays

### 🔒 Authentication
- [ ] Login/signup flows
- [ ] Session persistence
- [ ] Logout functionality

## Troubleshooting Emulator Issues

### Emulator Won't Start
```powershell
# Check if virtualization is enabled
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a -verbose

# Try with different graphics
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a -gpu swiftshader_indirect
```

### Emulator is Slow
```powershell
# Start with more resources
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a -memory 4096 -cores 4
```

### Can't Connect to Development Server
```powershell
# Check if emulator can reach your machine
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell ping 10.0.2.2

# If connection issues, try tunnel mode
npx @expo/cli start --tunnel
```

### App Won't Load in Expo Go
1. Make sure emulator has internet connection
2. Try restarting Expo development server
3. Clear Expo Go cache in emulator
4. Use tunnel mode: `npx @expo/cli start --tunnel`

## Performance Tips

### Optimize Emulator Performance
- Close unnecessary apps on your Windows machine
- Allocate sufficient RAM to emulator (4GB recommended)
- Use SSD storage for AVD if possible
- Enable hardware acceleration in Android Studio

### Speed Up Development
- Keep emulator running during development
- Use hot reload for quick iterations
- Test on emulator first, then real device for final validation

## Creating Additional Emulators

If you want to test on different Android versions:

1. Open Android Studio
2. Go to **Tools > AVD Manager**
3. Click **Create Virtual Device**
4. Choose device type (Pixel, Samsung, etc.)
5. Select Android API level (29, 30, 31, 32, 33, 34)
6. Configure RAM and storage
7. Click **Finish**

Recommended test configurations:
- **API 29** (Android 10) - Minimum support
- **API 33** (Android 13) - Current target
- **API 34** (Android 14) - Latest

## Next Steps

After testing on emulator:
1. ✅ Verify all features work correctly
2. ✅ Test performance and responsiveness
3. ✅ Check for any emulator-specific issues
4. 🔄 Test on physical device for final validation
5. 🚀 Build production APK with EAS Build

## Quick Commands Reference

```powershell
# Start emulator
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a

# Start development server
npx @expo/cli start

# Check connected devices
& "$env:ANDROID_HOME\platform-tools\adb.exe" devices

# Install APK to emulator (if needed)
& "$env:ANDROID_HOME\platform-tools\adb.exe" install path\to\your\app.apk
```
