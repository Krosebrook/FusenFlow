
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
import { Attachment, Suggestion, WritingContext, ChatMessage, ExpertPrompt } from './types';
import { logger } from './services/logger';

const AppContent = () => {
  const { content, updateContent, selection, setSelection, replaceSelection, replaceText } = useEditor();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProjectSidebarOpen, setIsProjectSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [writingContext, setWritingContext] = useState<WritingContext>({ audience: '', tone: '', goal: '' });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [experts, setExperts] = useState<ExpertPrompt[]>([]);

  const { 
    isLoaded, lastSaved, history, documents, activeDoc, captureSnapshot, restoreSnapshot, 
    createNewDocument, switchDocument, removeDocument 
  } = usePersistence({ content, writingContext, chatHistory, experts, setContent: updateContent, setWritingContext, setChatHistory, setExperts });

  const { 
    isGenerating, suggestion, setSuggestion, draftContent, refineSelection, refineGoal, sendMessage, clearChat, activeExpert, setActiveExpert 
  } = useMagicAI({ content, isMagicMode, selection, writingContext, initialChatHistory: chatHistory, onChatUpdate: setChatHistory });

  useEffect(() => {
    // Check local storage or system preference on mount
    const stored = localStorage.getItem('flowstate_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (stored === 'dark' || (!stored && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flowstate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flowstate_theme', 'light');
    }
  };

  const handleDraft = async (prompt: string, attachments: Attachment[], tools: any) => {
    try {
      captureSnapshot(`AI Draft: ${prompt.substring(0, 15)}`, 'ai-pre-flight');
      const draft = await draftContent(prompt, attachments, tools);
      updateContent(content ? content + '\n\n' + draft : draft);
    } catch (e) { logger.error("Drafting error", { e }); }
  };

  const handleCreateDocument = (initialContent: string = '', title?: string) => {
    const newDoc = createNewDocument();
    if (initialContent) {
      updateContent(initialContent);
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-[#FDFCF8] dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-200">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-30 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsProjectSidebarOpen(true)} className="p-2 lg:hidden text-gray-500 dark:text-gray-400"><Menu size={20} /></button>
          <div className="hidden lg:flex items-center gap-2 text-indigo-600 font-serif font-bold">
            <PenTool size={18} /> FlowState
          </div>
          <span className="text-xs text-gray-300 dark:text-gray-600 ml-2 font-mono hidden md:block">{lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}</span>
        </div>
        <nav className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" aria-label="Toggle theme">
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={() => setIsMagicMode(!isMagicMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isMagicMode ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 border-gray-100'}`}><Zap size={14} /> Partner Mode</button>
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 text-gray-400 relative"><History size={20} />{history.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />}</button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400"><LayoutTemplate size={20} /></button>
        </nav>
      </header>

      <main className="flex-1 pt-20 pb-8 flex flex-col items-center overflow-y-auto">
        <Editor content={content} setContent={updateContent} onSelectionChange={setSelection} isMagicMode={isMagicMode} />
        {content.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center opacity-40 pointer-events-none select-none">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-xl font-serif text-gray-500 dark:text-gray-400">The canvas is yours.</p>
          </div>
        )}
      </main>

      <StatusBar content={content} title={activeDoc?.title || 'Draft'} />
      <ProjectSidebar isOpen={isProjectSidebarOpen} onClose={() => setIsProjectSidebarOpen(false)} documents={documents} activeDocId={activeDoc?.id} onSwitch={switchDocument} onCreate={handleCreateDocument} onDelete={removeDocument} />
      <Sidebar 
        isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onDraft={handleDraft} isGenerating={isGenerating} 
        writingContext={writingContext} setWritingContext={setWritingContext} onRefineGoal={refineGoal} 
        chatHistory={chatHistory} onSendMessage={sendMessage} onClearChat={clearChat} experts={experts} 
        setExperts={setExperts} activeExpert={activeExpert} setActiveExpert={setActiveExpert} docContent={content}
      />
      <HistoryPanel 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history} 
        onRestore={restoreSnapshot}
        onSnapshot={(label) => captureSnapshot(label, 'manual')}
      />
      {selection && <FloatingMenu selection={selection} onClose={() => setSelection(null)} onSubmit={async (inst) => { captureSnapshot(inst, 'ai-pre-flight'); replaceSelection(await refineSelection(selection, inst)); }} isLoading={isGenerating} />}
      {isMagicMode && suggestion && !selection && <ProactivePanel suggestion={suggestion} onApply={s => replaceText(s.originalText, s.suggestedText)} onDismiss={() => setSuggestion(null)} />}
    </div>
  );
};

const App = () => (<ErrorBoundary><AppContent /></ErrorBoundary>);
export default App;
