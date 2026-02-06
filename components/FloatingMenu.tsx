
import React, { useState, useEffect } from 'react';
import { SelectionRange } from '../types';
import { Sparkles, ArrowRight, RefreshCw, X } from 'lucide-react';

interface FloatingMenuProps {
  selection: SelectionRange;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
  isLoading: boolean;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ selection, onClose, onSubmit, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  const handleQuickAction = (action: string) => {
    onSubmit(action);
  };

  return (
    <div 
      className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in pointer-events-none"
      role="dialog"
      aria-label="AI Edit Menu"
    >
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-1 flex flex-col gap-2 ring-1 ring-black/5 w-full max-w-lg pointer-events-auto">
        
        {/* Header / Selection Preview */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-indigo-500" />
            Selected ({selection.text.length} chars)
          </span>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close Menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* Input Area */}
        <div className="relative flex items-center p-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ask AI to rewrite, expand, or fix..."
              className="flex-1 bg-gray-50 text-gray-800 text-sm rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && instruction.trim()) {
                  onSubmit(instruction);
                }
              }}
              disabled={isLoading}
              autoFocus
              aria-label="Edit instruction"
            />
            <button 
              onClick={() => onSubmit(instruction)}
              disabled={!instruction.trim() || isLoading}
              className={`absolute right-4 p-2 rounded-lg transition-all ${
                instruction.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}
              aria-label={isLoading ? "Processing" : "Submit Edit"}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide" role="list">
          {['Make it punchy', 'Fix grammar', 'Expand', 'Simplify', 'Make professional'].map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-medium text-gray-600 rounded-lg transition-all active:scale-95"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingMenu;
