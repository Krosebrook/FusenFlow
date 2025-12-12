import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Sparkles, PenTool, LayoutTemplate, Zap, Info } from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import FloatingMenu from './components/FloatingMenu';
import ProactivePanel from './components/ProactivePanel';
import { generateDraft, iterateSelection, analyzeText } from './services/gemini';
import { SelectionRange, Attachment, Suggestion } from './types';

const App: React.FC = () => {
  const [content, setContent] = useState('');
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMagicMode, setIsMagicMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  // Proactive AI Logic
  useEffect(() => {
    if (!isMagicMode || content.length < 50) return;

    const timeoutId = setTimeout(async () => {
      // Don't analyze if user is selecting or interacting
      if (!selection && !isGenerating) {
        // Simple optimization: only analyze if changed significantly or just pause
        // For demo, we just try to analyze the last chunk
        const result = await analyzeText(content);
        if (result) {
          setSuggestion(result);
        }
      }
    }, 3000); // Wait 3s of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, isMagicMode, selection, isGenerating]);

  const handleDraft = async (prompt: string, attachments: Attachment[]) => {
    setIsGenerating(true);
    try {
      const draft = await generateDraft(prompt, attachments);
      // Append draft to content
      setContent(prev => prev ? prev + '\n\n' + draft : draft);
    } catch (e) {
      alert("Failed to generate draft. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInlineEdit = async (instruction: string) => {
    if (!selection) return;
    setIsGenerating(true);
    try {
      const newText = await iterateSelection(selection.text, instruction, content);
      
      // Replace text
      const before = content.substring(0, selection.start);
      const after = content.substring(selection.end);
      setContent(before + newText + after);
      
      setSelection(null); // Clear selection
    } catch (e) {
      console.error(e);
      alert("Could not update text");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySuggestion = (s: Suggestion) => {
    if (s.suggestedText) {
      // Simple strategy: Append for now or try to match text. 
      // Matching exact text for replacement is hard without specific indices from AI.
      // For this demo, we will append it as a "Revision Note" if exact match fails, 
      // or if it's a generic suggestion, we might just let user copy it.
      // However, to make it "Magic", let's try to locate the last sentence if possible.
      // For safety in this demo, we will append the suggestion to the end as a drafted paragraph.
      // OR better: Just insert it at cursor? 
      // Let's just append for safety and simplicity of the 'Apply' button in this context.
      setContent(prev => prev + '\n\n' + s.suggestedText);
      setSuggestion(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col relative selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <PenTool size={18} />
          </div>
          <h1 className="text-lg font-serif font-bold text-gray-900 tracking-tight">FlowState</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMagicMode(!isMagicMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isMagicMode 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
            title="AI proactively suggests improvements while you write"
          >
            <Zap size={14} className={isMagicMode ? "fill-indigo-700" : ""} />
            {isMagicMode ? 'Magic Mode On' : 'Magic Mode Off'}
          </button>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open Magic Draft"
          >
            <LayoutTemplate size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 pb-32 flex flex-col items-center">
        <Editor 
          content={content} 
          setContent={setContent} 
          onSelectionChange={setSelection}
          isMagicMode={isMagicMode}
        />
        
        {content.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center opacity-40 pointer-events-none">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-serif text-gray-500">The canvas is yours.</p>
            <p className="text-sm text-gray-400 mt-2">Type or use the sidebar to draft with AI.</p>
          </div>
        )}
      </main>

      {/* Overlays */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onDraft={handleDraft}
        isGenerating={isGenerating}
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