import { useState, useEffect, useRef } from 'react';
import { DocumentService } from '../services/documents';
import { Document } from '../services/database';
import { useAuth } from './useAuth';

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Prevent concurrent loads

  const loadDocuments = async () => {
    if (!user || loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const docs = await DocumentService.getDocumentsPaginated(user.id, 1, 50);
      setDocuments(docs.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    if (user && !loadingRef.current) {
      loadDocuments();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  return {
    documents,
    loading,
    error,
    loadDocuments,
  };
};
