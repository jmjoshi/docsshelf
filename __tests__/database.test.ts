/// <reference types="jest" />

// Unit tests for DatabaseService
import { DatabaseService } from '../src/services/database';

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage');

describe('DatabaseService', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      executeSql: jest.fn(),
      close: jest.fn(),
    };
    (DatabaseService as any).db = mockDb;
  });

  afterEach(() => {
    (DatabaseService as any).db = null;
  });

  describe('initDatabase', () => {
    it('should initialize database successfully', async () => {
      const mockOpenDatabase = jest.fn().mockReturnValue(mockDb);
      (
        require('react-native-sqlite-storage').openDatabase as jest.Mock
      ).mockImplementation(mockOpenDatabase);

      // Mock successful migration
      mockDb.executeSql.mockImplementation((query: string) => {
        if (query.includes('CREATE TABLE')) {
          return Promise.resolve([{ rows: { length: 0 } }]);
        }
        if (query.includes('migrations')) {
          return Promise.resolve([
            { rows: { item: () => ({ currentVersion: 0 }) } },
          ]);
        }
        return Promise.resolve([]);
      });

      await DatabaseService.initDatabase();

      expect(
        require('react-native-sqlite-storage').openDatabase
      ).toHaveBeenCalledWith({
        name: 'DocsShelf.db',
        location: 'default',
      });
      expect(mockDb.executeSql).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumbers: [{ type: 'mobile', number: '1234567890' }],
        passwordHash: 'hashedPassword',
        salt: 'salt123',
      };

      mockDb.executeSql.mockResolvedValue([]);

      const result = await DatabaseService.createUser(userData);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.any(Array)
      );
      expect(result).toMatchObject({
        ...userData,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumbers: '[{"type":"mobile","number":"1234567890"}]',
        passwordHash: 'hash',
        salt: 'salt',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      mockDb.executeSql.mockResolvedValue([
        {
          rows: {
            length: 1,
            item: () => mockUser,
          },
        },
      ]);

      const result = await DatabaseService.getUserByEmail('test@example.com');

      expect(result).toEqual({
        ...mockUser,
        phoneNumbers: [{ type: 'mobile', number: '1234567890' }],
      });
    });

    it('should return null when user not found', async () => {
      mockDb.executeSql.mockResolvedValue([
        {
          rows: { length: 0 },
        },
      ]);

      const result = await DatabaseService.getUserByEmail(
        'nonexistent@example.com'
      );

      expect(result).toBe(null);
    });
  });

  describe('saveDocumentMetadata', () => {
    it('should save document metadata successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      const result = await DatabaseService.saveDocumentMetadata(
        'user123',
        'test.pdf',
        '/path/to/test.pdf',
        1024,
        'application/pdf',
        'Work',
        'Projects',
        ['tag1', 'tag2'],
        'OCR text content'
      );

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO documents'),
        expect.any(Array)
      );
      expect(typeof result).toBe('string');
    });
  });

  describe('getDocumentsByUser', () => {
    it('should return user documents', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          userId: 'user123',
          name: 'doc1.pdf',
          path: '/path/doc1.pdf',
          size: 1024,
          mimeType: 'application/pdf',
          category: 'Work',
          folder: 'Projects',
          tags: '["tag1","tag2"]',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
          isSynced: 0,
        },
      ];

      mockDb.executeSql.mockResolvedValue([
        {
          rows: {
            length: 1,
            item: (index: number) => mockDocs[index],
          },
        },
      ]);

      const result = await DatabaseService.getDocumentsByUser('user123');

      expect(result).toEqual([
        {
          ...mockDocs[0],
          tags: ['tag1', 'tag2'],
          isSynced: false,
        },
      ]);
    });
  });

  describe('getDocumentsByUserPaginated', () => {
    it('should return paginated documents', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          userId: 'user123',
          name: 'doc1.pdf',
          tags: '[]',
          isSynced: 0,
        },
      ];

      mockDb.executeSql
        .mockResolvedValueOnce([{ rows: { item: () => ({ total: 25 }) } }]) // Count query
        .mockResolvedValueOnce([
          { rows: { length: 1, item: () => mockDocs[0] } },
        ]); // Data query

      const result = await DatabaseService.getDocumentsByUserPaginated(
        'user123',
        1,
        10
      );

      expect(result).toEqual({
        documents: [
          {
            ...mockDocs[0],
            tags: [],
            isSynced: false,
          },
        ],
        totalCount: 25,
        hasMore: true,
      });
    });
  });

  describe('searchDocumentsPaginated', () => {
    it('should search documents with pagination', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          name: 'work_report.pdf',
          tags: '[]',
          isSynced: 0,
        },
      ];

      mockDb.executeSql
        .mockResolvedValueOnce([{ rows: { item: () => ({ total: 5 }) } }])
        .mockResolvedValueOnce([
          { rows: { length: 1, item: () => mockDocs[0] } },
        ]);

      const result = await DatabaseService.searchDocumentsPaginated(
        'user123',
        'work',
        1,
        10
      );

      expect(result).toEqual({
        documents: [
          {
            ...mockDocs[0],
            tags: [],
            isSynced: false,
          },
        ],
        totalCount: 5,
        hasMore: true,
      });
    });
  });

  describe('updateDocument', () => {
    it('should update document successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      await DatabaseService.updateDocument('doc123', {
        name: 'updated.pdf',
        category: 'Updated',
      });

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE documents SET'),
        expect.any(Array)
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      await DatabaseService.deleteDocument('doc123', 'user123');

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        'DELETE FROM documents WHERE id = ?',
        ['doc123']
      );
    });
  });

  describe('logAudit', () => {
    it('should log audit entry successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      await DatabaseService.logAudit('user123', 'TEST_ACTION', 'Test details');

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs', async () => {
      const mockLogs = [
        {
          id: 'log1',
          userId: 'user123',
          action: 'LOGIN_SUCCESS',
          details: 'User logged in',
          timestamp: '2023-01-01T00:00:00.000Z',
          ipAddress: null,
        },
      ];

      mockDb.executeSql.mockResolvedValue([
        {
          rows: {
            length: 1,
            item: () => mockLogs[0],
          },
        },
      ]);

      const result = await DatabaseService.getAuditLogs('user123', 10);

      expect(result).toEqual(mockLogs);
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      const result = await DatabaseService.createCategory({
        userId: 'user123',
        name: 'New Category',
        color: '#FF0000',
      });

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.any(Array)
      );
      expect(typeof result).toBe('string');
    });
  });

  describe('getCategoriesByUser', () => {
    it('should return user categories', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Work',
          color: '#FF0000',
          userId: 'user123',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockDb.executeSql.mockResolvedValue([
        {
          rows: {
            length: 1,
            item: () => mockCategories[0],
          },
        },
      ]);

      const result = await DatabaseService.getCategoriesByUser('user123');

      expect(result).toEqual(mockCategories);
    });
  });

  describe('bulkInsertDocuments', () => {
    it('should bulk insert documents successfully', async () => {
      const documents = [
        { name: 'doc1.pdf', path: '/path/doc1.pdf', size: 1024, tags: [] },
        {
          name: 'doc2.pdf',
          path: '/path/doc2.pdf',
          size: 2048,
          tags: ['test'],
        },
      ];

      mockDb.executeSql
        .mockResolvedValueOnce([]) // BEGIN TRANSACTION
        .mockResolvedValueOnce([]) // First insert
        .mockResolvedValueOnce([]) // Second insert
        .mockResolvedValueOnce([]); // COMMIT

      const result = await DatabaseService.bulkInsertDocuments(
        'user123',
        documents
      );

      expect(result).toHaveLength(2);
      expect(mockDb.executeSql).toHaveBeenCalledWith('BEGIN TRANSACTION');
      expect(mockDb.executeSql).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback on error', async () => {
      const documents = [
        { name: 'doc1.pdf', path: '/path/doc1.pdf', size: 1024, tags: [] },
      ];

      mockDb.executeSql
        .mockResolvedValueOnce([]) // BEGIN TRANSACTION
        .mockRejectedValueOnce(new Error('Insert failed')) // Insert fails
        .mockResolvedValueOnce([]); // ROLLBACK

      await expect(
        DatabaseService.bulkInsertDocuments('user123', documents)
      ).rejects.toThrow('Insert failed');

      expect(mockDb.executeSql).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
