# 🧪 DocsShelf Authentication Feature Testing Guide

## Overview
This guide will walk you through testing the **Phase 1 Priority 1 feature**: User Registration & Profile Management.

## ✅ Prerequisites
- Expo development server is running (`npx expo start`)
- iOS Simulator, Android Emulator, or Expo Go app on physical device

## 📱 Testing Steps

### 1. **Launch the App**

**Option A - iOS Simulator:**
```bash
# In the Expo terminal, press 'i'
# Or visit: http://localhost:8081 and click "Open iOS Simulator"
```

**Option B - Android Emulator:**
```bash
# In the Expo terminal, press 'a'  
# Or visit: http://localhost:8081 and click "Open Android Emulator"
```

**Option C - Physical Device:**
```bash
# Install Expo Go app from App Store/Google Play
# Scan the QR code shown in terminal or browser
```

### 2. **Test User Registration Flow**

#### 2.1 Navigate to Registration Screen
- Look for "Register" or "Sign Up" button on initial screen
- Tap to navigate to registration form

#### 2.2 Test Form Validation (Expected Failures)
Try these invalid inputs to verify validation works:

**Empty Fields:**
- Leave fields empty and tap "Register"
- ✅ **Expected**: Error messages for required fields

**Invalid Email:**
- Enter: `invalid-email`
- ✅ **Expected**: "Please enter a valid email address"

**Weak Password:**
- Enter: `123`
- ✅ **Expected**: Password strength requirements shown

**Invalid Phone Number:**
- Enter: `abc123`
- ✅ **Expected**: "Please enter a valid phone number"

#### 2.3 Test Successful Registration
Fill in valid data:

```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Password: SecurePass123!
Confirm Password: SecurePass123!
Phone Number: +1-555-0123
```

- Tap "Register"
- ✅ **Expected**: Success message and navigation to email verification screen

### 3. **Test Profile Management**

After successful registration:

#### 3.1 Access Profile Screen
- Navigate to Profile/Settings screen
- ✅ **Expected**: User information displayed

#### 3.2 Test Profile Editing
- Tap "Edit Profile" button
- Modify first name to "Jane"
- Change last name to "Smith"
- Tap "Save"
- ✅ **Expected**: Changes saved and reflected in UI

#### 3.3 Test Phone Number Management
- In profile screen, find phone numbers section
- Tap "Add Phone Number"
- Enter: `+1-555-9876`
- Select type: "Home"
- Tap "Save"
- ✅ **Expected**: New phone number added to list

**Remove Phone Number:**
- Tap delete/remove button on a phone number
- Confirm deletion
- ✅ **Expected**: Phone number removed (minimum 1 required)

### 4. **Test Profile Completeness**

- Check profile completeness indicator
- ✅ **Expected**: Percentage increases as more fields are filled

Required for 100% completion:
- ✅ First Name
- ✅ Last Name  
- ✅ Email
- ✅ At least 1 phone number
- ✅ Password set

### 5. **Test Navigation Flow**

Test navigation between screens:
- Registration → Email Verification → Profile
- Profile → Edit Profile → Profile
- Any "Back" button functionality
- ✅ **Expected**: Smooth navigation without crashes

### 6. **Test Data Persistence**

#### 6.1 Test App Reload
- Close the app completely
- Reopen the app
- Navigate to profile
- ✅ **Expected**: User data persisted and displayed

#### 6.2 Test State Management
- Make profile changes
- Navigate away and back
- ✅ **Expected**: Changes maintained in Redux state

## 🔧 Troubleshooting

### If App Won't Start:
1. **Check Metro bundler**: Ensure no errors in terminal
2. **Clear cache**: Run `npx expo start -c`
3. **Restart**: Kill terminal and run `npx expo start` again

### If TypeScript Errors Block Development:
1. **Temporary fix**: Add to `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true
     }
   }
   ```

### If Registration Form Doesn't Appear:
1. **Check navigation**: Ensure App.tsx has proper navigation setup
2. **Check imports**: Verify Register.tsx is properly imported
3. **Check console**: Look for JavaScript errors in Expo logs

### If Database Errors Occur:
1. **Check initialization**: Ensure DatabaseService.init() is called
2. **Check SQLite**: Verify react-native-sqlite-storage is installed
3. **Clear data**: Try clearing app data/cache

## 📊 Expected Test Results

### ✅ **Should Work:**
- Form validation with real-time feedback
- User registration with encrypted password storage
- Profile data persistence in SQLite database
- Phone number management (add/remove)
- Profile completeness calculation
- Redux state management
- Navigation between auth screens

### 🚧 **Mock Implementations (Non-blocking):**
- Biometric authentication (shows mock dialog)
- Email verification (logic ready, shows mock success)
- Keychain storage (console logs only)
- File operations (document/image picking)

### ⚠️ **Known Issues (Non-critical):**
- TypeScript compilation warnings (app still runs)
- Some Expo module import warnings
- Formatting lint errors (aesthetic only)

## 📝 **Test Checklist**

Print this checklist and check off each item:

- [ ] App starts without crashes
- [ ] Registration form loads
- [ ] Form validation works for all fields
- [ ] Valid registration succeeds
- [ ] Profile screen displays user data
- [ ] Profile editing saves changes
- [ ] Phone numbers can be added/removed
- [ ] Profile completeness updates
- [ ] Navigation works between screens
- [ ] Data persists after app reload
- [ ] Redux state management working
- [ ] No critical JavaScript errors

## 🎯 **Success Criteria**

The authentication feature test is successful if:

1. **User Registration**: Complete flow from form → validation → success
2. **Profile Management**: Edit and save user information
3. **Data Persistence**: Information survives app restarts
4. **UI/UX**: Smooth navigation and responsive interface
5. **Validation**: Proper error handling for invalid inputs

## 📞 **Need Help?**

If you encounter issues:

1. **Check Expo logs**: Look for red error messages
2. **Check browser console**: If using web version
3. **Check device logs**: For native app issues
4. **Verify setup**: Ensure all dependencies installed

The feature has been extensively debugged and should work with the current implementation. Most remaining TypeScript errors are non-blocking for runtime functionality.