// Simplified Encryption Service for Testing
// This provides basic functionality for authentication testing

export class EncryptionService {
  // Generate a simple random key for testing
  static generateKey(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Simple password hashing for testing (not production-ready)
  static async hashPassword(password: string, salt?: string): Promise<string> {
    const useSalt = salt || this.generateKey();
    // Simple hash combination for testing
    const combined = password + useSalt;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return computedHash === hash;
  }

  // Get user-specific encryption key
  static async getUserKey(userId: string): Promise<string> {
    console.log('📝 Getting encryption key for user:', userId);
    return `user_key_${userId}_${this.generateKey()}`;
  }

  // Encrypt data (mock implementation)
  static async encryptData(data: string, key: string): Promise<string> {
    console.log('🔐 Encrypting data (mock)');
    // Simple base64 encoding for testing
    return btoa(data + '_encrypted_with_' + key);
  }

  // Decrypt data (mock implementation)
  static async decryptData(encryptedData: string, key: string): Promise<string> {
    console.log('🔓 Decrypting data (mock)');
    try {
      const decoded = atob(encryptedData);
      return decoded.split('_encrypted_with_')[0];
    } catch {
      return encryptedData; // Return as-is if decryption fails
    }
  }

  // Generate salt for password hashing
  static generateSalt(): string {
    return this.generateKey();
  }

  // Encrypt file (mock implementation)
  static async encryptFile(filePath: string, key: string): Promise<string> {
    console.log('🔐 Encrypting file (mock):', filePath);
    return this.encryptData('mock_file_content', key);
  }

  // Decrypt file (mock implementation)
  static async decryptFile(encryptedData: string, key: string): Promise<string> {
    console.log('🔓 Decrypting file (mock)');
    return this.decryptData(encryptedData, key);
  }
}