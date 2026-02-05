
import { useState, useCallback } from 'react';
import { SelectionRange } from '../types';

export const useEditor = () => {
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState<SelectionRange | null>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const replaceSelection = useCallback((newText: string) => {
    // Note: With Tiptap, complex replacements are usually handled via editor commands,
    // but for the persistence layer, we still maintain a top-level HTML string.
    // In this MVP, we treat the incoming refined text as plain text or HTML.
    // The Editor component will handle syncing this back to the Tiptap instance.
    setContent(newText); // Simplified for Tiptap sync
    setSelection(null);
  }, []);

  const replaceText = useCallback((original: string, replacement: string) => {
    // Strip simple HTML tags for comparison if needed, or rely on Tiptap's internal structure.
    // Here we perform a simple string replacement on the HTML content.
    if (content.includes(original)) {
      setContent(prev => prev.replace(original, replacement));
      return true;
    }
    return false;
  }, [content]);

  return {
    content,
    selection,
    setSelection,
    updateContent,
    replaceSelection,
    replaceText
  };
};
