import React, { useState, useRef } from 'react';
import { Attachment } from '../types';
import { MessageSquare, Paperclip, Send, X, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDraft: (prompt: string, attachments: Attachment[]) => void;
  isGenerating: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onDraft, isGenerating }) => {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-indigo-600" size={20} />
          Magic Draft
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-900 leading-relaxed">
          <p className="font-medium mb-1">How it works</p>
          <p className="opacity-80">
            Describe what you want to write. You can attach reference files, notes, or images. 
            AI will draft the initial content for you to refine.
          </p>
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
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a blog post about the future of remote work..."
            className="w-full h-32 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
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
              {isGenerating ? 'Drafting...' : 'Generate Draft'}
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;