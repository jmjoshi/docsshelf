// Database service for SQLite operations
import SQLite from 'react-native-sqlite-storage';

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
      this.db = await SQLite.openDatabase({
        name: this.DB_NAME,
        location: 'default',
      });

      await this.runMigrations();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
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
      const [result] = await this.db.executeSql(
        'SELECT MAX(id) as currentVersion FROM migrations'
      );
      const currentVersion = result.rows.item(0).currentVersion || 0;

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
      const [result] = await this.db.executeSql(
        'SELECT id, name FROM migrations WHERE id > ? ORDER BY id DESC',
        [version]
      );

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
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
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
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

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

  static async updateUser(id: string, updates: Partial<User>): Promise<void> {
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
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    try {
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
    ocrText?: string
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    try {
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
    if (!this.db) throw new Error('Database not initialized');

    try {
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
    if (!this.db) throw new Error('Database not initialized');

    try {
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
    if (!this.db) throw new Error('Database not initialized');

    try {
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
  static async createCategory(
    userId: string,
    name: string,
    color: string
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    try {
      await this.db.executeSql(
        `INSERT INTO categories (id, name, color, userId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, color, userId, now, now]
      );

      await this.logAudit(
        userId,
        'CATEGORY_CREATED',
        `Category ${name} created`
      );
      return id;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  static async getCategoriesByUser(userId: string): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM categories WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );

      const categories: Category[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        categories.push(results.rows.item(i));
      }
      return categories;
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  static async updateCategory(
    id: string,
    userId: string,
    updates: Partial<Pick<Category, 'name' | 'color'>>
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color) {
      fields.push('color = ?');
      values.push(updates.color);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    try {
      await this.db.executeSql(
        `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      await this.logAudit(userId, 'CATEGORY_UPDATED', `Category ${id} updated`);
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string, userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql('DELETE FROM categories WHERE id = ?', [id]);

      await this.logAudit(userId, 'CATEGORY_DELETED', `Category ${id} deleted`);
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
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
}
