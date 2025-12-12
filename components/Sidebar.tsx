import React, { useState, useRef } from 'react';
import { Attachment, WritingContext, GoalSuggestion } from '../types';
import { MessageSquare, Paperclip, Send, X, FileText, Image as ImageIcon, Sparkles, Settings, Target, Wand2, ArrowRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDraft: (prompt: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
  writingContext: WritingContext;
  setWritingContext: (ctx: WritingContext) => void;
  onRefineGoal: (goal: string) => Promise<GoalSuggestion[]>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onDraft, 
  isGenerating,
  writingContext,
  setWritingContext,
  onRefineGoal
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [isRefiningGoal, setIsRefiningGoal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (prompt.trim() && !isGenerating) {
      onDraft(prompt, attachments);
      setPrompt('');
      setAttachments([]);
      onClose();
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
        />
      )}
      
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} />
            Assistant
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Context Settings */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm uppercase tracking-wide">
               <Settings size={14} />
               Writing Settings
            </div>
            <div className="space-y-3">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-500">Target Audience</label>
                 <input 
                    type="text" 
                    value={writingContext.audience}
                    onChange={(e) => updateContext('audience', e.target.value)}
                    placeholder="e.g. Investors, Tech Enthusiasts"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-gray-500">Desired Tone</label>
                 <input 
                    type="text" 
                    value={writingContext.tone}
                    onChange={(e) => updateContext('tone', e.target.value)}
                    placeholder="e.g. Professional, Witty, Casual"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-medium text-gray-500">Primary Goal</label>
                 <div className="relative">
                   <input 
                      type="text" 
                      value={writingContext.goal}
                      onChange={(e) => updateContext('goal', e.target.value)}
                      placeholder="e.g. Persuade, Inform, Entertain"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                   />
                   <button 
                     onClick={handleRefineGoal}
                     disabled={!writingContext.goal.trim() || isRefiningGoal}
                     className={`absolute right-1 top-1 bottom-1 px-2 rounded-md transition-all ${
                       writingContext.goal.trim() 
                         ? 'text-indigo-500 hover:bg-indigo-50' 
                         : 'text-gray-300'
                     }`}
                     title="Suggest more specific goals"
                   >
                     <Wand2 size={16} className={isRefiningGoal ? 'animate-pulse' : ''} />
                   </button>
                 </div>
                 
                 {/* Goal Suggestions List */}
                 {goalSuggestions.length > 0 && (
                   <div className="mt-3 space-y-2 animate-fade-in">
                     <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suggestions</p>
                     {goalSuggestions.map((suggestion, idx) => (
                       <div 
                         key={idx}
                         onClick={() => applyGoal(suggestion)}
                         className="group bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm"
                       >
                         <div className="flex items-start gap-2">
                           <div className="flex-1">
                             <p className="text-sm font-medium text-indigo-900 mb-1 group-hover:text-indigo-700">
                               {suggestion.text}
                             </p>
                             <p className="text-xs text-gray-500 leading-relaxed">
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

          <div className="border-t border-gray-100"></div>

          {/* Drafting Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-medium text-sm uppercase tracking-wide">
               <Target size={14} />
               Magic Draft
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-900 leading-relaxed">
               Describe what you want to write. Attach notes or files to give the AI more context.
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachments</label>
                <div className="grid grid-cols-1 gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 relative group">
                      <div className="p-2 bg-white rounded-md border border-gray-200 text-gray-500">
                        {file.type.includes('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400 uppercase">{file.type.split('/')[1]}</p>
                      </div>
                      <button 
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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

        <div className="p-6 bg-white border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Draft request..."
              className="w-full h-24 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
            />
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Add attachment"
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

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  !prompt.trim() || isGenerating
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
                }`}
              >
                {isGenerating ? 'Drafting...' : 'Generate'}
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