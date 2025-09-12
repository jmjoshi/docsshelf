// Web-compatible database service using IndexedDB

// Import types from main database service
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

export interface Document {
  id: string;
  userId: string;
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  category?: string;
  folder?: string;
  tags: string[];
  ocrText?: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// Simple localStorage-based implementation for web
class WebDatabaseService {
  private storagePrefix = 'docsshelf_db_';

  async initDatabase(): Promise<void> {
    // Initialize localStorage structure if needed
    if (!localStorage.getItem(`${this.storagePrefix}initialized`)) {
      localStorage.setItem(`${this.storagePrefix}initialized`, 'true');
      localStorage.setItem(`${this.storagePrefix}users`, JSON.stringify([]));
      localStorage.setItem(
        `${this.storagePrefix}documents`,
        JSON.stringify([])
      );
      localStorage.setItem(
        `${this.storagePrefix}audit_logs`,
        JSON.stringify([])
      );
    }
  }

  // User operations
  async createUser(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const users = this.getUsers();
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(`${this.storagePrefix}users`, JSON.stringify(users));
    return newUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    const users = this.getUsers();
    return users.find((u) => u.id === userId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.getUsers();
    return users.find((u) => u.email === email) || null;
  }

  private getUsers(): User[] {
    const usersJson = localStorage.getItem(`${this.storagePrefix}users`);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Document operations
  async createDocument(
    userId: string,
    name: string,
    path: string,
    size: number,
    mimeType?: string,
    category?: string,
    folder?: string,
    tags: string[] = [],
    ocrText?: string
  ): Promise<Document> {
    const documents = this.getDocuments();
    const newDoc: Document = {
      id: Date.now().toString(),
      userId,
      name,
      path,
      size,
      mimeType,
      category,
      folder,
      tags,
      ocrText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    documents.push(newDoc);
    localStorage.setItem(
      `${this.storagePrefix}documents`,
      JSON.stringify(documents)
    );
    return newDoc;
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    const documents = this.getDocuments();
    return documents.filter((doc) => doc.userId === userId);
  }

  async getDocumentsByUserPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ documents: Document[]; totalCount: number; hasMore: boolean }> {
    const allDocuments = await this.getDocumentsByUser(userId);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const documents = allDocuments.slice(startIndex, endIndex);

    return {
      documents,
      totalCount: allDocuments.length,
      hasMore: endIndex < allDocuments.length,
    };
  }

  private getDocuments(): Document[] {
    const docsJson = localStorage.getItem(`${this.storagePrefix}documents`);
    return docsJson ? JSON.parse(docsJson) : [];
  }

  async deleteDocument(documentId: string): Promise<void> {
    const documents = this.getDocuments();
    const filtered = documents.filter((doc) => doc.id !== documentId);
    localStorage.setItem(
      `${this.storagePrefix}documents`,
      JSON.stringify(filtered)
    );
  }

  async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<Document> {
    const documents = this.getDocuments();
    const index = documents.findIndex((doc) => doc.id === documentId);
    if (index === -1) {
      throw new Error('Document not found');
    }
    documents[index] = {
      ...documents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      `${this.storagePrefix}documents`,
      JSON.stringify(documents)
    );
    return documents[index];
  }

  // Search operations
  async searchDocuments(userId: string, query: string): Promise<Document[]> {
    const documents = await this.getDocumentsByUser(userId);
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(lowercaseQuery) ||
        (doc.ocrText && doc.ocrText.toLowerCase().includes(lowercaseQuery)) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const webDatabaseService = new WebDatabaseService();
