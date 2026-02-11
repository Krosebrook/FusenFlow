
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, WritingContext, GoalSuggestion, ChatMessage, ExpertPrompt, OutlineItem } from '../types';
import { 
  X, Paperclip, Send, Target, Wand2, Globe, User, Bot, Trash2, Plus, Users, 
  Lightbulb, Layout, Type as TypeIcon, Search, Maximize2, Minimize2, Hash, 
  Mic, Zap, Brain, MapPin, Volume2, StopCircle, UserCog, MessageSquare, Sparkles,
  BookOpen, Feather, PenTool, CheckCircle, GraduationCap, FileText, FileImage, File as FileIcon, Loader2,
  GitBranch, Users as UsersIcon, Activity, Wind, Layers, Eye, Timer, Fingerprint, Scissors,
  Anchor, Ghost, Heart, Scale, Music, Crosshair, Film, AudioLines, GitCompare, TrendingUp,
  ChevronDown, ChevronRight, ListTree, RefreshCw
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
  onBrainstorm: () => void;
  onSummarize: () => void;
  outline: OutlineItem[];
  onFetchOutline: () => void;
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
    coach: UserCog,
    dialogue: MessageSquare,
    senses: Eye,
    pacing: Timer,
    motive: Fingerprint,
    cliche: Scissors,
    hook: Anchor,
    subtext: Ghost,
    emotion: Heart,
    lawyer: Scale,
    rhythm: Music,
    // New Experts
    pov: Crosshair,
    show: Film,
    voice: AudioLines,
    foil: GitCompare,
    stakes: TrendingUp
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
  activeExpert, setActiveExpert, docContent, onBrainstorm, onSummarize,
  outline, onFetchOutline
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'draft' | 'experts'>('chat');
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Thinking...');
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  
  const { isActive: isLiveActive, start: startLive, stop: stopLive } = useLivePartner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Status cycling for "Thinking" state
  useEffect(() => {
    if (isGenerating) {
      let statuses = [
        'Thinking...',
        'Analyzing context...',
        'Generating response...',
        'Consulting knowledge base...',
        'Formulating answer...',
        'Polishing output...'
      ];

      // Context-aware statuses based on the active expert
      if (activeExpert) {
        switch (activeExpert.id) {
          case 'plot':
            statuses = ['Tracing narrative threads...', 'Checking causality...', 'Identifying plot holes...', 'Verifying logic...'];
            break;
          case 'critic':
            statuses = ['Auditing logic...', 'Finding contradictions...', 'Stress-testing arguments...', 'Reviewing premises...'];
            break;
          case 'muse':
            statuses = ['Connecting unrelated ideas...', 'Generating metaphors...', 'Thinking laterally...', 'Brainstorming twists...'];
            break;
          case 'polish':
            statuses = ['Smoothing rhythm...', 'Enhancing vocabulary...', 'Checking cadence...', 'Refining tone...'];
            break;
          case 'arc':
            statuses = ['Analyzing motivations...', 'Mapping emotional journeys...', 'Checking agency...', 'Reviewing stakes...'];
            break;
          case 'world':
            statuses = ['Checking consistency...', 'Verifying lore...', 'Building atmosphere...', 'Reviewing rules...'];
            break;
          case 'tension':
            statuses = ['Analyzing pacing...', 'Measuring stakes...', 'Checking urgency...', 'Reviewing conflict...'];
            break;
          case 'simple':
            statuses = ['Simplifying syntax...', 'Reducing jargon...', 'Clarifying meaning...', 'Optimizing flow...'];
            break;
          case 'academic':
            statuses = ['Checking formality...', 'Structuring arguments...', 'Reviewing citations...', 'Verifying rigor...'];
            break;
          case 'seo':
            statuses = ['Analyzing keywords...', 'Checking headings...', 'Optimizing density...', 'Reviewing readability...'];
            break;
          case 'dialogue':
            statuses = ['Listening to speech patterns...', 'Checking subtext...', 'Verifying character voice...', 'Analyzing exchanges...'];
            break;
          case 'senses':
            statuses = ['Checking sensory details...', 'Analyzing immersion...', 'Reviewing "show, don\'t tell"...', 'Enhancing imagery...'];
            break;
          case 'pacing':
            statuses = ['Analyzing rhythm...', 'Checking scene length...', 'Measuring narrative speed...', 'Reviewing flow...'];
            break;
          case 'motive':
            statuses = ['Checking agency...', 'Analyzing drivers...', 'Verifying internal logic...', 'Reviewing character choices...'];
            break;
          case 'cliche':
            statuses = ['Hunting tropes...', 'Checking originality...', 'Analyzing phrasing...', 'Identifying overuse...'];
            break;
          case 'hook':
            statuses = ['Checking the opening...', 'Measuring curiosity...', 'Analyzing cliffhangers...', 'Reviewing engagement...'];
            break;
          case 'subtext':
            statuses = ['Reading between lines...', 'Identifying unspoken tension...', 'Checking layers...', 'Analyzing nuance...'];
            break;
          case 'emotion':
            statuses = ['Measuring resonance...', 'Checking reader impact...', 'Analyzing feelings...', 'Reviewing empathy...'];
            break;
          case 'lawyer':
            statuses = ['Cross-examining arguments...', 'Identifying fallacies...', 'Stress-testing logic...', 'Challenging premises...'];
            break;
          case 'rhythm':
            statuses = ['Listening to cadence...', 'Checking flow...', 'Analyzing phonetics...', 'Reviewing musicality...'];
            break;
          case 'pov':
            statuses = ['Checking narrative distance...', 'Scanning for head-hopping...', 'Verifying perspective consistency...', 'Checking point of view...'];
            break;
          case 'show':
            statuses = ['Detecting exposition dumps...', 'Looking for sensory opportunities...', 'Analyzing summary vs scene...', 'Enhancing imagery...'];
            break;
          case 'voice':
            statuses = ['Sampling character speech...', 'Comparing idiolects...', 'Checking dialogue distinctiveness...', 'Analyzing tone...'];
            break;
          case 'foil':
            statuses = ['Mapping character contrasts...', 'Analyzing relationship dynamics...', 'Checking for dramatic foils...', 'Reviewing interactions...'];
            break;
          case 'stakes':
            statuses = ['Measuring consequences...', 'Evaluating risk levels...', 'Checking narrative escalation...', 'Analyzing conflict...'];
            break;
        }
      }

      setProcessingStatus(statuses[0]);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setProcessingStatus(statuses[i % statuses.length]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGenerating, activeExpert]);

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
        recorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = async () => {
            const b64 = (reader.result as string).split(',')[1];
            // Show processing state while transcribing
            setProcessingStatus('Transcribing audio...');
            const text = await transcribeAudio(b64, 'audio/webm');
            setPrompt(prev => {
              const newPrompt = prev.trim() ? `${prev} ${text}` : text;
              return newPrompt;
            });
          };
          reader.readAsDataURL(blob);
          // Stop tracks to release mic
          stream.getTracks().forEach(track => track.stop());
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
    // Reset input to allow selecting the same file again if needed
    if (e.target) e.target.value = '';
  };

  const handleSendMessage = () => {
    if (!prompt.trim() && attachments.length === 0) return;
    onSendMessage(prompt, attachments, { thinking: useThinking, search: useSearch });
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
              {/* Outline Section */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <ListTree size={12} className="text-indigo-500" /> Document Outline
                  </div>
                  {isOutlineOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isOutlineOpen && (
                  <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                    {outline.length > 0 ? (
                      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {outline.map((item, idx) => (
                          <div 
                            key={idx} 
                            style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}
                            className={`text-xs ${item.level === 1 ? 'font-bold text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 font-medium'}`}
                          >
                            {item.level === 1 ? '• ' : '- '}{item.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-[10px] text-gray-400 italic">
                        No outline generated yet.
                      </div>
                    )}
                    <button 
                      onClick={onFetchOutline}
                      disabled={isGenerating || !docContent || docContent === '<p></p>'}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      {outline.length > 0 ? 'Refresh Outline' : 'Generate Outline'}
                    </button>
                  </div>
                )}
              </div>

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

              <section className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Format</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:border-indigo-500"
                  placeholder="e.g. Blog Post, Essay, Email"
                  value={writingContext.format}
                  onChange={e => setWritingContext({...writingContext, format: e.target.value})}
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reference Materials</span>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-indigo-300 transition-all"
                >
                  <Paperclip size={14} />
                  Attach context (PDF, Text, Images)
                </button>
              </section>

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

              <section className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Tools</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      onBrainstorm();
                      setActiveTab('chat');
                    }}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  >
                    <Lightbulb size={14} />
                    Generate Ideas
                  </button>
                  <button 
                    onClick={() => {
                      onSummarize();
                      setActiveTab('chat');
                    }}
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FileText size={14} />
                    Summarize Doc
                  </button>
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
            {isRecording && (
                <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 animate-pulse pointer-events-none z-10" />
            )}
            <textarea 
              className={`w-full bg-white dark:bg-gray-900 rounded-2xl p-4 pr-12 text-sm outline-none border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[120px] shadow-sm resize-none ${isRecording ? 'ring-2 ring-red-500/20 border-red-500/50' : ''}`}
              placeholder={isRecording ? "Listening..." : (activeTab === 'draft' ? "Describe what needs to be drafted..." : "Brainstorm with your partner...")}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  activeTab === 'draft' ? handleDraftSubmit() : handleSendMessage(); 
                } 
              }}
            />
            <div className="absolute right-3 bottom-3 flex flex-col gap-2 opacity-60 group-focus-within:opacity-100 transition-opacity z-20">
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
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            accept=".txt,.md,.pdf,image/*" 
            onChange={handleFileUpload} 
          />
          
          <div className="mt-3 flex items-center justify-between px-2">
            <div className="flex gap-3">
              <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`text-[10px] font-bold flex items-center gap-1.5 transition-colors ${useThinking ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}
              >
                <Brain size={12} /> Deep Reasoning {useThinking ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`text-[10px] font-bold flex items-center gap-1.5 transition-colors ${useThinking ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}
              >
                <Globe size={12} /> Search {useSearch ? 'ON' : 'OFF'}
              </button>
            </div>
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
