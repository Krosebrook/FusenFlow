
import React, { useEffect } from 'react';
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
  }, [content, editor]);

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 md:px-0 py-12 mb-10 transition-all duration-500 ${
      isMagicMode ? 'border-l-4 border-indigo-100 dark:border-indigo-900/50 pl-6 md:pl-10' : 'pl-0'
    }`}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
