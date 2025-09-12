module.exports = {
  testEnvironment: 'detox/runners/jest/testEnvironment',
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
