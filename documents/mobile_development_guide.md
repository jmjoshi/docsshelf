# Mobile App Development Guide for DocsShelf

## 3. **Clone Repository:** `git clone <your-repository-url>` (replace with your DocsShelf repo URL, or skip if already in workspace)verview

DocsShelf is a React Native mobile application built using the Expo framework (managed or bare workflow). This guide provides step-by-step instructions for setting up development environments, IDEs, simulators, and physical device testing for both Android and iOS platforms. The app focuses on document management, OCR, storage, and compliance features.

**Key Technologies:**

- React Native (v0.72+)
- Expo CLI for managed workflow or React Native CLI for bare workflow
- Node.js for JavaScript runtime
- Android Studio for Android development
- Xcode for iOS development

## Environment Setup

### Prerequisites

- **Operating System:** Windows (for Android), macOS (for iOS or cross-platform)
- **Node.js:** Version 18+ (download from [nodejs.org](https://nodejs.org/))
- **npm or Yarn:** Comes with Node.js; Yarn is recommended for faster installs
- **Git:** For version control
- **Expo CLI:** Install globally with `npm install -g @expo/cli`

### Android Development Setup

1. **Install Java Development Kit (JDK):**
   - Download JDK 11 or 17 from [Oracle](https://www.oracle.com/java/technologies/javase-downloads.html) or [Adoptium](https://adoptium.net/).
   - Set environment variables: `JAVA_HOME` to JDK path, add `%JAVA_HOME%\bin` to `PATH`.

2. **Install Android Studio:**
   - Download from [developer.android.com/studio](https://developer.android.com/studio).
   - Install with Android SDK, Android Virtual Device (AVD), and SDK Platform-Tools.
   - Open Android Studio > SDK Manager > Install SDK Platforms (API 33+), SDK Tools (Android SDK Build-Tools, Android Emulator).
   - Set `ANDROID_HOME` to `C:\Users\<username>\AppData\Local\Android\Sdk`, add `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools` to `PATH`.

3. **Verify Installation:**
   - Run `java -version` and `adb version` in terminal.

### iOS Development Setup

iOS development requires a Mac. If on Windows, use a Mac VM or cloud service.

1. **Install Xcode:**
   - Download from Mac App Store or [developer.apple.com](https://developer.apple.com/xcode/).
   - Install Xcode Command Line Tools: `xcode-select --install`.

2. **Set Up Apple Developer Account:**
   - Sign up at [developer.apple.com](https://developer.apple.com/) (free for basic development).
   - For physical testing, enroll in Apple Developer Program ($99/year) for device provisioning.

3. **Verify Installation:**
   - Run `xcodebuild -version` in terminal.

### Cross-Platform Setup

1. **Install Expo CLI:** `npm install -g @expo/cli`
2. **Clone Repository:** `git clone <your-repository-url>` (replace with your DocsShelf repo URL, or skip if already in workspace)
3. **Install Dependencies:** Navigate to project root, run `npm install` or `yarn install`.
4. **Start Metro Bundler:** `expo start` or `npx react-native start`.

## IDE Recommendations

### Recommended IDEs

- **Visual Studio Code (VS Code):** Free, cross-platform, excellent for React Native. Install extensions: React Native Tools, Expo Tools, Prettier, ESLint.
- **Android Studio:** Essential for Android-specific debugging and emulator management.
- **Xcode:** Required for iOS builds and simulator.

### VS Code Setup for React Native

1. Install VS Code from [code.visualstudio.com](https://code.visualstudio.com/).
2. Install extensions:
   - React Native Tools
   - Expo Tools
   - Prettier - Code formatter
   - ESLint
   - GitLens
3. Configure settings: Enable auto-save, set default formatter to Prettier.

## Simulator Setup

### Android Emulator

1. Open Android Studio > AVD Manager.
2. Create a new Virtual Device: Select a device (e.g., Pixel 4), API level 33+, and download system image.
3. Launch emulator from AVD Manager or run `emulator -avd <device_name>` in terminal.
4. In project, run `npx expo run:android` or `expo start` and select emulator.

### iOS Simulator

1. Open Xcode > Xcode > Open Developer Tool > Simulator.
2. Create a new simulator: Hardware > Device > iOS > Select model (e.g., iPhone 14), iOS version.
3. Launch simulator.
4. In project, run `npx expo run:ios` or `expo start` and select simulator.

## Physical Device Testing

### Android Phone

1. Enable Developer Options: Settings > About Phone > Tap Build Number 7 times.
2. Enable USB Debugging: Settings > Developer Options > USB Debugging.
3. Connect via USB, run `adb devices` to verify.
4. Run `npx expo run:android --device` or scan QR with Expo Go app.
5. Wireless: `adb tcpip 5555`, disconnect USB, `adb connect <ip>:5555`.

### iOS Phone

1. Connect iPhone to Mac via USB.
2. Trust computer on device.
3. In Xcode, select device in Devices and Simulators.
4. Run `npx expo run:ios --device` or scan QR with Expo Go.
5. Wireless: Enable in Xcode > Devices > Connect via Network.

## Development Workflow

1. **Code Changes:** Edit in VS Code, save to auto-reload.
2. **Testing:** Use simulators for quick tests, physical devices for real-world validation.
3. **Debugging:** Use React Native Debugger or Flipper. Shake device for Dev Menu.
4. **Building:** For release, use `expo build:android` or `expo build:ios`.
5. **Version Control:** Commit changes with Git, push to main branch.

## Troubleshooting

- **Build Errors:** Clear Metro cache with `expo start -c`.
- **Emulator Issues:** Restart ADB with `adb kill-server; adb start-server`.
- **iOS Provisioning:** Ensure device is added to Apple Developer account.
- **Permissions:** Grant camera/storage access on devices for app features.

## Recommendations

- Use Expo managed workflow for rapid prototyping; switch to bare for custom native modules.
- Test on multiple devices/screen sizes.
- Implement CI/CD with Fastlane for automated builds.
- Follow React Native best practices for performance and security.

For more details, refer to [Expo Docs](https://docs.expo.dev/) and [React Native Docs](https://reactnative.dev/docs/getting-started).</content>
<parameter name="filePath">c:\Users\Jayant\Documents\projects\docsshelf\documents\mobile_development_guide.md
