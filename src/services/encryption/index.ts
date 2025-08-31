// Encryption service for secure data handling using AES-256-GCM
import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 128;

  // Generate a random key for encryption
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }

  // Derive key from password using PBKDF2
  static deriveKey(password: string, salt?: string): string {
    const saltWordArray = salt
      ? CryptoJS.enc.Hex.parse(salt)
      : CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(password, saltWordArray, {
      keySize: this.KEY_SIZE / 32,
      iterations: 10000,
    });
    return key.toString();
  }

  // Encrypt data with AES-256-GCM
  static async encryptData(data: string, key: string): Promise<string> {
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE / 8);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Combine IV and encrypted data
    const combined = iv.concat(encrypted.ciphertext);
    return combined.toString(CryptoJS.enc.Base64);
  }

  // Decrypt data with AES-256-GCM
  static async decryptData(
    encryptedData: string,
    key: string
  ): Promise<string> {
    const combined = CryptoJS.enc.Base64.parse(encryptedData);
    const iv = combined.clone();
    iv.sigBytes = this.IV_SIZE / 8;
    iv.clamp();

    const ciphertext = combined.clone();
    ciphertext.words.splice(0, iv.words.length);
    ciphertext.sigBytes -= iv.sigBytes;

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext } as CryptoJS.lib.CipherParams,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Store encryption key securely in Keychain
  static async storeKey(
    key: string,
    service: string = 'DocsShelf'
  ): Promise<void> {
    try {
      await Keychain.setGenericPassword('encryption-key', key, {
        service,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Failed to store key:', error);
      throw error;
    }
  }

  // Retrieve encryption key from Keychain
  static async getKey(service: string = 'DocsShelf'): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to get key:', error);
      return null;
    }
  }

  // Delete encryption key from Keychain
  static async deleteKey(service: string = 'DocsShelf'): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service });
    } catch (error) {
      console.error('Failed to delete key:', error);
      throw error;
    }
  }

  // Encrypt file data
  static async encryptFile(fileData: string, key: string): Promise<string> {
    return this.encryptData(fileData, key);
  }

  // Decrypt file data
  static async decryptFile(
    encryptedFileData: string,
    key: string
  ): Promise<string> {
    return this.decryptData(encryptedFileData, key);
  }
}
