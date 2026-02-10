import { WritingContext, Document, Snapshot } from "../types";

// Re-export Snapshot for compatibility
export type { Snapshot };

const STORAGE_KEY_DOCUMENTS = 'flowstate_documents_v1';
const STORAGE_KEY_SESSION_OLD = 'flowstate_session_v1'; // Migration source
const STORAGE_KEY_ACTIVE_DOC = 'flowstate_active_doc_id';
const MAX_SNAPSHOTS = 50;

// Polyfill-like fallback for randomUUID
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// --- Documents ---

export const getAllDocuments = (): Document[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
    if (!raw) {
      // MIGRATION CHECK: If no new docs, check for old session
      const oldSession = localStorage.getItem(STORAGE_KEY_SESSION_OLD);
      if (oldSession) {
        try {
          const parsedOld = JSON.parse(oldSession);
          // Fix: Adding missing chatHistory and experts properties to Document in the migration object
          const migratedDoc: Document = {
            id: generateId(),
            title: 'Migrated Draft',
            content: parsedOld.content || '',
            lastModified: parsedOld.lastModified || Date.now(),
            writingContext: parsedOld.writingContext || { audience: '', tone: '', goal: '' },
            chatHistory: [],
            experts: []
          };
          saveDocument(migratedDoc);
          return [migratedDoc];
        } catch (e) {
          return [];
        }
      }
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load documents", e);
    return [];
  }
};

export const saveDocument = (doc: Document) => {
  try {
    const docs = getAllDocuments();
    const index = docs.findIndex(d => d.id === doc.id);
    
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.unshift(doc);
    }
    
    localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
  } catch (e) {
    console.error("Failed to save document", e);
  }
};

export const deleteDocument = (id: string) => {
  const docs = getAllDocuments().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(docs));
  // Clean up history for this doc
  localStorage.removeItem(`flowstate_history_${id}`);
};

export const getActiveDocId = (): string | null => {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_DOC);
};

export const setActiveDocId = (id: string) => {
  localStorage.setItem(STORAGE_KEY_ACTIVE_DOC, id);
};

// --- History (Scoped by Doc ID) ---

export const createSnapshot = (docId: string, content: string, label: string, trigger: Snapshot['trigger']) => {
  if (!docId) return;
  try {
    if (!content.trim()) return;

    const key = `flowstate_history_${docId}`;
    const newSnapshot: Snapshot = {
      id: generateId(),
      timestamp: Date.now(),
      content,
      label,
      trigger
    };

    const history = getSnapshots(docId);
    
    // Dedup
    if (history.length > 0 && history[0].content === content) {
      return; 
    }

    const updatedHistory = [newSnapshot, ...history].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(key, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to create snapshot", e);
  }
};

export const getSnapshots = (docId: string): Snapshot[] => {
  if (!docId) return [];
  try {
    const key = `flowstate_history_${docId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export { generateId };