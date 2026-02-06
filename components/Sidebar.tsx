
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, WritingContext, GoalSuggestion, ChatMessage } from '../types';
import { MessageSquare, Paperclip, Send, X, FileText, Image as ImageIcon, Sparkles, Settings, Target, Wand2, ArrowRight, User, Bot } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDraft: (prompt: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
  writingContext: WritingContext;
  setWritingContext: (ctx: WritingContext) => void;
  onRefineGoal: (goal: string) => Promise<GoalSuggestion[]>;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onDraft, 
  isGenerating,
  writingContext,
  setWritingContext,
  onRefineGoal,
  chatHistory,
  onSendMessage,
  onClearChat
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'chat'>('draft');
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [isRefiningGoal, setIsRefiningGoal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64String = (event.target.result as string).split(',')[1];
          setAttachments(prev => [...prev, {
            name: file.name,
            type: file.type,
            data: base64String
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    if (activeTab === 'draft') {
      onDraft(prompt, attachments);
      setPrompt('');
      setAttachments([]);
      if (window.innerWidth < 1024) onClose(); // Auto-close on mobile after draft
    } else {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const updateContext = (field: keyof WritingContext, value: string) => {
    setWritingContext({ ...writingContext, [field]: value });
  };

  const handleRefineGoal = async () => {
    if (!writingContext.goal.trim() || isRefiningGoal) return;
    setIsRefiningGoal(true);
    setGoalSuggestions([]);
    
    const suggestions = await onRefineGoal(writingContext.goal);
    setGoalSuggestions(suggestions);
    setIsRefiningGoal(false);
  };

  const applyGoal = (suggestion: GoalSuggestion) => {
    setWritingContext({ ...writingContext, goal: suggestion.text });
    setGoalSuggestions([]);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 sm:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <div 
        role="dialog"
        aria-label="Assistant Sidebar"
        aria-modal="true"
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-100 dark:border-gray-800 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'draft'}
              aria-controls="draft-panel"
              onClick={() => setActiveTab('draft')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'draft' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-300' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Magic Draft
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="chat-panel"
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'chat' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-300' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Chat
            </button>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {activeTab === 'draft' ? (
          <div id="draft-panel" role="tabpanel" className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Context Settings */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-medium text-sm uppercase tracking-wide">
                 <Settings size={14} />
                 Writing Settings
              </div>
              <div className="space-y-3">
                 <div className="space-y-1">
                   <label htmlFor="audience" className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Audience</label>
                   <input 
                      id="audience"
                      type="text" 
                      value={writingContext.audience}
                      onChange={(e) => updateContext('audience', e.target.value)}
                      placeholder="e.g. Investors, Tech Enthusiasts"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none"
                   />
                 </div>
                 <div className="space-y-1">
                   <label htmlFor="tone" className="text-xs font-medium text-gray-500 dark:text-gray-400">Desired Tone</label>
                   <input 
                      id="tone"
                      type="text" 
                      value={writingContext.tone}
                      onChange={(e) => updateContext('tone', e.target.value)}
                      placeholder="e.g. Professional, Witty, Casual"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none"
                   />
                 </div>
                 <div className="space-y-2">
                   <label htmlFor="goal" className="text-xs font-medium text-gray-500 dark:text-gray-400">Primary Goal</label>
                   <div className="relative">
                     <input 
                        id="goal"
                        type="text" 
                        value={writingContext.goal}
                        onChange={(e) => updateContext('goal', e.target.value)}
                        placeholder="e.g. Persuade, Inform, Entertain"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none"
                     />
                     <button 
                       onClick={handleRefineGoal}
                       disabled={!writingContext.goal.trim() || isRefiningGoal}
                       className={`absolute right-1 top-1 bottom-1 px-2 rounded-md transition-all ${
                         writingContext.goal.trim() 
                           ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' 
                           : 'text-gray-300 dark:text-gray-600'
                       }`}
                       title="Suggest more specific goals"
                       aria-label="Refine goal"
                     >
                       <Wand2 size={16} className={isRefiningGoal ? 'animate-pulse' : ''} />
                     </button>
                   </div>
                   
                   {goalSuggestions.length > 0 && (
                     <div className="mt-3 space-y-2 animate-fade-in" role="list">
                       <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggestions</p>
                       {goalSuggestions.map((suggestion, idx) => (
                         <div 
                           key={idx}
                           onClick={() => applyGoal(suggestion)}
                           className="group bg-indigo-50/50 dark:bg-indigo-900/10 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm"
                           role="listitem"
                         >
                           <div className="flex items-start gap-2">
                             <div className="flex-1">
                               <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300 mb-1 group-hover:text-indigo-700 dark:group-hover:text-indigo-200">
                                 {suggestion.text}
                               </p>
                               <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                 {suggestion.explanation}
                               </p>
                             </div>
                             <ArrowRight size={14} className="text-indigo-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
              </div>
            </section>

            <div className="border-t border-gray-100 dark:border-gray-800"></div>

            {/* Drafting Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-medium text-sm uppercase tracking-wide">
                 <Target size={14} />
                 Magic Draft
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                 Describe what you want to write. Attach notes or files to give the AI more context.
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attachments</label>
                  <div className="grid grid-cols-1 gap-2" role="list">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 relative group">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300">
                          {file.type.includes('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                          <p className="text-xs text-gray-400 uppercase">{file.type.split('/')[1]}</p>
                        </div>
                        <button 
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove attachment ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div id="chat-panel" role="tabpanel" className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Start a conversation.</p>
                  <p className="text-xs">I can help with brainstorming, grammar, outlining, and more.</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'draft' ? "Describe your draft..." : "Ask me anything..."}
              className="w-full h-20 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm text-gray-800 dark:text-gray-200"
              aria-label={activeTab === 'draft' ? "Draft Prompt" : "Chat Message"}
            />
            
            <div className="flex items-center justify-between">
              {activeTab === 'draft' ? (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Add attachment"
                    aria-label="Attach File"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".txt,.md,.png,.jpg,.jpeg" 
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClearChat}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear Chat
                </button>
              )}

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  !prompt.trim() || isGenerating
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                }`}
                aria-label={isGenerating ? "Processing" : "Send"}
              >
                {isGenerating ? 'Thinking...' : 'Send'}
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
