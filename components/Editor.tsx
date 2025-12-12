import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SelectionRange } from '../types';

interface EditorProps {
  content: string;
  setContent: (text: string) => void;
  onSelectionChange: (range: SelectionRange | null) => void;
  isMagicMode: boolean;
}

const Editor: React.FC<EditorProps> = ({ content, setContent, onSelectionChange, isMagicMode }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);

    if (text.length > 0 && text.trim().length > 0) {
      onSelectionChange({ start, end, text });
    } else {
      onSelectionChange(null);
    }
  }, [onSelectionChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Clear selection menu on typing
    onSelectionChange(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-0 py-12">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        placeholder="Start writing..."
        className={`w-full bg-transparent resize-none outline-none font-serif text-xl md:text-2xl text-gray-800 leading-relaxed placeholder-gray-300 transition-all duration-300 ${
          isMagicMode ? 'border-l-4 border-indigo-100 pl-6' : 'pl-0'
        }`}
        style={{ minHeight: '60vh' }}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;