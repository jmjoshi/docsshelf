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
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'DocsShelf.db';

  // Initialize SQLite database
  static async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.DB_NAME,
        location: 'default',
      });
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  // Create necessary tables
  static async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Users table
      await this.db.executeSql(`
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
      await this.db.executeSql(`
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
      await this.db.executeSql(`
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

      console.log('Tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
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
    tags?: string[]
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();

    try {
      await this.db.executeSql(
        `INSERT INTO documents (id, userId, name, path, size, mimeType, category, folder, tags, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          now,
          now,
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
        });
      }
      return documents;
    } catch (error) {
      console.error('Failed to get documents:', error);
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
