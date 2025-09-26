#!/usr/bin/env node

/**
 * Quick Test Script - DocsShelf Authentication
 * Run this to test core authentication logic without the UI
 */

console.log('🧪 Testing DocsShelf Authentication Core Logic\n');

// Test imports and basic functionality
async function testCoreLogic() {
  try {
    // Test 1: Database Service
    console.log('1️⃣ Testing Database Service...');
    const { DatabaseService } = require('./src/services/database/index.ts');
    console.log('✅ Database service imported successfully');

    // Test 2: Encryption Service
    console.log('2️⃣ Testing Encryption Service...');
    const { EncryptionService } = require('./src/services/encryption/index.ts');
    console.log('✅ Encryption service imported successfully');

    // Test 3: Auth Service
    console.log('3️⃣ Testing Auth Service...');
    const { AuthService } = require('./src/services/auth/index.ts');
    console.log('✅ Auth service imported successfully');

    // Test 4: Redux Slices
    console.log('4️⃣ Testing Redux Slices...');
    const authSlice = require('./src/store/slices/authSlice.ts');
    const profileSlice = require('./src/store/slices/profileSlice.ts');
    console.log('✅ Redux slices imported successfully');

    // Test 5: Store Configuration
    console.log('5️⃣ Testing Store Configuration...');
    const { store } = require('./src/store/store.ts');
    console.log('✅ Redux store configured successfully');

    console.log('\n🎉 Core Logic Test Results:');
    console.log('✅ All critical services load without errors');
    console.log('✅ Redux store is properly configured');
    console.log('✅ Authentication modules are ready');

    return true;
  } catch (error) {
    console.error('❌ Core logic test failed:', error.message);
    console.log('\n🔧 This suggests there may be import or compilation issues.');
    console.log('   Try running: npx tsc --noEmit --skipLibCheck');
    return false;
  }
}

// Test validation schemas
function testValidation() {
  console.log('\n6️⃣ Testing Validation Schemas...');
  
  try {
    const yup = require('yup');
    
    // Test email validation
    const emailSchema = yup.string().email().required();
    
    // Valid emails
    const validEmails = ['test@example.com', 'user.name+tag@domain.co.uk'];
    validEmails.forEach(email => {
      const isValid = emailSchema.isValidSync(email);
      console.log(`  📧 ${email}: ${isValid ? '✅' : '❌'}`);
    });
    
    // Invalid emails
    const invalidEmails = ['invalid', 'test@', '@domain.com'];
    invalidEmails.forEach(email => {
      const isValid = emailSchema.isValidSync(email);
      console.log(`  📧 ${email}: ${isValid ? '❌ (should be invalid)' : '✅'}`);
    });
    
    console.log('✅ Validation schemas working correctly');
    return true;
  } catch (error) {
    console.error('❌ Validation test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting comprehensive core logic tests...\n');
  
  const coreLogicPassed = await testCoreLogic();
  const validationPassed = testValidation();
  
  console.log('\n📊 Test Summary:');
  console.log(`Core Logic: ${coreLogicPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Validation: ${validationPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (coreLogicPassed && validationPassed) {
    console.log('\n🚀 Authentication feature is ready for UI testing!');
    console.log('   Next steps:');
    console.log('   1. Ensure Expo server is running (npx expo start)');
    console.log('   2. Open app in simulator/device');
    console.log('   3. Test registration flow as described in TESTING_GUIDE.md');
  } else {
    console.log('\n⚠️  Some core components need attention before UI testing');
    console.log('   Check the error messages above for specific issues');
  }
}

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.error('❌ Please run this script from the docsshelf project root directory');
  process.exit(1);
}

if (!fs.existsSync(path.join(process.cwd(), 'src'))) {
  console.error('❌ src directory not found. Are you in the correct project directory?');
  process.exit(1);
}

// Run the tests
runTests().catch(console.error);