import React, { useState } from 'react';
import { PenTool, LayoutTemplate, Zap, Sparkles } from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import FloatingMenu from './components/FloatingMenu';
import ProactivePanel from './components/ProactivePanel';
import { useEditor } from './hooks/useEditor';
import { useMagicAI } from './hooks/useMagicAI';
import { Attachment, Suggestion, WritingContext } from './types';

const App: React.FC = () => {
  const { 
    content, 
    updateContent, 
    selection, 
    setSelection, 
    replaceSelection, 
    replaceText 
  } = useEditor();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(false);
  
  // New State for Writing Context
  const [writingContext, setWritingContext] = useState<WritingContext>({
    audience: '',
    tone: '',
    goal: ''
  });

  const { 
    isGenerating, 
    suggestion, 
    setSuggestion, 
    draftContent, 
    refineSelection,
    refineGoal 
  } = useMagicAI({ content, isMagicMode, selection, writingContext });

  const handleDraft = async (prompt: string, attachments: Attachment[]) => {
    const draft = await draftContent(prompt, attachments);
    updateContent(content ? content + '\n\n' + draft : draft);
  };

  const handleInlineEdit = async (instruction: string) => {
    if (!selection) return;
    const newText = await refineSelection(selection, instruction);
    replaceSelection(newText);
  };

  const handleApplySuggestion = (s: Suggestion) => {
    const success = replaceText(s.originalText, s.suggestedText);
    if (success) {
      setSuggestion(null);
    } else {
      alert("Could not find the original text. It might have changed.");
      setSuggestion(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col relative selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 flex items-center justify-between px-4 md:px-8 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <PenTool size={18} />
          </div>
          <h1 className="text-lg font-serif font-bold text-gray-900 tracking-tight">FlowState</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMagicMode(!isMagicMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isMagicMode 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner' 
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <Zap size={14} className={isMagicMode ? "fill-indigo-700" : ""} />
            {isMagicMode ? 'Coach Active' : 'Coach Off'}
          </button>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LayoutTemplate size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-32 flex flex-col items-center">
        <Editor 
          content={content} 
          setContent={updateContent} 
          onSelectionChange={setSelection}
          isMagicMode={isMagicMode}
        />
        
        {content.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center opacity-40 pointer-events-none select-none">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-serif text-gray-500">The canvas is yours.</p>
            <p className="text-sm text-gray-400 mt-2">Type or open the sidebar to setup your project.</p>
          </div>
        )}
      </main>

      {/* Overlays */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onDraft={handleDraft}
        isGenerating={isGenerating}
        writingContext={writingContext}
        setWritingContext={setWritingContext}
        onRefineGoal={refineGoal}
      />

      {selection && (
        <FloatingMenu 
          selection={selection} 
          onClose={() => setSelection(null)}
          onSubmit={handleInlineEdit}
          isLoading={isGenerating}
        />
      )}

      {isMagicMode && suggestion && !selection && (
        <ProactivePanel 
          suggestion={suggestion}
          onApply={handleApplySuggestion}
          onDismiss={() => setSuggestion(null)}
        />
      )}
      
    </div>
  );
};

export default App;