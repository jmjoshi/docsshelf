// Multi-Factor Authentication service
import * as CryptoJS from 'crypto-js';
// Note: Using crypto-js instead of expo-crypto for compatibility
// import * as Crypto from 'expo-crypto';

export interface MFAConfig {
  totpEnabled: boolean;
  smsEnabled: boolean;
  biometricEnabled: boolean;
  backupCodes: string[];
}

export class MFAService {
  private static readonly TOTP_PERIOD = 30;
  private static readonly TOTP_DIGITS = 6;

  // Generate TOTP secret for user
  static generateTOTPSecret(): string {
    // Generate a random 20-byte secret using crypto-js
    const secret = CryptoJS.lib.WordArray.random(20);
    const bytes = CryptoJS.enc.Hex.parse(secret.toString()).toString(
      CryptoJS.enc.Base64
    );
    return bytes;
  }

  // Generate TOTP code
  static generateTOTPCode(secret: string, timestamp?: number): string {
    const time = Math.floor(
      (timestamp || Date.now()) / 1000 / this.TOTP_PERIOD
    );
    const counter = this.int64ToBytes(time);

    // HMAC-SHA1
    const hmac = this.hmacSha1(this.base32Decode(secret), counter);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % Math.pow(10, this.TOTP_DIGITS))
      .toString()
      .padStart(this.TOTP_DIGITS, '0');
  }

  // Verify TOTP code with time window tolerance
  static verifyTOTPCode(
    secret: string,
    code: string,
    windowSize: number = 1
  ): boolean {
    const currentTime = Math.floor(Date.now() / 1000);

    for (let i = -windowSize; i <= windowSize; i++) {
      const testTime = currentTime + i * this.TOTP_PERIOD;
      const expectedCode = this.generateTOTPCode(secret, testTime * 1000);

      if (code === expectedCode) {
        return true;
      }
    }

    return false;
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const randomWords = CryptoJS.lib.WordArray.random(6);
      const code = randomWords.toString(CryptoJS.enc.Hex).toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  // Verify backup code (should be used only once)
  static verifyBackupCode(
    providedCode: string,
    validCodes: string[]
  ): { valid: boolean; remainingCodes: string[] } {
    const index = validCodes.indexOf(providedCode.toUpperCase());

    if (index !== -1) {
      const remainingCodes = [...validCodes];
      remainingCodes.splice(index, 1);
      return { valid: true, remainingCodes };
    }

    return { valid: false, remainingCodes: validCodes };
  }

  // Generate QR code URL for TOTP setup
  static generateTOTPQRCodeURL(
    secret: string,
    issuer: string,
    accountName: string
  ): string {
    const params = new URLSearchParams({
      secret: secret,
      issuer: issuer,
      algorithm: 'SHA1',
      digits: this.TOTP_DIGITS.toString(),
      period: this.TOTP_PERIOD.toString(),
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
  }

  // Helper methods
  private static base32Encode(buffer: Uint8Array): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        result += chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += chars[(value << (5 - bits)) & 31];
    }

    return result;
  }

  private static base32Decode(encoded: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const result: number[] = [];

    for (const char of encoded.toUpperCase()) {
      const index = chars.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        result.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new Uint8Array(result);
  }

  private static int64ToBytes(num: number): Uint8Array {
    const result = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      result[i] = num & 0xff;
      num = Math.floor(num / 256);
    }
    return result;
  }

  private static hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
    // Simplified HMAC-SHA1 implementation
    // In production, use a proper crypto library
    const blockSize = 64;
    let keyPadded = new Uint8Array(blockSize);

    if (key.length > blockSize) {
      // Hash the key if it's longer than block size
      keyPadded.set(this.sha1(key).slice(0, blockSize));
    } else {
      keyPadded.set(key);
    }

    const iKeyPad = new Uint8Array(blockSize + message.length);
    const oKeyPad = new Uint8Array(blockSize + 20); // SHA1 produces 20 bytes

    for (let i = 0; i < blockSize; i++) {
      iKeyPad[i] = keyPadded[i] ^ 0x36;
      oKeyPad[i] = keyPadded[i] ^ 0x5c;
    }

    iKeyPad.set(message, blockSize);
    const innerHash = this.sha1(iKeyPad);
    oKeyPad.set(innerHash, blockSize);

    return this.sha1(oKeyPad);
  }

  private static sha1(data: Uint8Array): Uint8Array {
    // Using crypto-js for SHA-1 hashing
    const wordArray = CryptoJS.lib.WordArray.create(data);
    const hashWordArray = CryptoJS.SHA1(wordArray);
    const hashBytes = new Uint8Array(20); // SHA-1 produces 20 bytes

    for (let i = 0; i < 5; i++) {
      // 5 words * 4 bytes = 20 bytes
      const word = hashWordArray.words[i];
      hashBytes[i * 4] = (word >> 24) & 0xff;
      hashBytes[i * 4 + 1] = (word >> 16) & 0xff;
      hashBytes[i * 4 + 2] = (word >> 8) & 0xff;
      hashBytes[i * 4 + 3] = word & 0xff;
    }

    return hashBytes;
  }
}
