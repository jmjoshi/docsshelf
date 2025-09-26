import { DatabaseService } from '../database/mock';
import { EncryptionService } from '../encryption/mock';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export interface AccountDeletionRequest {
  userId: string;
  reason?: string;
  feedback?: string;
  timestamp: number;
  confirmationCode: string;
}

export interface AccountDeletionStatus {
  isPending: boolean;
  requestedAt?: number;
  confirmationCodeSent: boolean;
  canResendCode: boolean;
  attemptsRemaining: number;
  cooldownUntil?: number;
}

export class AccountDeletionService {
  private static readonly CONFIRMATION_CODE_LENGTH = 6;
  private static readonly CODE_EXPIRY_MINUTES = 15;
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RESEND_COOLDOWN_MINUTES = 5;
  private static readonly DELETION_DELAY_DAYS = 7; // Grace period before permanent deletion

  /**
   * Initiate account deletion request
   * Sends confirmation code to user's email
   */
  static async initiateAccountDeletion(
    userId: string,
    reason?: string,
    feedback?: string
  ): Promise<void> {
    try {
      // Validate user exists
      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for existing pending deletion
      const existingRequest = await this.getAccountDeletionStatus(userId);
      if (existingRequest.isPending) {
        throw new Error('Account deletion is already pending');
      }

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();
      
      // Create deletion request
      const deletionRequest: AccountDeletionRequest = {
        userId,
        reason: reason?.trim() || 'No reason provided',
        feedback: feedback?.trim() || '',
        timestamp: Date.now(),
        confirmationCode: await EncryptionService.hashPassword(confirmationCode),
      };

      // Store deletion request
      await AsyncStorage.setItem(
        `deletion_request_${userId}`,
        JSON.stringify({
          ...deletionRequest,
          expiresAt: Date.now() + (this.CODE_EXPIRY_MINUTES * 60 * 1000),
          attempts: 0,
        })
      );

      // Send confirmation email (mock implementation)
      await this.sendDeletionConfirmationEmail(user.email, confirmationCode);

      console.log('Account deletion initiated for user:', userId);
    } catch (error) {
      console.error('Failed to initiate account deletion:', error);
      throw error;
    }
  }

  /**
   * Confirm account deletion with verification code
   */
  static async confirmAccountDeletion(
    userId: string,
    confirmationCode: string
  ): Promise<void> {
    try {
      const storageKey = `deletion_request_${userId}`;
      const requestData = await AsyncStorage.getItem(storageKey);
      
      if (!requestData) {
        throw new Error('No deletion request found');
      }

      const request = JSON.parse(requestData);
      
      // Check if expired
      if (Date.now() > request.expiresAt) {
        await AsyncStorage.removeItem(storageKey);
        throw new Error('Confirmation code has expired');
      }

      // Check attempts
      if (request.attempts >= this.MAX_ATTEMPTS) {
        throw new Error('Maximum confirmation attempts exceeded');
      }

      // Verify confirmation code
      const isValid = await EncryptionService.verifyPassword(
        confirmationCode,
        request.confirmationCode
      );

      if (!isValid) {
        // Increment attempts
        request.attempts += 1;
        await AsyncStorage.setItem(storageKey, JSON.stringify(request));
        
        const remaining = this.MAX_ATTEMPTS - request.attempts;
        throw new Error(`Invalid confirmation code. ${remaining} attempts remaining.`);
      }

      // Mark account for deletion (soft delete with grace period)
      await this.markAccountForDeletion(userId, request.reason, request.feedback);
      
      // Clean up deletion request
      await AsyncStorage.removeItem(storageKey);
      
      console.log('Account deletion confirmed for user:', userId);
    } catch (error) {
      console.error('Failed to confirm account deletion:', error);
      throw error;
    }
  }

  /**
   * Cancel account deletion request
   */
  static async cancelAccountDeletion(userId: string): Promise<void> {
    try {
      // Remove deletion request
      await AsyncStorage.removeItem(`deletion_request_${userId}`);
      
      // Remove deletion mark from user record
      await AsyncStorage.removeItem(`marked_for_deletion_${userId}`);
      
      console.log('Account deletion cancelled for user:', userId);
    } catch (error) {
      console.error('Failed to cancel account deletion:', error);
      throw error;
    }
  }

  /**
   * Get account deletion status
   */
  static async getAccountDeletionStatus(userId: string): Promise<AccountDeletionStatus> {
    try {
      const requestData = await AsyncStorage.getItem(`deletion_request_${userId}`);
      const markedData = await AsyncStorage.getItem(`marked_for_deletion_${userId}`);
      
      if (markedData) {
        const markedInfo = JSON.parse(markedData);
        return {
          isPending: true,
          requestedAt: markedInfo.markedAt,
          confirmationCodeSent: true,
          canResendCode: false,
          attemptsRemaining: 0,
        };
      }
      
      if (!requestData) {
        return {
          isPending: false,
          confirmationCodeSent: false,
          canResendCode: true,
          attemptsRemaining: this.MAX_ATTEMPTS,
        };
      }

      const request = JSON.parse(requestData);
      const now = Date.now();
      
      // Check if expired
      if (now > request.expiresAt) {
        await AsyncStorage.removeItem(`deletion_request_${userId}`);
        return {
          isPending: false,
          confirmationCodeSent: false,
          canResendCode: true,
          attemptsRemaining: this.MAX_ATTEMPTS,
        };
      }

      const cooldownTime = request.lastResent ? 
        request.lastResent + (this.RESEND_COOLDOWN_MINUTES * 60 * 1000) : 0;
      
      return {
        isPending: true,
        requestedAt: request.timestamp,
        confirmationCodeSent: true,
        canResendCode: now > cooldownTime,
        attemptsRemaining: Math.max(0, this.MAX_ATTEMPTS - (request.attempts || 0)),
        cooldownUntil: cooldownTime > now ? cooldownTime : undefined,
      };
    } catch (error) {
      console.error('Failed to get deletion status:', error);
      return {
        isPending: false,
        confirmationCodeSent: false,
        canResendCode: true,
        attemptsRemaining: this.MAX_ATTEMPTS,
      };
    }
  }

  /**
   * Resend confirmation code
   */
  static async resendConfirmationCode(userId: string): Promise<void> {
    try {
      const status = await this.getAccountDeletionStatus(userId);
      
      if (!status.isPending) {
        throw new Error('No pending deletion request');
      }
      
      if (!status.canResendCode) {
        const waitTime = status.cooldownUntil ? 
          Math.ceil((status.cooldownUntil - Date.now()) / 1000 / 60) : 
          this.RESEND_COOLDOWN_MINUTES;
        throw new Error(`Please wait ${waitTime} minutes before requesting a new code`);
      }

      const user = await DatabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new confirmation code
      const confirmationCode = this.generateConfirmationCode();
      
      // Update existing request with new code
      const storageKey = `deletion_request_${userId}`;
      const requestData = await AsyncStorage.getItem(storageKey);
      
      if (requestData) {
        const request = JSON.parse(requestData);
        request.confirmationCode = await EncryptionService.hashPassword(confirmationCode);
        request.expiresAt = Date.now() + (this.CODE_EXPIRY_MINUTES * 60 * 1000);
        request.lastResent = Date.now();
        request.attempts = 0; // Reset attempts on resend
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(request));
        
        // Send new confirmation email
        await this.sendDeletionConfirmationEmail(user.email, confirmationCode);
      }
    } catch (error) {
      console.error('Failed to resend confirmation code:', error);
      throw error;
    }
  }

  /**
   * Permanently delete user account and all associated data
   */
  static async permanentlyDeleteAccount(userId: string): Promise<void> {
    try {
      // Delete all user data
      await DatabaseService.deleteUser(userId);
      
      // Remove from keychain
      await Keychain.resetInternetCredentials(`docsshelf_user_${userId}`);
      
      // Clean up all AsyncStorage entries for this user
      await this.cleanupUserStorage(userId);
      
      console.log('Account permanently deleted for user:', userId);
    } catch (error) {
      console.error('Failed to permanently delete account:', error);
      throw error;
    }
  }

  /**
   * Generate 6-digit confirmation code
   */
  private static generateConfirmationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send deletion confirmation email (mock implementation)
   */
  private static async sendDeletionConfirmationEmail(
    email: string,
    confirmationCode: string
  ): Promise<void> {
    // Mock email service - in production, integrate with actual email provider
    console.log(`Mock Email - Sending account deletion confirmation to ${email}`);
    console.log(`Confirmation code: ${confirmationCode}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call your email service API:
    // await emailService.sendAccountDeletionConfirmation(email, confirmationCode);
  }

  /**
   * Mark account for deletion (soft delete with grace period)
   */
  private static async markAccountForDeletion(
    userId: string,
    reason: string,
    feedback: string
  ): Promise<void> {
    const deletionInfo = {
      userId,
      reason,
      feedback,
      markedAt: Date.now(),
      scheduledDeletionAt: Date.now() + (this.DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000),
    };

    await AsyncStorage.setItem(
      `marked_for_deletion_${userId}`,
      JSON.stringify(deletionInfo)
    );

    // In production, you might also update the user record in your database
    // to mark it as pending deletion
  }

  /**
   * Clean up all user-related storage entries
   */
  private static async cleanupUserStorage(userId: string): Promise<void> {
    try {
      const keysToRemove = [
        `user_${userId}`,
        `user_preferences_${userId}`,
        `documents_${userId}`,
        `categories_${userId}`,
        `tags_${userId}`,
        `email_verification_${userId}`,
        `deletion_request_${userId}`,
        `marked_for_deletion_${userId}`,
      ];

      await Promise.all(
        keysToRemove.map(key => AsyncStorage.removeItem(key))
      );
    } catch (error) {
      console.error('Failed to cleanup user storage:', error);
    }
  }
}

// Utility functions for account deletion management
export const AccountDeletionUtils = {
  /**
   * Format time remaining until permanent deletion
   */
  formatTimeRemaining(scheduledDeletionAt: number): string {
    const now = Date.now();
    const timeRemaining = scheduledDeletionAt - now;
    
    if (timeRemaining <= 0) {
      return 'Account will be deleted soon';
    }
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    }
  },

  /**
   * Get deletion reasons for user selection
   */
  getDeletionReasons(): Array<{ value: string; label: string }> {
    return [
      { value: 'not_useful', label: 'App is not useful to me' },
      { value: 'privacy_concerns', label: 'Privacy concerns' },
      { value: 'too_complex', label: 'App is too complex to use' },
      { value: 'switching_apps', label: 'Switching to another app' },
      { value: 'temporary_break', label: 'Taking a break from the app' },
      { value: 'account_security', label: 'Account security concerns' },
      { value: 'other', label: 'Other reason' },
    ];
  },
};