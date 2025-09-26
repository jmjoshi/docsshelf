// Simplified Database Service for Testing
// This is a mock implementation to allow app startup and testing
// Replace with full SQLite implementation later

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

// In-memory storage for testing
const mockUsers: User[] = [];
const mockAuditLogs: any[] = [];

export class DatabaseService {
  private static initialized = false;

  static async init(): Promise<void> {
    if (!this.initialized) {
      console.log('🔧 Mock Database initialized for testing');
      this.initialized = true;
    }
  }

  static async createUser(user: User): Promise<User> {
    console.log('📝 Creating user:', user.email);
    mockUsers.push(user);
    return user;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔍 Finding user by email:', email);
    return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    console.log('🔍 Finding user by ID:', id);
    return mockUsers.find(u => u.id === id) || null;
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    console.log('✏️ Updating user:', id, updates);
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
      return mockUsers[userIndex];
    }
    return null;
  }

  static async deleteUser(userId: string): Promise<void> {
    console.log('🗑️ Deleting user:', userId);
    const index = mockUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      mockUsers.splice(index, 1);
    }
  }

  static async logAudit(userId: string, action: string, details: string): Promise<void> {
    console.log('📋 Audit log:', { userId, action, details });
    mockAuditLogs.push({
      id: Date.now().toString(),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Additional methods that might be called
  static async close(): Promise<void> {
    console.log('🔒 Mock database closed');
  }

  static async getDatabase(): Promise<any> {
    console.log('📦 Getting mock database instance');
    return { mock: true };
  }

  // Mock web storage methods
  static getWebStorageItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }

  static setWebStorageItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  }

  static removeWebStorageItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  }
}