module.exports = {
  testEnvironment: 'detox/runners/jest/testEnvironment',
  setupFilesAfterEnv: ['<rootDir>/init.js'],
  testRunner: 'jest-circus/runner',
  testMatch: ['<rootDir>/**/*.test.js'],
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testTimeout: 120000,
};
