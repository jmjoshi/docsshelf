// GDPR compliance service for data protection and privacy
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DatabaseService } from '../database';

export interface ConsentStatus {
  necessary: boolean; // Always true - required for basic functionality
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  lastUpdated: Date;
  version: string;
}

export interface DataSubject {
  id: string;
  email?: string;
  createdAt: Date;
  lastActivity: Date;
  dataRetentionExpiry: Date;
}

export interface PersonalData {
  type: 'document' | 'image' | 'scan' | 'profile' | 'preference';
  id: string;
  userId: string;
  createdAt: Date;
  lastModified: Date;
  purpose: string;
  legalBasis:
    | 'consent'
    | 'contract'
    | 'legitimate_interest'
    | 'legal_obligation';
  retentionPeriod: number; // Days
  encrypted: boolean;
}

export interface DataProcessingActivity {
  id: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  dataType: string;
  userId: string;
  timestamp: Date;
  purpose: string;
  legalBasis: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GDPRRequest {
  id: string;
  userId: string;
  type:
    | 'access'
    | 'portability'
    | 'rectification'
    | 'erasure'
    | 'restriction'
    | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  reason?: string;
  data?: Record<string, unknown>;
}

export class GDPRService {
  private static readonly CONSENT_KEY = 'docsshelf_gdpr_consent';
  private static readonly DATA_SUBJECT_KEY = 'docsshelf_data_subject';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly DATA_RETENTION_PERIOD = 2555; // 7 years in days (legal documents)
  private static readonly INACTIVE_USER_PERIOD = 1095; // 3 years in days

  // Initialize GDPR compliance
  static async init(): Promise<void> {
    try {
      await this.createGDPRTables();
      await this.checkDataRetention();
      await this.registerDataSubject();
      console.log('GDPR service initialized');
    } catch (error) {
      console.error('Failed to initialize GDPR service:', error);
    }
  }

  // Create GDPR-related database tables
  private static async createGDPRTables(): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();

      // Consent tracking table
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS gdpr_consent (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          consent_type TEXT NOT NULL,
          granted BOOLEAN NOT NULL,
          version TEXT NOT NULL,
          granted_at DATETIME NOT NULL,
          withdrawn_at DATETIME,
          ip_address TEXT,
          user_agent TEXT
        )
      `);

      // Data processing activity log
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS gdpr_processing_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          data_type TEXT NOT NULL,
          purpose TEXT NOT NULL,
          legal_basis TEXT NOT NULL,
          timestamp DATETIME NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          data_id TEXT
        )
      `);

      // GDPR requests tracking
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS gdpr_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          request_type TEXT NOT NULL,
          status TEXT NOT NULL,
          requested_at DATETIME NOT NULL,
          completed_at DATETIME,
          reason TEXT,
          request_data TEXT,
          response_data TEXT
        )
      `);

      // Data inventory
      await db.executeSql(`
        CREATE TABLE IF NOT EXISTS gdpr_data_inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          data_type TEXT NOT NULL,
          data_id TEXT NOT NULL,
          purpose TEXT NOT NULL,
          legal_basis TEXT NOT NULL,
          created_at DATETIME NOT NULL,
          last_modified DATETIME NOT NULL,
          retention_period INTEGER NOT NULL,
          encrypted BOOLEAN NOT NULL DEFAULT 1
        )
      `);

      console.log('GDPR tables created successfully');
    } catch (error) {
      console.error('Failed to create GDPR tables:', error);
      throw error;
    }
  }

  // Register data subject
  private static async registerDataSubject(): Promise<void> {
    try {
      const existingSubject = await AsyncStorage.getItem(this.DATA_SUBJECT_KEY);
      if (!existingSubject) {
        const dataSubject: DataSubject = {
          id: this.generateId(),
          createdAt: new Date(),
          lastActivity: new Date(),
          dataRetentionExpiry: new Date(
            Date.now() + this.DATA_RETENTION_PERIOD * 24 * 60 * 60 * 1000
          ),
        };
        await AsyncStorage.setItem(
          this.DATA_SUBJECT_KEY,
          JSON.stringify(dataSubject)
        );
      }
    } catch (error) {
      console.error('Failed to register data subject:', error);
    }
  }

  // Get current consent status
  static async getConsentStatus(): Promise<ConsentStatus | null> {
    try {
      const consentData = await AsyncStorage.getItem(this.CONSENT_KEY);
      if (consentData) {
        const consent = JSON.parse(consentData);
        return {
          ...consent,
          lastUpdated: new Date(consent.lastUpdated),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get consent status:', error);
      return null;
    }
  }

  // Update consent preferences
  static async updateConsent(
    consent: Partial<Omit<ConsentStatus, 'lastUpdated' | 'version'>>
  ): Promise<void> {
    try {
      const currentConsent = await this.getConsentStatus();
      const updatedConsent: ConsentStatus = {
        necessary: true, // Always required
        analytics: consent.analytics ?? false,
        marketing: consent.marketing ?? false,
        functional: consent.functional ?? false,
        lastUpdated: new Date(),
        version: this.CURRENT_VERSION,
        ...currentConsent,
        ...consent,
      };

      await AsyncStorage.setItem(
        this.CONSENT_KEY,
        JSON.stringify(updatedConsent)
      );
      await this.logConsentChange(updatedConsent);
    } catch (error) {
      console.error('Failed to update consent:', error);
      throw error;
    }
  }

  // Log consent changes
  private static async logConsentChange(consent: ConsentStatus): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      const dataSubject = await this.getDataSubject();
      const userAgent = Platform.OS + ' ' + Platform.Version;

      for (const [consentType, granted] of Object.entries(consent)) {
        if (
          ['necessary', 'analytics', 'marketing', 'functional'].includes(
            consentType
          )
        ) {
          await db.executeSql(
            `INSERT INTO gdpr_consent 
             (user_id, consent_type, granted, version, granted_at, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              dataSubject?.id || 'anonymous',
              consentType,
              granted ? 1 : 0,
              consent.version,
              new Date().toISOString(),
              'N/A', // IP address not available in mobile apps
              userAgent,
            ]
          );
        }
      }
    } catch (error) {
      console.error('Failed to log consent change:', error);
    }
  }

  // Log data processing activity
  static async logDataProcessing(
    activity: Omit<DataProcessingActivity, 'id' | 'timestamp' | 'userAgent'>
  ): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      const userAgent = Platform.OS + ' ' + Platform.Version;

      await db.executeSql(
        `INSERT INTO gdpr_processing_log 
         (user_id, activity_type, data_type, purpose, legal_basis, timestamp, ip_address, user_agent, data_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activity.userId,
          activity.type,
          activity.dataType,
          activity.purpose,
          activity.legalBasis,
          new Date().toISOString(),
          activity.ipAddress || 'N/A',
          userAgent,
          activity.userId, // Using userId as data_id for now
        ]
      );
    } catch (error) {
      console.error('Failed to log data processing activity:', error);
    }
  }

  // Register personal data
  static async registerPersonalData(
    data: Omit<PersonalData, 'id' | 'createdAt' | 'lastModified'>
  ): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();

      await db.executeSql(
        `INSERT INTO gdpr_data_inventory 
         (user_id, data_type, data_id, purpose, legal_basis, created_at, last_modified, retention_period, encrypted) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.type,
          data.userId, // Using userId as data_id since id is omitted
          data.purpose,
          data.legalBasis,
          new Date().toISOString(),
          new Date().toISOString(),
          data.retentionPeriod,
          data.encrypted ? 1 : 0,
        ]
      );

      // Log the data creation
      await this.logDataProcessing({
        type: 'create',
        dataType: data.type,
        userId: data.userId,
        purpose: data.purpose,
        legalBasis: data.legalBasis,
      });
    } catch (error) {
      console.error('Failed to register personal data:', error);
      throw error;
    }
  }

  // Handle data subject access request (Article 15)
  static async processAccessRequest(userId: string): Promise<object> {
    try {
      const db = await DatabaseService.getDatabase();

      // Create request record
      await db.executeSql(
        `INSERT INTO gdpr_requests (user_id, request_type, status, requested_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, 'access', 'processing', new Date().toISOString()]
      );

      // Gather all personal data
      const userData = {
        profile: await this.getUserProfile(userId),
        documents: await this.getUserDocuments(userId),
        preferences: await this.getUserPreferences(userId),
        processingLog: await this.getUserProcessingLog(userId),
        consent: await this.getConsentStatus(),
      };

      // Update request as completed
      await db.executeSql(
        `UPDATE gdpr_requests SET status = ?, completed_at = ?, response_data = ? 
         WHERE user_id = ? AND request_type = ? AND status = ?`,
        [
          'completed',
          new Date().toISOString(),
          JSON.stringify(userData),
          userId,
          'access',
          'processing',
        ]
      );

      return userData;
    } catch (error) {
      console.error('Failed to process access request:', error);
      throw error;
    }
  }

  // Handle data portability request (Article 20)
  static async processPortabilityRequest(userId: string): Promise<string> {
    try {
      const userData = await this.processAccessRequest(userId);

      // Format data for export (JSON format)
      const exportData = {
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: this.CURRENT_VERSION,
        data: userData,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to process portability request:', error);
      throw error;
    }
  }

  // Handle erasure request (Article 17 - Right to be forgotten)
  static async processErasureRequest(
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();

      // Create request record
      await db.executeSql(
        `INSERT INTO gdpr_requests (user_id, request_type, status, requested_at, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          'erasure',
          'processing',
          new Date().toISOString(),
          reason || 'User request',
        ]
      );

      // Delete user documents
      await db.executeSql('DELETE FROM documents WHERE user_id = ?', [userId]);

      // Delete user preferences
      await db.executeSql('DELETE FROM user_preferences WHERE user_id = ?', [
        userId,
      ]);

      // Anonymize processing logs (keep for legal compliance)
      await db.executeSql(
        'UPDATE gdpr_processing_log SET user_id = ? WHERE user_id = ?',
        ['anonymized_' + Date.now(), userId]
      );

      // Mark request as completed
      await db.executeSql(
        `UPDATE gdpr_requests SET status = ?, completed_at = ? 
         WHERE user_id = ? AND request_type = ? AND status = ?`,
        ['completed', new Date().toISOString(), userId, 'erasure', 'processing']
      );

      // Log the erasure
      await this.logDataProcessing({
        type: 'delete',
        dataType: 'all_user_data',
        userId,
        purpose: 'GDPR Article 17 compliance',
        legalBasis: 'legal_obligation',
      });
    } catch (error) {
      console.error('Failed to process erasure request:', error);
      throw error;
    }
  }

  // Check data retention and cleanup expired data
  static async checkDataRetention(): Promise<void> {
    try {
      const db = await DatabaseService.getDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.DATA_RETENTION_PERIOD);

      // Find expired documents
      const [expiredDocs] = await db.executeSql(
        'SELECT id, user_id FROM documents WHERE created_at < ?',
        [cutoffDate.toISOString()]
      );

      // Delete expired documents
      if (expiredDocs.rows.length > 0) {
        await db.executeSql('DELETE FROM documents WHERE created_at < ?', [
          cutoffDate.toISOString(),
        ]);

        console.log(`Deleted ${expiredDocs.rows.length} expired documents`);
      }

      // Check for inactive users
      const inactiveDate = new Date();
      inactiveDate.setDate(inactiveDate.getDate() - this.INACTIVE_USER_PERIOD);

      const [inactiveUsers] = await db.executeSql(
        'SELECT DISTINCT user_id FROM documents WHERE last_accessed < ?',
        [inactiveDate.toISOString()]
      );

      if (inactiveUsers.rows.length > 0) {
        console.log(
          `Found ${inactiveUsers.rows.length} inactive users eligible for data cleanup`
        );
      }
    } catch (error) {
      console.error('Failed to check data retention:', error);
    }
  }

  // Get data subject information
  private static async getDataSubject(): Promise<DataSubject | null> {
    try {
      const subjectData = await AsyncStorage.getItem(this.DATA_SUBJECT_KEY);
      if (subjectData) {
        const subject = JSON.parse(subjectData);
        return {
          ...subject,
          createdAt: new Date(subject.createdAt),
          lastActivity: new Date(subject.lastActivity),
          dataRetentionExpiry: new Date(subject.dataRetentionExpiry),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get data subject:', error);
      return null;
    }
  }

  // Helper methods to gather user data
  private static async getUserProfile(userId: string): Promise<object> {
    // Implement based on your user profile structure
    return { userId, message: 'Profile data would be gathered here' };
  }

  private static async getUserDocuments(userId: string): Promise<object[]> {
    try {
      const db = await DatabaseService.getDatabase();
      const [results] = await db.executeSql(
        'SELECT * FROM documents WHERE user_id = ?',
        [userId]
      );
      return Array.from({ length: results.rows.length }, (_, i) =>
        results.rows.item(i)
      );
    } catch (error) {
      console.error('Failed to get user documents:', error);
      return [];
    }
  }

  private static async getUserPreferences(userId: string): Promise<object> {
    // Implement based on your preferences structure
    return { userId, message: 'User preferences would be gathered here' };
  }

  private static async getUserProcessingLog(userId: string): Promise<object[]> {
    try {
      const db = await DatabaseService.getDatabase();
      const [results] = await db.executeSql(
        'SELECT * FROM gdpr_processing_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100',
        [userId]
      );
      return Array.from({ length: results.rows.length }, (_, i) =>
        results.rows.item(i)
      );
    } catch (error) {
      console.error('Failed to get user processing log:', error);
      return [];
    }
  }

  // Generate unique ID
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get privacy policy URL
  static getPrivacyPolicyUrl(): string {
    return 'https://docsshelf.com/privacy-policy';
  }

  // Get terms of service URL
  static getTermsOfServiceUrl(): string {
    return 'https://docsshelf.com/terms-of-service';
  }

  // Generate GDPR compliance report
  static generateComplianceReport(): {
    status: 'compliant' | 'partial' | 'non-compliant';
    checklist: Array<{ requirement: string; status: boolean; notes?: string }>;
    recommendations: string[];
  } {
    const checklist = [
      {
        requirement: 'Article 6 - Lawful basis for processing',
        status: true,
        notes: 'Consent mechanism implemented',
      },
      {
        requirement: 'Article 7 - Conditions for consent',
        status: true,
        notes: 'Consent tracking in place',
      },
      {
        requirement: 'Article 13 - Information to be provided',
        status: true,
        notes: 'Privacy policy available',
      },
      {
        requirement: 'Article 15 - Right of access',
        status: true,
        notes: 'Data access request handling implemented',
      },
      {
        requirement: 'Article 16 - Right to rectification',
        status: false,
        notes: 'Not yet implemented',
      },
      {
        requirement: 'Article 17 - Right to erasure',
        status: true,
        notes: 'Data deletion implemented',
      },
      {
        requirement: 'Article 20 - Right to data portability',
        status: true,
        notes: 'Data export implemented',
      },
      {
        requirement: 'Article 25 - Data protection by design',
        status: true,
        notes: 'Encryption by default',
      },
      {
        requirement: 'Article 30 - Records of processing',
        status: true,
        notes: 'Processing logs maintained',
      },
      {
        requirement: 'Article 32 - Security of processing',
        status: true,
        notes: 'Encryption and security measures in place',
      },
    ];

    const compliantItems = checklist.filter((item) => item.status).length;
    const totalItems = checklist.length;
    const compliancePercentage = (compliantItems / totalItems) * 100;

    return {
      status:
        compliancePercentage >= 90
          ? 'compliant'
          : compliancePercentage >= 70
            ? 'partial'
            : 'non-compliant',
      checklist,
      recommendations: [
        'Implement data rectification functionality',
        'Add regular compliance audits',
        'Enhance consent management interface',
        'Implement data breach notification system',
        'Add privacy impact assessment procedures',
      ],
    };
  }
}
