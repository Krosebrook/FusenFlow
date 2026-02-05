import { useState, useEffect, useCallback } from 'react';
import { WritingContext, Document, Snapshot } from '../types';
import { 
  getAllDocuments, 
  saveDocument, 
  getActiveDocId, 
  setActiveDocId, 
  deleteDocument,
  createSnapshot, 
  getSnapshots,
  generateId
} from '../services/storage';

interface UsePersistenceProps {
  content: string;
  writingContext: WritingContext;
  setContent: (c: string) => void;
  setWritingContext: (c: WritingContext) => void;
}

export const usePersistence = ({ 
  content, 
  writingContext, 
  setContent, 
  setWritingContext 
}: UsePersistenceProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDoc, setActiveDoc] = useState<Document | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Actions
  const switchDocument = useCallback((id: string) => {
    const docs = getAllDocuments();
    const doc = docs.find(d => d.id === id);
    if (doc) {
      setActiveDoc(doc);
      setActiveDocId(doc.id);
      setContent(doc.content);
      setWritingContext(doc.writingContext);
      setHistory(getSnapshots(doc.id));
    }
  }, [setContent, setWritingContext]);

  const createNewDocument = useCallback(() => {
    const newDoc: Document = {
      id: generateId(),
      title: 'Untitled Draft',
      content: '',
      lastModified: Date.now(),
      writingContext: { audience: '', tone: '', goal: '' }
    };
    saveDocument(newDoc);
    setDocuments(prev => [newDoc, ...prev]);
    switchDocument(newDoc.id);
    return newDoc;
  }, [switchDocument]);

  // Load initial state
  useEffect(() => {
    const docs = getAllDocuments();
    setDocuments(docs);
    
    let currentId = getActiveDocId();
    let currentDoc = docs.find(d => d.id === currentId);

    if (!currentDoc && docs.length > 0) {
      currentDoc = docs[0];
    } else if (!currentDoc && docs.length === 0) {
      createNewDocument();
      setIsLoaded(true);
      return;
    }

    if (currentDoc) {
      setActiveDocId(currentDoc.id);
      setActiveDoc(currentDoc);
      setContent(currentDoc.content);
      setWritingContext(currentDoc.writingContext);
      setHistory(getSnapshots(currentDoc.id));
    }
    
    setIsLoaded(true);
  }, []); // Initial load only

  // Debounced Save for ACTIVE document
  useEffect(() => {
    if (!isLoaded || !activeDoc) return;

    const handler = setTimeout(() => {
      const updatedDoc: Document = {
        ...activeDoc,
        content,
        writingContext,
        lastModified: Date.now(),
        title: content.split('\n')[0].substring(0, 40).trim() || 'Untitled Draft'
      };
      
      saveDocument(updatedDoc);
      setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(handler);
  }, [content, writingContext, isLoaded, activeDoc?.id]);

  const removeDocument = (id: string) => {
    deleteDocument(id);
    const remaining = documents.filter(d => d.id !== id);
    setDocuments(remaining);
    if (activeDoc?.id === id) {
      if (remaining.length > 0) {
        switchDocument(remaining[0].id);
      } else {
        createNewDocument();
      }
    }
  };

  const captureSnapshot = useCallback((label: string, trigger: Snapshot['trigger'] = 'manual') => {
    if (!activeDoc) return;
    createSnapshot(activeDoc.id, content, label, trigger);
    setHistory(getSnapshots(activeDoc.id));
  }, [content, activeDoc]);

  const restoreSnapshot = useCallback((snapshot: Snapshot) => {
    if (!activeDoc) return;
    if (history.length > 0 && history[0].content !== content) {
      createSnapshot(activeDoc.id, content, 'Backup before restore', 'auto');
    }
    setContent(snapshot.content);
    setHistory(getSnapshots(activeDoc.id));
  }, [content, history, setContent, activeDoc]);

  return {
    isLoaded,
    lastSaved,
    documents,
    activeDoc,
    history,
    createNewDocument,
    switchDocument,
    removeDocument,
    captureSnapshot,
    restoreSnapshot
  };
};