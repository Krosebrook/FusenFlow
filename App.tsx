import React, { useState, useEffect } from 'react';
import { PenTool, LayoutTemplate, Zap, Sparkles, History, Menu, Moon, Sun, Loader2 } from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import ProjectSidebar from './components/ProjectSidebar';
import FloatingMenu from './components/FloatingMenu';
import ProactivePanel from './components/ProactivePanel';
import HistoryPanel from './components/HistoryPanel';
import StatusBar from './components/StatusBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEditor } from './hooks/useEditor';
import { useMagicAI } from './hooks/useMagicAI';
import { usePersistence } from './hooks/usePersistence';
import { Attachment, Suggestion, WritingContext } from './types';
import { logger } from './services/logger';

const AppContent: React.FC = () => {
  const { 
    content, 
    updateContent, 
    selection, 
    setSelection, 
    replaceSelection, 
    replaceText 
  } = useEditor();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [writingContext, setWritingContext] = useState<WritingContext>({
    audience: '',
    tone: '',
    goal: ''
  });

  const { 
    isLoaded, 
    lastSaved, 
    history, 
    documents,
    activeDoc,
    captureSnapshot, 
    restoreSnapshot,
    createNewDocument,
    switchDocument,
    removeDocument
  } = usePersistence({
    content,
    writingContext,
    setContent: updateContent,
    setWritingContext
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem('flowstate_theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    logger.info("Application initialized");
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('flowstate_theme', newMode ? 'dark' : 'light');
  };

  const { 
    isGenerating, 
    suggestion, 
    setSuggestion, 
    draftContent, 
    refineSelection,
    refineGoal 
  } = useMagicAI({ content, isMagicMode, selection, writingContext });

  const handleDraft = async (prompt: string, attachments: Attachment[]) => {
    try {
      captureSnapshot(`Before Draft: "${prompt.substring(0, 20)}..."`, 'ai-pre-flight');
      const draft = await draftContent(prompt, attachments);
      updateContent(content ? content + '\n\n' + draft : draft);
    } catch (e) {
      logger.error("Drafting failed", { error: e });
    }
  };

  const handleInlineEdit = async (instruction: string) => {
    if (!selection) return;
    try {
      captureSnapshot(`Before Inline Edit: "${instruction}"`, 'ai-pre-flight');
      const newText = await refineSelection(selection, instruction);
      replaceSelection(newText);
    } catch (e) {
      logger.error("Inline edit failed", { error: e });
    }
  };

  const handleApplySuggestion = (s: Suggestion) => {
    captureSnapshot(`Before Suggestion: ${s.type}`, 'ai-pre-flight');
    const success = replaceText(s.originalText, s.suggestedText);
    if (success) {
      setSuggestion(null);
    } else {
      logger.warn("Failed to apply suggestion - text changed");
      alert("Text has changed. Suggestion no longer matches.");
      setSuggestion(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCF8] dark:bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <PenTool size={24} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-serif italic">Entering FlowState...</p>
          <Loader2 className="animate-spin text-indigo-500" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${
      isDarkMode ? 'bg-[#1a1a1a] text-gray-200' : 'bg-[#FDFCF8] text-gray-900'
    }`}>
      
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-30 flex items-center justify-between px-4 md:px-8 transition-all">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProjectSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg lg:hidden">
            <Menu size={20} />
          </button>
          
          <button onClick={() => setIsProjectSidebarOpen(!isProjectSidebarOpen)} className="hidden lg:flex items-center gap-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
               <PenTool size={18} />
             </div>
             <h1 className="text-lg font-serif font-bold tracking-tight">FlowState</h1>
          </button>

          <span className="text-xs text-gray-300 dark:text-gray-600 ml-2 font-mono hidden md:block">
            {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

          <button 
            onClick={() => setIsMagicMode(!isMagicMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isMagicMode 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Zap size={14} className={isMagicMode ? "fill-indigo-700 dark:fill-indigo-300" : ""} />
            <span className="hidden sm:inline">{isMagicMode ? 'Coach Active' : 'Coach Off'}</span>
          </button>

          <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <History size={20} />
            {history.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-gray-900"></span>}
          </button>

          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <LayoutTemplate size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 pt-20 pb-8 flex flex-col items-center relative overflow-y-auto">
        <Editor content={content} setContent={updateContent} onSelectionChange={setSelection} isMagicMode={isMagicMode} />
        {content.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center opacity-40 pointer-events-none select-none">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-xl font-serif text-gray-500 dark:text-gray-400">The canvas is yours.</p>
          </div>
        )}
      </main>

      <StatusBar content={content} title={activeDoc?.title || 'Draft'} />

      <ProjectSidebar isOpen={isProjectSidebarOpen} onClose={() => setIsProjectSidebarOpen(false)} documents={documents} activeDocId={activeDoc?.id} onSwitch={switchDocument} onCreate={createNewDocument} onDelete={removeDocument} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onDraft={handleDraft} isGenerating={isGenerating} writingContext={writingContext} setWritingContext={setWritingContext} onRefineGoal={refineGoal} />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onRestore={restoreSnapshot} />

      {selection && <FloatingMenu selection={selection} onClose={() => setSelection(null)} onSubmit={handleInlineEdit} isLoading={isGenerating} />}
      {isMagicMode && suggestion && !selection && <ProactivePanel suggestion={suggestion} onApply={handleApplySuggestion} onDismiss={() => setSuggestion(null)} />}
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;