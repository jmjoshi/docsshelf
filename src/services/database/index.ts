// Database service for SQLite operations
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { StorageQuotaManager } from '../../utils/storageQuota';

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: string; number: string }[];
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  path: string;
  size?: number;
  mimeType?: string;
  category?: string;
  folder?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  ocrText?: string;
  isSynced?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Migration {
  id: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
  down?: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'DocsShelf.db';
  private static readonly DB_VERSION = 2; // Increment this for new migrations

  // Migrations array
  private static migrations: Migration[] = [
    {
      id: 1,
      name: 'Initial schema',
      up: async (db: SQLite.SQLiteDatabase) => {
        // Users table
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            phoneNumbers TEXT, -- JSON string
            passwordHash TEXT NOT NULL,
            salt TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `);

        // Audit logs table
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL,
            ipAddress TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
          )
        `);

        // Documents table (for metadata)
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER,
            mimeType TEXT,
            category TEXT,
            folder TEXT,
            tags TEXT, -- JSON array
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users (id)
          )
        `);

        // Migrations table
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            executed_at TEXT NOT NULL
          )
        `);
      },
    },
    {
      id: 2,
      name: 'Add categories and sync fields',
      up: async (db: SQLite.SQLiteDatabase) => {
        // Categories table
        await db.executeSql(`
          CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            userId TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users (id)
          )
        `);

        // Add sync fields to documents
        await db.executeSql(`
          ALTER TABLE documents ADD COLUMN ocrText TEXT
        `);

        await db.executeSql(`
          ALTER TABLE documents ADD COLUMN isSynced INTEGER DEFAULT 0
        `);
      },
      down: async (db: SQLite.SQLiteDatabase) => {
        // Remove added columns
        await db.executeSql(`
          ALTER TABLE documents DROP COLUMN ocrText
        `);

        await db.executeSql(`
          ALTER TABLE documents DROP COLUMN isSynced
        `);

        // Drop categories table
        await db.executeSql(`
          DROP TABLE IF EXISTS categories
        `);
      },
    },
  ];

  // Initialize SQLite database with migrations
  static async initDatabase(): Promise<void> {
    try {
      // Check if we're running on web platform
      if (Platform.OS === 'web') {
        console.log('Web platform detected - using localStorage fallback');
        // For web, we'll use a simple localStorage-based storage
        // This is a temporary solution until we implement IndexedDB
        this.db = null; // Set to null to indicate web mode
        await this.initWebStorage();
        console.log('Web storage initialized successfully');
        return;
      }

      this.db = await SQLite.openDatabaseAsync(this.DB_NAME);

      await this.runMigrations();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Initialize web storage fallback
  private static async initWebStorage(): Promise<void> {
    try {
      // Initialize basic storage structure in localStorage
      if (!localStorage.getItem('docsshelf_users')) {
        localStorage.setItem('docsshelf_users', JSON.stringify([]));
      }
      if (!localStorage.getItem('docsshelf_documents')) {
        localStorage.setItem('docsshelf_documents', JSON.stringify([]));
      }
      if (!localStorage.getItem('docsshelf_categories')) {
        localStorage.setItem('docsshelf_categories', JSON.stringify([]));
      }
      if (!localStorage.getItem('docsshelf_audit_logs')) {
        localStorage.setItem('docsshelf_audit_logs', JSON.stringify([]));
      }
      console.log('Web storage structure initialized');
    } catch (error) {
      console.error('Failed to initialize web storage:', error);
      throw error;
    }
  }

  // Run pending migrations
  private static async runMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Create migrations table if it doesn't exist
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at TEXT NOT NULL
        )
      `);

      // Get current migration version
      const migrationResult = await this.db.executeSql(
        'SELECT MAX(id) as currentVersion FROM migrations'
      );
      let currentVersion = 0;
      if (Array.isArray(migrationResult) && migrationResult.length > 0) {
        const [result] = migrationResult;
        if (result.rows && result.rows.length > 0) {
          const item = result.rows.item(0);
          if (item && item.currentVersion != null) {
            currentVersion = item.currentVersion;
          }
        }
      }

      // Run pending migrations
      for (const migration of this.migrations) {
        if (migration.id > currentVersion) {
          console.log(`Running migration: ${migration.name}`);
          await migration.up(this.db);

          // Record migration
          await this.db.executeSql(
            'INSERT INTO migrations (id, name, executed_at) VALUES (?, ?, ?)',
            [migration.id, migration.name, new Date().toISOString()]
          );
        }
      }

      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }
  }

  // Rollback to specific version (for development/testing)
  static async rollbackTo(version: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const rollbackResult = await this.db.executeSql(
        'SELECT id, name FROM migrations WHERE id > ? ORDER BY id DESC',
        [version]
      );
      if (!Array.isArray(rollbackResult)) {
        throw new Error('Rollback query did not return an array');
      }
      const [result] = rollbackResult;

      for (let i = 0; i < result.rows.length; i++) {
        const migration = result.rows.item(i);
        const migrationDef = this.migrations.find((m) => m.id === migration.id);

        if (migrationDef?.down) {
          console.log(`Rolling back migration: ${migration.name}`);
          await migrationDef.down(this.db);
        }

        // Remove from migrations table
        await this.db.executeSql('DELETE FROM migrations WHERE id = ?', [
          migration.id,
        ]);
      }

      console.log(`Rolled back to version ${version}`);
    } catch (error) {
      console.error('Failed to rollback migrations:', error);
      throw error;
    }
  }

  // User operations
  static async createUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const users = JSON.parse(
          localStorage.getItem('docsshelf_users') || '[]'
        );
        users.push(user);
        localStorage.setItem('docsshelf_users', JSON.stringify(users));
        return user;
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      await this.db.executeSql(
        `INSERT INTO users (id, email, firstName, lastName, phoneNumbers, passwordHash, salt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.email,
          user.firstName,
          user.lastName,
          JSON.stringify(user.phoneNumbers),
          user.passwordHash,
          user.salt,
          user.createdAt,
          user.updatedAt,
        ]
      );

      await this.logAudit(
        user.id,
        'USER_CREATED',
        `User ${user.email} created`
      );
      return user;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const users = JSON.parse(
          localStorage.getItem('docsshelf_users') || '[]'
        );
        return users.find((user: User) => user.email === email) || null;
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      const userResult = await this.db.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (!Array.isArray(userResult)) {
        throw new Error('User query did not return an array');
      }
      const [results] = userResult;

      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          ...row,
          phoneNumbers: JSON.parse(row.phoneNumbers || '[]'),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const userIdResult = await this.db.executeSql(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      if (!Array.isArray(userIdResult)) {
        throw new Error('User by ID query did not return an array');
      }
      const [results] = userIdResult;

      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          ...row,
          phoneNumbers: JSON.parse(row.phoneNumbers || '[]'),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.firstName) {
      fields.push('firstName = ?');
      values.push(updates.firstName);
    }
    if (updates.lastName) {
      fields.push('lastName = ?');
      values.push(updates.lastName);
    }
    if (updates.phoneNumbers) {
      fields.push('phoneNumbers = ?');
      values.push(JSON.stringify(updates.phoneNumbers));
    }
    if (updates.passwordHash) {
      fields.push('passwordHash = ?');
      values.push(updates.passwordHash);
    }
    if (updates.salt) {
      fields.push('salt = ?');
      values.push(updates.salt);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    try {
      await this.db.executeSql(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      await this.logAudit(id, 'USER_UPDATED', `User ${id} updated`);
      
      // Return the updated user
      return await this.getUserById(id);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Audit logging
  static async logAudit(
    userId: string,
    action: string,
    details: string,
    ipAddress?: string
  ): Promise<void> {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const auditLog: AuditLog = {
          id,
          userId,
          action,
          details,
          timestamp,
          ipAddress,
        };
        const auditLogs = JSON.parse(
          localStorage.getItem('docsshelf_audit_logs') || '[]'
        );
        auditLogs.push(auditLog);
        localStorage.setItem('docsshelf_audit_logs', JSON.stringify(auditLogs));
        return;
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      await this.db.executeSql(
        'INSERT INTO audit_logs (id, userId, action, details, timestamp, ipAddress) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userId, action, details, timestamp, ipAddress || null]
      );
    } catch (error) {
      console.error('Failed to log audit:', error);
      // Don't throw here to avoid breaking main flow
    }
  }

  static async getAuditLogs(
    userId: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM audit_logs WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
      );

      const logs: AuditLog[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        logs.push(results.rows.item(i));
      }
      return logs;
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }

  // Document operations
  static async saveDocumentMetadata(
    userId: string,
    name: string,
    path: string,
    size?: number,
    mimeType?: string,
    category?: string,
    folder?: string,
    tags?: string[],
    ocrText?: string,
    existingId?: string // Add optional existing ID parameter
  ): Promise<string> {
    const id =
      existingId ||
      `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    const document: Document = {
      id,
      userId,
      name,
      path,
      size,
      mimeType,
      category,
      folder,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
      ocrText,
      isSynced: false,
    };

    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const documentJson = JSON.stringify(document);
        const documentSize = documentJson.length;

        // Check storage quota before saving
        if (!StorageQuotaManager.hasSpaceFor(documentSize)) {
          const quotaStatus = StorageQuotaManager.checkQuotaStatus();

          if (quotaStatus === 'critical') {
            // Try to free space
            const spaceFreed =
              await StorageQuotaManager.ensureSpaceFor(documentSize);
            if (!spaceFreed) {
              throw new QuotaExceededError(
                'Storage quota exceeded and cleanup failed. Please manually delete some documents.'
              );
            }
          } else {
            throw new QuotaExceededError(
              'Storage quota exceeded. Please delete some documents to free space.'
            );
          }
        }

        const documents = JSON.parse(
          localStorage.getItem('docsshelf_documents') || '[]'
        );
        documents.push(document);
        localStorage.setItem('docsshelf_documents', JSON.stringify(documents));
        return id;
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      await this.db.executeSql(
        `INSERT INTO documents (id, userId, name, path, size, mimeType, category, folder, tags, ocrText, createdAt, updatedAt, isSynced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          name,
          path,
          size || null,
          mimeType || null,
          category || null,
          folder || null,
          tags ? JSON.stringify(tags) : null,
          ocrText || null,
          now,
          now,
          0, // isSynced = false initially
        ]
      );

      await this.logAudit(
        userId,
        'DOCUMENT_CREATED',
        `Document ${name} created`
      );
      return id;
    } catch (error) {
      console.error('Failed to save document metadata:', error);
      throw error;
    }
  }

  static async getDocumentsByUser(userId: string): Promise<Document[]> {
    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const documents = JSON.parse(
          localStorage.getItem('docsshelf_documents') || '[]'
        );
        return documents
          .filter((doc: Document) => doc.userId === userId)
          .sort(
            (a: Document, b: Document) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      const [results] = await this.db.executeSql(
        'SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );

      const documents: Document[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const doc = results.rows.item(i);
        documents.push({
          ...doc,
          tags: JSON.parse(doc.tags || '[]'),
          isSynced: Boolean(doc.isSynced),
        });
      }
      return documents;
    } catch (error) {
      console.error('Failed to get documents:', error);
      throw error;
    }
  }

  // Get documents with pagination for performance
  static async getDocumentsByUserPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ documents: Document[]; totalCount: number; hasMore: boolean }> {
    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const allDocuments = JSON.parse(
          localStorage.getItem('docsshelf_documents') || '[]'
        );
        const userDocuments = allDocuments
          .filter((doc: Document) => doc.userId === userId)
          .sort(
            (a: Document, b: Document) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        const totalCount = userDocuments.length;
        const offset = (page - 1) * pageSize;
        const documents = userDocuments.slice(offset, offset + pageSize);
        const hasMore = offset + documents.length < totalCount;

        return { documents, totalCount, hasMore };
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      // Get total count
      const [countResult] = await this.db.executeSql(
        'SELECT COUNT(*) as total FROM documents WHERE userId = ?',
        [userId]
      );
      const totalCount = countResult.rows.item(0).total;

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const [results] = await this.db.executeSql(
        'SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [userId, pageSize, offset]
      );

      const documents: Document[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const doc = results.rows.item(i);
        documents.push({
          ...doc,
          tags: JSON.parse(doc.tags || '[]'),
          isSynced: Boolean(doc.isSynced),
        });
      }

      const hasMore = offset + documents.length < totalCount;

      return { documents, totalCount, hasMore };
    } catch (error) {
      console.error('Failed to get paginated documents:', error);
      throw error;
    }
  }

  // Search documents with pagination
  static async searchDocumentsPaginated(
    userId: string,
    query: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ documents: Document[]; totalCount: number; hasMore: boolean }> {
    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const allDocuments = JSON.parse(
          localStorage.getItem('docsshelf_documents') || '[]'
        );
        const lowerQuery = query.toLowerCase();

        const filteredDocuments = allDocuments
          .filter((doc: Document) => {
            if (doc.userId !== userId) return false;
            return (
              doc.name.toLowerCase().includes(lowerQuery) ||
              (doc.category || '').toLowerCase().includes(lowerQuery) ||
              doc.tags.some((tag: string) =>
                tag.toLowerCase().includes(lowerQuery)
              )
            );
          })
          .sort(
            (a: Document, b: Document) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        const totalCount = filteredDocuments.length;
        const offset = (page - 1) * pageSize;
        const documents = filteredDocuments.slice(offset, offset + pageSize);
        const hasMore = offset + documents.length < totalCount;

        return { documents, totalCount, hasMore };
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      const lowerQuery = query.toLowerCase();
      const searchPattern = `%${lowerQuery}%`;

      // Get total count for search
      const [countResult] = await this.db.executeSql(
        `SELECT COUNT(*) as total FROM documents WHERE userId = ? AND (
          LOWER(name) LIKE ? OR
          LOWER(category) LIKE ? OR
          LOWER(tags) LIKE ?
        )`,
        [userId, searchPattern, searchPattern, searchPattern]
      );
      const totalCount = countResult.rows.item(0).total;

      // Get paginated search results
      const offset = (page - 1) * pageSize;
      const [results] = await this.db.executeSql(
        `SELECT * FROM documents WHERE userId = ? AND (
          LOWER(name) LIKE ? OR
          LOWER(category) LIKE ? OR
          LOWER(tags) LIKE ?
        ) ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [userId, searchPattern, searchPattern, searchPattern, pageSize, offset]
      );

      const documents: Document[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const doc = results.rows.item(i);
        documents.push({
          ...doc,
          tags: JSON.parse(doc.tags || '[]'),
          isSynced: Boolean(doc.isSynced),
        });
      }

      const hasMore = offset + documents.length < totalCount;

      return { documents, totalCount, hasMore };
    } catch (error) {
      console.error('Failed to search documents paginated:', error);
      throw error;
    }
  }

  static async updateDocument(
    id: string,
    updates: Partial<Document>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.path) {
      fields.push('path = ?');
      values.push(updates.path);
    }
    if (updates.size !== undefined) {
      fields.push('size = ?');
      values.push(updates.size);
    }
    if (updates.mimeType) {
      fields.push('mimeType = ?');
      values.push(updates.mimeType);
    }
    if (updates.category) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.folder) {
      fields.push('folder = ?');
      values.push(updates.folder);
    }
    if (updates.tags) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.ocrText) {
      fields.push('ocrText = ?');
      values.push(updates.ocrText);
    }
    if (updates.isSynced !== undefined) {
      fields.push('isSynced = ?');
      values.push(updates.isSynced ? 1 : 0);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    try {
      await this.db.executeSql(
        `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      await this.logAudit(
        updates.userId || 'unknown',
        'DOCUMENT_UPDATED',
        `Document ${id} updated`
      );
    } catch (error) {
      console.error('Failed to update document:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql('DELETE FROM documents WHERE id = ?', [id]);

      await this.logAudit(userId, 'DOCUMENT_DELETED', `Document ${id} deleted`);
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  }

  // Category operations
  static async createCategory(categoryData: {
    userId: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    createdAt: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const { userId, name, description, color, icon } = categoryData;
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      // First ensure the table has the required columns
      await this.ensureCategoryColumnsExist();

      await this.db.executeSql(
        `INSERT INTO categories (id, userId, name, description, color, icon, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          name,
          description || null,
          color,
          icon || 'folder',
          now,
          now,
        ]
      );

      await this.logAudit(
        userId,
        'CATEGORY_CREATED',
        `Created category: ${name}`
      );

      return { id, name, description, color, icon, createdAt: now };
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  static async getCategoriesByUser(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      color: string;
      icon?: string;
      documentCount: number;
      createdAt: string;
    }>
  > {
    try {
      // Handle web storage
      if (Platform.OS === 'web') {
        const categories = JSON.parse(
          localStorage.getItem('docsshelf_categories') || '[]'
        );
        const documents = JSON.parse(
          localStorage.getItem('docsshelf_documents') || '[]'
        );

        return categories
          .filter((cat: Category) => cat.userId === userId)
          .map((cat: Category) => {
            const documentCount = documents.filter(
              (doc: Document) =>
                doc.category === cat.id && doc.userId === userId
            ).length;
            return {
              ...cat,
              documentCount,
            };
          })
          .sort((a: Category, b: Category) => a.name.localeCompare(b.name));
      }

      // Handle SQLite (mobile)
      if (!this.db) throw new Error('Database not initialized');

      await this.ensureCategoryColumnsExist();

      const [results] = await this.db.executeSql(
        `SELECT c.*, 
                COUNT(d.id) as documentCount
         FROM categories c
         LEFT JOIN documents d ON c.id = d.category AND d.userId = c.userId
         WHERE c.userId = ?
         GROUP BY c.id
         ORDER BY c.name`,
        [userId]
      );

      const categories = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        categories.push({
          id: row.id,
          name: row.name,
          description: row.description,
          color: row.color,
          icon: row.icon || 'folder',
          documentCount: row.documentCount || 0,
          createdAt: row.createdAt,
        });
      }
      return categories;
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  // Alias method for backward compatibility
  static async getCategories(userId: string) {
    return this.getCategoriesByUser(userId);
  }

  static async updateCategory(
    categoryId: string,
    updates: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.color) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.icon) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(categoryId);

    try {
      await this.ensureCategoryColumnsExist();

      await this.db.executeSql(
        `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  static async deleteCategory(
    categoryId: string,
    userId: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Move documents in this category to uncategorized
      await this.db.executeSql(
        `UPDATE documents SET category = NULL, updatedAt = ? WHERE category = ?`,
        [new Date().toISOString(), categoryId]
      );

      // Delete folders in this category if the table exists
      try {
        await this.db.executeSql('DELETE FROM folders WHERE categoryId = ?', [
          categoryId,
        ]);
      } catch {
        // Folders table might not exist yet
      }

      // Delete the category
      await this.db.executeSql('DELETE FROM categories WHERE id = ?', [
        categoryId,
      ]);

      await this.logAudit(
        userId,
        'CATEGORY_DELETED',
        `Category ${categoryId} deleted`
      );
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  }

  // Ensure category table has all required columns
  private static async ensureCategoryColumnsExist(): Promise<void> {
    try {
      // Check if description column exists, add if not
      await this.db!.executeSql(`
        ALTER TABLE categories ADD COLUMN description TEXT
      `);
    } catch {
      // Column might already exist
    }

    try {
      // Check if icon column exists, add if not
      await this.db!.executeSql(`
        ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'folder'
      `);
    } catch {
      // Column might already exist
    }
  }

  // Sync operations for offline caching
  static async getUnsyncedDocuments(userId: string): Promise<Document[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM documents WHERE userId = ? AND isSynced = 0 ORDER BY createdAt DESC',
        [userId]
      );

      const documents: Document[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        const doc = results.rows.item(i);
        documents.push({
          ...doc,
          tags: JSON.parse(doc.tags || '[]'),
          isSynced: Boolean(doc.isSynced),
        });
      }
      return documents;
    } catch (error) {
      console.error('Failed to get unsynced documents:', error);
      throw error;
    }
  }

  static async markDocumentsAsSynced(documentIds: string[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const placeholders = documentIds.map(() => '?').join(',');
      await this.db.executeSql(
        `UPDATE documents SET isSynced = 1 WHERE id IN (${placeholders})`,
        documentIds
      );
    } catch (error) {
      console.error('Failed to mark documents as synced:', error);
      throw error;
    }
  }

  // Bulk operations for performance
  static async bulkInsertDocuments(
    userId: string,
    documents: Omit<Document, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const ids: string[] = [];
    const now = new Date().toISOString();

    try {
      await this.db.executeSql('BEGIN TRANSACTION');

      for (const doc of documents) {
        const id =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        ids.push(id);

        await this.db.executeSql(
          `INSERT INTO documents (id, userId, name, path, size, mimeType, category, folder, tags, ocrText, createdAt, updatedAt, isSynced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            userId,
            doc.name,
            doc.path,
            doc.size || null,
            doc.mimeType || null,
            doc.category || null,
            doc.folder || null,
            doc.tags ? JSON.stringify(doc.tags) : null,
            doc.ocrText || null,
            now,
            now,
            0,
          ]
        );
      }

      await this.db.executeSql('COMMIT');
      await this.logAudit(
        userId,
        'DOCUMENTS_BULK_INSERTED',
        `Bulk inserted ${documents.length} documents`
      );

      return ids;
    } catch (error) {
      await this.db.executeSql('ROLLBACK');
      console.error('Failed to bulk insert documents:', error);
      throw error;
    }
  }

  // Close database connection
  static async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
  static async createFolder(folderData: {
    categoryId: string;
    name: string;
    description?: string;
  }): Promise<{
    id: string;
    categoryId: string;
    name: string;
    description?: string;
    createdAt: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const { categoryId, name, description } = folderData;
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      // Ensure folders table exists
      await this.ensureFoldersTableExists();

      await this.db.executeSql(
        `INSERT INTO folders (id, categoryId, name, description, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, categoryId, name, description || null, now, now]
      );

      return { id, categoryId, name, description, createdAt: now };
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  static async getFolders(categoryId: string): Promise<
    Array<{
      id: string;
      categoryId: string;
      name: string;
      description?: string;
      documentCount: number;
      createdAt: string;
    }>
  > {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.ensureFoldersTableExists();

      const [results] = await this.db.executeSql(
        `SELECT f.*, 
                COUNT(d.id) as documentCount
         FROM folders f
         LEFT JOIN documents d ON f.id = d.folder
         WHERE f.categoryId = ?
         GROUP BY f.id
         ORDER BY f.name`,
        [categoryId]
      );

      const folders = [];
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        folders.push({
          id: row.id,
          categoryId: row.categoryId,
          name: row.name,
          description: row.description,
          documentCount: row.documentCount || 0,
          createdAt: row.createdAt,
        });
      }
      return folders;
    } catch (error) {
      console.error('Failed to get folders:', error);
      throw error;
    }
  }

  static async deleteFolder(folderId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Move documents in this folder to no folder
      await this.db.executeSql(
        `UPDATE documents SET folder = NULL, updatedAt = ? WHERE folder = ?`,
        [new Date().toISOString(), folderId]
      );

      // Delete the folder
      await this.db.executeSql('DELETE FROM folders WHERE id = ?', [folderId]);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  }

  // Ensure folders table exists
  private static async ensureFoldersTableExists(): Promise<void> {
    try {
      await this.db!.executeSql(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          categoryId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (categoryId) REFERENCES categories (id)
        )
      `);
    } catch (error) {
      console.error('Failed to ensure folders table exists:', error);
    }
  }

  // Utility method to generate unique IDs
  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Delete user and all associated data
  static async deleteUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Delete user data in order (foreign key constraints)
      const tables = [
        'audit_logs',
        'document_tags', 
        'documents',
        'folders',
        'categories',
        'users'
      ];

      for (const table of tables) {
        await this.db.executeSql(
          `DELETE FROM ${table} WHERE userId = ?`,
          [userId]
        );
      }

      // Also delete user record itself
      await this.db.executeSql(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      console.log('User and all associated data deleted:', userId);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  // Get database instance
  static async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initDatabase();
    }
    return this.db!;
  }
}
