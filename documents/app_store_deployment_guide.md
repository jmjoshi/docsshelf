# App Store Deployment Guide for DocsShelf

## Overview

This guide provides comprehensive step-by-step instructions for building production-ready app packages and deploying DocsShelf to the Google Play Store (Android) and Apple App Store (iOS). The guide covers both local builds and Expo Application Services (EAS) cloud builds.

## Prerequisites

### Developer Accounts

1. **Google Play Console**:
   - Create a Google account
   - Enroll in Google Play Developer Program ($25 one-time fee)
   - Verify account and payment method

2. **Apple Developer Program**:
   - Create an Apple ID
   - Enroll in Apple Developer Program ($99/year)
   - Verify account and payment method

### Tools and Accounts

1. **Expo Account**:
   - Sign up for Expo at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **App Signing**:
   - For Android: Generate keystore or use Expo's managed signing
   - For iOS: Configure certificates and provisioning profiles

3. **App Information**:
   - App name, description, screenshots
   - Privacy policy URL
   - Support email/website
   - App icons and feature graphics

## Building Production App Packages

### Option 1: Using Expo Application Services (EAS) - Recommended

#### 1. Configure EAS Build

Create `eas.json` in project root:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 2. Configure App for Production

Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "name": "DocsShelf",
    "slug": "docsshelf",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.docshelf",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.docshelf",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### 3. Build Android Production AAB

```bash
# Build Android App Bundle (AAB) for Google Play
eas build --platform android --profile production

# Or specify profile
eas build --platform android --profile production
```

#### 4. Build iOS Production IPA

```bash
# Build iOS Archive (IPA) for App Store
eas build --platform ios --profile production
```

#### 5. Monitor Build Progress

```bash
# Check build status
eas build:list

# View build logs
eas build:view <build-id>
```

### Option 2: Local Builds (Advanced)

#### Android Local Build

1. **Generate Keystore** (if not using Expo managed signing):

   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore docshelf.keystore -alias docshelf -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Signing in app.json**:

   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.docshelf",
         "versionCode": 1
       }
     }
   }
   ```

3. **Build AAB**:

   ```bash
   expo build:android --type app-bundle --keystore-path ./docshelf.keystore --keystore-alias docshelf
   ```

4. **Alternative: Build APK**:
   ```bash
   expo build:android --type apk
   ```

#### iOS Local Build (Requires macOS)

1. **Install Dependencies**:

   ```bash
   npm install -g @expo/cli
   gem install bundler
   bundle install
   ```

2. **Configure Bundle Identifier**:
   Update `app.json` with unique bundle identifier

3. **Build Archive**:

   ```bash
   expo build:ios --type archive
   ```

4. **Export IPA** (if needed):
   Use Xcode to export the archive as IPA

## Preparing Store Assets

### App Screenshots

#### Android Screenshots (Google Play)

- **Phone**: 1080 x 1920 (9:16 aspect ratio)
- **Tablet**: 1200 x 1920 (10:16 aspect ratio)
- **Large Tablet**: 1600 x 2560 (10:16 aspect ratio)
- Required: At least 2 screenshots
- Recommended: 8 screenshots showing key features

#### iOS Screenshots (App Store)

- **iPhone 6.5"**: 1242 x 2688
- **iPhone 5.5"**: 1242 x 2208
- **iPad Pro**: 2048 x 2732
- Required: At least 1 screenshot per device type
- Recommended: 4-5 screenshots per device type

### App Icons and Graphics

#### Android

- **Icon**: 512 x 512 PNG (with transparency)
- **Feature Graphic**: 1024 x 500 PNG
- **Promo Graphic**: 180 x 120 PNG (optional)

#### iOS

- **Icon**: 1024 x 1024 PNG
- **App Store Icon**: 1024 x 1024 PNG

### App Store Metadata

#### Common Information

- **App Name**: DocsShelf (max 30 characters)
- **Short Description**: 80 characters max
- **Full Description**: 4000 characters max
- **Category**: Productivity or Business
- **Content Rating**: Everyone or appropriate rating
- **Keywords**: document, management, secure, offline, encryption
- **Support URL**: https://yourwebsite.com/support
- **Privacy Policy URL**: https://yourwebsite.com/privacy

#### Android Specific

- **Contact Email**: developer@yourcompany.com
- **Website**: https://yourwebsite.com
- **Phone**: Optional

#### iOS Specific

- **Copyright**: © 2025 Your Company Name
- **App Review Information**: Test account credentials
- **Version Release Notes**: What's new in this version

## Deploying to Google Play Store

### Step 1: Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Click "Create app"
3. Fill in app details:
   - App name: DocsShelf
   - Default language: English
   - App type: App
   - Free or Paid: Free
4. Accept declarations and click "Create"

### Step 2: Set Up App Store Listing

1. **Store Listing**:
   - **Title**: DocsShelf
   - **Short description**: Secure document management with end-to-end encryption
   - **Full description**: Detailed description of app features
   - Upload screenshots (phone, tablet, etc.)
   - Upload feature graphic
   - Select category: Productivity

2. **Content Rating**:
   - Go to "Content rating"
   - Answer questionnaire
   - Select appropriate rating

3. **Pricing & Distribution**:
   - Set price (Free)
   - Select countries for distribution
   - Set content guidelines
   - Configure contact details

### Step 3: Upload App Bundle

1. Go to "Production" > "Create new release"
2. Upload the AAB file from EAS build
3. Fill release notes
4. Set release track:
   - **Internal testing**: For beta testing
   - **Closed testing**: For alpha/beta groups
   - **Open testing**: For open beta
   - **Production**: For public release

### Step 4: Configure Signing

1. Go to "App signing" in Play Console
2. Choose between:
   - **Google-managed signing**: Recommended
   - **Upload your own key**: If using custom keystore

### Step 5: Review and Publish

1. Review all information
2. Click "Start rollout to production"
3. Confirm publication
4. Wait for review (usually 1-3 days)

## Deploying to Apple App Store

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click "My Apps" > "+" > "New App"
3. Fill in app details:
   - Platforms: iOS
   - Name: DocsShelf
   - Primary Language: English
   - Bundle ID: com.yourcompany.docshelf
   - SKU: DOCS001
   - User Access: Limited to specific users (optional)

### Step 2: Configure App Information

1. **App Information**:
   - **Name**: DocsShelf
   - **Subtitle**: Secure Document Management
   - **Bundle ID**: com.yourcompany.docshelf
   - **Primary Category**: Productivity
   - **Secondary Category**: Business
   - **Content Rights**: Full rights

2. **Pricing and Availability**:
   - Price: Free
   - Availability: Worldwide
   - Education Store: No

### Step 3: Prepare for Submission

1. **Prepare Screenshots**:
   - Upload screenshots for each device type
   - Use Media Manager for organization

2. **App Review Information**:
   - **Login Credentials**: Provide test account
   - **Contact Information**: Developer contact details
   - **Notes**: Special instructions for reviewers

3. **Version Information**:
   - **Version**: 1.0.0
   - **Copyright**: © 2025 Your Company Name
   - **Description**: Full app description
   - **Keywords**: document, management, secure, offline
   - **Support URL**: https://yourwebsite.com/support
   - **Marketing URL**: https://yourwebsite.com

### Step 4: Upload Build

1. **Using EAS Submit**:

   ```bash
   # Submit to TestFlight first
   eas submit --platform ios --profile production

   # Or submit directly to App Store
   eas submit --platform ios --profile production
   ```

2. **Manual Upload**:
   - Download IPA from EAS build
   - Use Transporter app or Xcode to upload
   - Wait for processing

### Step 5: TestFlight (Optional but Recommended)

1. Create TestFlight build:

   ```bash
   eas build --platform ios --profile preview
   eas submit --platform ios --profile preview
   ```

2. Invite beta testers
3. Collect feedback
4. Fix issues before production release

### Step 6: Submit for Review

1. Go to "My Apps" > DocsShelf > Version
2. Click "Add for Review"
3. Confirm build selection
4. Review all information
5. Submit

### Step 7: Review Process

1. **Review Timeline**: 24 hours to 1 week
2. **Common Issues**:
   - Missing privacy policy
   - Incomplete screenshots
   - App crashes or bugs
   - Guideline violations

3. **Respond to Rejections**:
   - Fix issues
   - Resubmit with explanations
   - Contact Apple if needed

## Post-Deployment Tasks

### Monitoring and Updates

1. **Google Play Console**:
   - Monitor crashes and ANRs
   - View user reviews and ratings
   - Track downloads and revenue
   - Plan updates

2. **App Store Connect**:
   - Monitor app analytics
   - Respond to user reviews
   - Track sales and downloads
   - Prepare version updates

### Version Updates

#### Android Updates

1. Increment version code in `app.json`
2. Build new AAB
3. Upload to Play Console
4. Roll out update (staged or immediate)

#### iOS Updates

1. Increment build number in `app.json`
2. Build new IPA
3. Upload to App Store Connect
4. Submit for review

### Marketing and Promotion

1. **App Store Optimization (ASO)**:
   - Optimize title and description
   - Use relevant keywords
   - Encourage positive reviews

2. **Social Media Promotion**:
   - Create social media accounts
   - Share app features
   - Run targeted ads

3. **Website and Blog**:
   - Create app landing page
   - Write blog posts about features
   - Collect email subscribers

## Troubleshooting

### Common Build Issues

#### EAS Build Failures

- Check build logs: `eas build:view <build-id>`
- Verify app.json configuration
- Ensure all dependencies are compatible
- Check for native code conflicts

#### Store Submission Issues

**Android**:

- AAB size limits
- Missing 64-bit support
- Privacy policy requirements
- Target API level compliance

**iOS**:

- Bundle ID conflicts
- Missing app icons
- Privacy manifest requirements
- Guideline violations

### Support Resources

- **Expo Documentation**: https://docs.expo.dev/
- **EAS Documentation**: https://docs.expo.dev/eas/
- **Google Play Help**: https://support.google.com/googleplay/
- **Apple Developer Support**: https://developer.apple.com/support/

## Best Practices

1. **Test Thoroughly**: Use TestFlight and internal testing tracks
2. **Prepare Assets Early**: Screenshots and descriptions take time
3. **Plan Release Schedule**: Account for review times
4. **Monitor Performance**: Track crashes and user feedback
5. **Regular Updates**: Keep app updated with new features and fixes
6. **Compliance**: Stay updated with store policies and guidelines

## Timeline

- **Preparation**: 1-2 weeks
- **Build and Test**: 1 week
- **Store Setup**: 1-2 days
- **Review Process**: 1-7 days
- **Total Time**: 3-4 weeks for first release

Remember to backup all assets, keys, and account information. Consider using a team account for collaboration.</content>
<parameter name="filePath">c:\Users\Jayant\Documents\projects\docsshelf\documents\app_store_deployment_guide.md
