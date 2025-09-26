import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseService } from './database/mock';

export interface EmailVerificationCode {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: string;
  createdAt: string;
  isUsed: boolean;
  attempts: number;
}

export interface EmailVerificationService {
  sendVerificationEmail: (userId: string, email: string) => Promise<void>;
  verifyEmailCode: (userId: string, code: string) => Promise<boolean>;
  resendVerificationCode: (userId: string) => Promise<void>;
  checkVerificationStatus: (userId: string) => Promise<boolean>;
}

export class EmailVerificationService {
  private static readonly STORAGE_KEY = 'email_verification_codes';
  private static readonly CODE_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RESEND_COOLDOWN_MINUTES = 2;

  // Generate a 6-digit verification code
  private static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate unique ID for verification code
  private static generateCodeId(): string {
    return `code_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Get stored verification codes
  private static async getStoredCodes(): Promise<EmailVerificationCode[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored verification codes:', error);
      return [];
    }
  }

  // Store verification codes
  private static async storeCode(code: EmailVerificationCode): Promise<void> {
    try {
      const codes = await this.getStoredCodes();
      
      // Remove any existing codes for this user
      const filteredCodes = codes.filter(c => c.userId !== code.userId);
      
      // Add the new code
      filteredCodes.push(code);
      
      // Clean up expired codes
      const now = new Date();
      const activeCodes = filteredCodes.filter(c => 
        new Date(c.expiresAt) > now && !c.isUsed
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeCodes));
    } catch (error) {
      console.error('Failed to store verification code:', error);
      throw new Error('Failed to store verification code');
    }
  }

  // Get verification code for user
  private static async getCodeForUser(userId: string): Promise<EmailVerificationCode | null> {
    try {
      const codes = await this.getStoredCodes();
      return codes.find(c => 
        c.userId === userId && 
        !c.isUsed && 
        new Date(c.expiresAt) > new Date()
      ) || null;
    } catch (error) {
      console.error('Failed to get verification code for user:', error);
      return null;
    }
  }

  // Check if user can request a new code (respecting cooldown)
  private static async canRequestNewCode(userId: string): Promise<boolean> {
    try {
      const codes = await this.getStoredCodes();
      const lastCode = codes
        .filter(c => c.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!lastCode) return true;
      
      const cooldownEnd = new Date(lastCode.createdAt);
      cooldownEnd.setMinutes(cooldownEnd.getMinutes() + this.RESEND_COOLDOWN_MINUTES);
      
      return new Date() > cooldownEnd;
    } catch (error) {
      console.error('Failed to check cooldown status:', error);
      return true; // Allow request if check fails
    }
  }

  // Send verification email (simulate email sending)
  static async sendVerificationEmail(userId: string, email: string): Promise<void> {
    try {
      // Check if user can request a new code
      const canRequest = await this.canRequestNewCode(userId);
      if (!canRequest) {
        throw new Error(`Please wait ${this.RESEND_COOLDOWN_MINUTES} minutes before requesting a new code`);
      }

      // Generate verification code
      const verificationCode = this.generateVerificationCode();
      const codeId = this.generateCodeId();
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

      const codeData: EmailVerificationCode = {
        id: codeId,
        userId,
        email,
        code: verificationCode,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        isUsed: false,
        attempts: 0,
      };

      // Store the code
      await this.storeCode(codeData);

      // In a real app, you would send the email here
      // For now, we'll just log it (in development) or store it for testing
      console.log(`Verification code for ${email}: ${verificationCode}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // await this.sendEmailViaService(email, verificationCode);

    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error instanceof Error ? error : new Error('Failed to send verification email');
    }
  }

  // Verify email code
  static async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      const storedCode = await this.getCodeForUser(userId);
      
      if (!storedCode) {
        throw new Error('No verification code found or code has expired');
      }

      // Check if max attempts exceeded
      if (storedCode.attempts >= this.MAX_ATTEMPTS) {
        throw new Error('Maximum verification attempts exceeded. Please request a new code.');
      }

      // Increment attempts
      storedCode.attempts++;
      await this.storeCode(storedCode);

      // Check if code matches
      if (storedCode.code !== code.trim()) {
        const remainingAttempts = this.MAX_ATTEMPTS - storedCode.attempts;
        throw new Error(
          remainingAttempts > 0 
            ? `Invalid code. ${remainingAttempts} attempts remaining.`
            : 'Invalid code. Maximum attempts exceeded.'
        );
      }

      // Mark code as used
      storedCode.isUsed = true;
      await this.storeCode(storedCode);

      // Update user's email verification status in database
      await DatabaseService.updateUser(userId, {
        emailVerified: true,
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error instanceof Error ? error : new Error('Email verification failed');
    }
  }

  // Resend verification code
  static async resendVerificationCode(userId: string): Promise<void> {
    try {
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await this.sendVerificationEmail(userId, user.email);
    } catch (error) {
      console.error('Failed to resend verification code:', error);
      throw error instanceof Error ? error : new Error('Failed to resend verification code');
    }
  }

  // Check if user's email is verified
  static async checkVerificationStatus(userId: string): Promise<boolean> {
    try {
      const user = await DatabaseService.getUserById(userId);
      return user?.emailVerified || false;
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return false;
    }
  }

  // Get verification code info (for UI display)
  static async getVerificationCodeInfo(userId: string): Promise<{
    codeExists: boolean;
    expiresAt?: string;
    attempts?: number;
    maxAttempts: number;
    canResend: boolean;
  }> {
    try {
      const storedCode = await this.getCodeForUser(userId);
      const canResend = await this.canRequestNewCode(userId);

      return {
        codeExists: !!storedCode,
        expiresAt: storedCode?.expiresAt,
        attempts: storedCode?.attempts || 0,
        maxAttempts: this.MAX_ATTEMPTS,
        canResend,
      };
    } catch (error) {
      console.error('Failed to get verification code info:', error);
      return {
        codeExists: false,
        maxAttempts: this.MAX_ATTEMPTS,
        canResend: true,
      };
    }
  }

  // Clean up expired codes (utility method)
  static async cleanupExpiredCodes(): Promise<void> {
    try {
      const codes = await this.getStoredCodes();
      const now = new Date();
      
      const activeCodes = codes.filter(c => 
        new Date(c.expiresAt) > now && !c.isUsed
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeCodes));
    } catch (error) {
      console.error('Failed to cleanup expired codes:', error);
    }
  }

  // Clear all verification codes for user (e.g., on logout)
  static async clearUserCodes(userId: string): Promise<void> {
    try {
      const codes = await this.getStoredCodes();
      const filteredCodes = codes.filter(c => c.userId !== userId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCodes));
    } catch (error) {
      console.error('Failed to clear user codes:', error);
    }
  }
}