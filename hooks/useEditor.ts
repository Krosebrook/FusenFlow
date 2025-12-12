import { useState, useCallback } from 'react';
import { SelectionRange } from '../types';

export const useEditor = () => {
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState<SelectionRange | null>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const replaceSelection = useCallback((newText: string) => {
    if (!selection) return;
    
    const before = content.substring(0, selection.start);
    const after = content.substring(selection.end);
    setContent(before + newText + after);
    setSelection(null);
  }, [content, selection]);

  const replaceText = useCallback((original: string, replacement: string) => {
    // Find the text. Note: This replaces the first occurrence. 
    // A more robust production version would use indices returned by AI if available,
    // or handle multiple occurrences.
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