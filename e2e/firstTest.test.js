// eslint-disable-next-line no-redeclare
import { device, element, by, expect } from 'detox';

describe('DocsShelf E2E Tests', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.id('welcome-text'))).toBeVisible();
  });

  it('should navigate to login screen', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('login-screen'))).toBeVisible();
  });

  it('should perform login', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit')).tap();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should upload a document', async () => {
    await element(by.id('upload-button')).tap();
    await element(by.id('camera-option')).tap();
    // Note: Actual camera interaction may require additional setup
    await expect(element(by.id('document-list'))).toBeVisible();
  });
});
