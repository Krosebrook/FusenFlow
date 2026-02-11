
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SelectionRange } from '../types';

interface EditorProps {
  content: string;
  setContent: (text: string) => void;
  onSelectionChange: (range: SelectionRange | null) => void;
  isMagicMode: boolean;
}

const Editor: React.FC<EditorProps> = ({ content, setContent, onSelectionChange, isMagicMode }) => {
  const [titleInput, setTitleInput] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'font-serif text-xl md:text-2xl leading-relaxed outline-none transition-all duration-300 min-h-[60vh] text-gray-800 dark:text-gray-200',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Main writing canvas',
        'aria-placeholder': 'Start writing your masterpiece...',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      if (!empty) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        onSelectionChange({ start: from, end: to, text });
      } else {
        onSelectionChange(null);
      }
    },
  });

  // Sync external content changes (e.g. from history or switching docs)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
    // Reset overlay state when document is cleared/new
    if (!content || content === '<p></p>') {
      setTitleInput('');
      setIsDismissed(false);
    }
  }, [content, editor]);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      editor?.chain().focus().setContent(`<h1>${titleInput}</h1><p></p>`).run();
    } else {
      setIsDismissed(true);
      editor?.chain().focus().run();
    }
  };

  return (
    <div className={`relative w-full max-w-3xl mx-auto px-4 md:px-0 py-12 mb-10 transition-all duration-500 ${
      isMagicMode ? 'border-l-4 border-indigo-100 dark:border-indigo-900/50 pl-6 md:pl-10' : 'pl-0'
    }`}>
      <EditorContent editor={editor} />
      
      {editor && editor.isEmpty && !isDismissed && (
        <div 
          className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-[15vh] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm cursor-text rounded-xl transition-opacity duration-300 animate-fade-in"
          onClick={() => { setIsDismissed(true); editor.commands.focus(); }}
        >
           <div className="w-full max-w-2xl px-8 text-center space-y-6" onClick={e => e.stopPropagation()}>
              <div className="inline-block p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-2 shadow-sm">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">New Draft</h3>
                <input 
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') handleTitleSubmit(); }}
                  placeholder="Untitled Masterpiece"
                  aria-label="Enter document title"
                  className="w-full text-center text-4xl md:text-6xl font-serif font-bold bg-transparent border-none outline-none placeholder:text-gray-200 dark:placeholder:text-gray-800 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <p className="text-gray-400 text-sm">
                 Press <kbd className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-700">Enter</kbd> to begin, or click anywhere to skip
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
