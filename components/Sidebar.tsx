
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, WritingContext, GoalSuggestion, ChatMessage, ExpertPrompt } from '../types';
import { 
  X, Paperclip, Send, Target, Wand2, Globe, User, Bot, Trash2, Plus, Users, 
  Lightbulb, Layout, Type as TypeIcon, Search, Maximize2, Minimize2, Hash, 
  Mic, Zap, Brain, MapPin, Volume2, StopCircle, UserCog, MessageSquare, Sparkles,
  BookOpen, Feather, PenTool, CheckCircle, GraduationCap, FileText, FileImage, File as FileIcon, Loader2,
  GitBranch, Users as UsersIcon, Activity, Wind, Layers
} from 'lucide-react';
import { generateSpeech, transcribeAudio } from '../services/gemini';
import { useLivePartner } from '../hooks/useLivePartner';
import { DEFAULT_EXPERTS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDraft: (prompt: string, attachments: Attachment[], tools: any) => void;
  isGenerating: boolean;
  writingContext: WritingContext;
  setWritingContext: (ctx: WritingContext) => void;
  onRefineGoal: (goal: string) => Promise<GoalSuggestion[]>;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string, attachments: Attachment[], options: any) => void;
  onClearChat: () => void;
  experts: ExpertPrompt[];
  setExperts: (e: ExpertPrompt[]) => void;
  activeExpert: ExpertPrompt | undefined;
  setActiveExpert: (e: ExpertPrompt | undefined) => void;
  docContent: string;
}

const ExpertIcon = ({ id }: { id: string }) => {
  const icons: Record<string, any> = {
    plot: GitBranch,
    arc: UsersIcon,
    theme: Layers,
    tension: Activity,
    world: Wind,
    arch: Layout,
    muse: Lightbulb,
    critic: Search,
    polish: Sparkles,
    simple: Minimize2,
    story: BookOpen,
    seo: Hash,
    academic: GraduationCap,
    copy: PenTool,
    poet: Feather,
    brand: Target,
    research: Globe,
    sum: FileText,
    finish: CheckCircle,
    coach: UserCog
  };
  const Icon = icons[id] || UserCog;
  return <Icon size={16} aria-hidden="true" />;
};

const FileIconIndicator = ({ type }: { type: string }) => {
  if (type.startsWith('image/')) return <FileImage size={12} className="text-blue-500" />;
  if (type === 'application/pdf') return <FileText size={12} className="text-red-500" />;
  if (type.startsWith('text/') || type.includes('markdown')) return <FileText size={12} className="text-green-500" />;
  return <FileIcon size={12} className="text-gray-500" />;
};

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, onDraft, isGenerating, writingContext, setWritingContext, 
  onRefineGoal, chatHistory, onSendMessage, onClearChat, experts, setExperts, 
  activeExpert, setActiveExpert, docContent
}) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'chat' | 'experts'>('chat');
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Thinking...');
  
  const { isActive: isLiveActive, start: startLive, stop: stopLive } = useLivePartner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Status cycling for "Thinking" state
  useEffect(() => {
    if (isGenerating) {
      const statuses = [
        'Analyzing context...',
        'Synthesizing ideas...',
        'Checking plot coherence...',
        'Polishing prose...',
        'Deepening resonance...',
        'Evaluating character arcs...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setProcessingStatus(statuses[i % statuses.length]);
        i++;
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        // Add explicit type for BlobEvent to ensure data property is recognized
        recorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = async () => {
            const b64 = (reader.result as string).split(',')[1];
            const text = await transcribeAudio(b64, 'audio/webm');
            setPrompt(prev => prev + " " + text);
          };
          reader.readAsDataURL(blob);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied", err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // Fix: Explicitly type 'file' as 'File' to resolve 'unknown' property errors (name, type, readAsDataURL)
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: (ev.target?.result as string).split(',')[1]
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onSendMessage(prompt, attachments, { thinking: useThinking });
    setPrompt('');
    setAttachments([]);
  };

  const handleDraftSubmit = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onDraft(prompt, attachments, { search: useSearch, maps: useMaps });
    setPrompt('');
    setAttachments([]);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl" role="tablist">
            {(['chat', 'draft', 'experts'] as const).map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Close Assistant">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'chat' && (
            <div className="space-y-4 pb-20">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 opacity-30">
                  <MessageSquare className="mx-auto mb-2" size={32} />
                  <p className="text-sm">Start a conversation with your AI partner.</p>
                </div>
              )}
              {chatHistory.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none flex flex-col gap-2 min-w-[120px]">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter animate-pulse">{processingStatus}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          {activeTab === 'draft' && (
            <div className="space-y-6">
              <section className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Target size={12} /> Writing Goal
                </label>
                <textarea 
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] font-serif"
                  placeholder="What is the objective of this piece?"
                  value={writingContext.goal}
                  onChange={e => setWritingContext({...writingContext, goal: e.target.value})}
                />
              </section>

              <div className="grid grid-cols-2 gap-4">
                <section className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Audience</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-indigo-500"
                    placeholder="e.g. Experts"
                    value={writingContext.audience}
                    onChange={e => setWritingContext({...writingContext, audience: e.target.value})}
                  />
                </section>
                <section className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tone</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-indigo-500"
                    placeholder="e.g. Poetic"
                    value={writingContext.tone}
                    onChange={e => setWritingContext({...writingContext, tone: e.target.value})}
                  />
                </section>
              </div>

              <section className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Knowledge Tools</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUseSearch(!useSearch)} 
                      className={`p-2 rounded-lg border transition-all ${useSearch ? 'border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                      title="Google Search Grounding"
                    >
                      <Globe size={16}/>
                    </button>
                    <button 
                      onClick={() => setUseMaps(!useMaps)} 
                      className={`p-2 rounded-lg border transition-all ${useMaps ? 'border-indigo-500 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                      title="Google Maps Grounding"
                    >
                      <MapPin size={16}/>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'experts' && (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Abilities & Experts</label>
              <div className="grid grid-cols-1 gap-2">
                {DEFAULT_EXPERTS.map(expert => (
                  <button 
                    key={expert.id}
                    onClick={() => setActiveExpert(activeExpert?.id === expert.id ? undefined : expert)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      activeExpert?.id === expert.id 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500 shadow-sm' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${activeExpert?.id === expert.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      <ExpertIcon id={expert.id} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate text-gray-800 dark:text-gray-100">{expert.name}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{expert.prompt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-md">
          <div className="flex flex-wrap gap-2 mb-3">
             {attachments.map((att, i) => (
               <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg text-[10px] border border-gray-200 dark:border-gray-600 animate-in fade-in slide-in-from-bottom-1">
                  <FileIconIndicator type={att.type} />
                  <span className="truncate max-w-[100px] font-medium">{att.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors p-0.5"><X size={10}/></button>
               </div>
             ))}
          </div>
          
          <div className="relative group">
            <textarea 
              className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 pr-12 text-sm outline-none border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[120px] shadow-sm resize-none"
              placeholder={activeTab === 'draft' ? "Describe what needs to be drafted..." : "Brainstorm with your partner..."}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  activeTab === 'draft' ? handleDraftSubmit() : handleSendMessage(); 
                } 
              }}
            />
            <div className="absolute right-3 bottom-3 flex flex-col gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
              <div className="relative">
                {isRecording && (
                  <div className="absolute inset-0 bg-red-500/20 rounded-xl animate-ping pointer-events-none"></div>
                )}
                <button 
                  onClick={toggleRecording} 
                  className={`p-2 rounded-xl transition-all ${isRecording ? 'text-red-600 bg-red-50 dark:bg-red-900/20 shadow-inner' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                  title={isRecording ? "Listening..." : "Voice Input"}
                >
                  <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                </button>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                title="Attach Files"
              >
                <Paperclip size={18}/>
              </button>
              <button 
                onClick={() => activeTab === 'draft' ? handleDraftSubmit() : handleSendMessage()}
                disabled={isGenerating || (!prompt.trim() && attachments.length === 0)}
                className={`p-2 rounded-xl transition-all shadow-lg ${
                  isGenerating || (!prompt.trim() && attachments.length === 0) 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
          
          <div className="mt-3 flex items-center justify-between px-2">
            <button 
              onClick={() => setUseThinking(!useThinking)}
              className={`text-[10px] font-bold flex items-center gap-1.5 transition-colors ${useThinking ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}
            >
              <Brain size={12} /> Deep Reasoning {useThinking ? 'ON' : 'OFF'}
            </button>
            <div className="flex gap-4">
               {activeTab === 'chat' && chatHistory.length > 0 && (
                 <button onClick={onClearChat} className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1.5">
                   <Trash2 size={12}/> Clear History
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
