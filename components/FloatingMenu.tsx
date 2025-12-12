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
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Basic positioning logic - simply center on screen or near mouse could be better, 
    // but for textarea selection, we might need complex coordinates.
    // For simplicity/reliability in this MVP, we will stick the menu 
    // to the top-center of the viewport or use a fixed "Context Bar" at the bottom.
    // Let's use a "Sticky Bottom Center" approach which is very mobile friendly and slick.
  }, []);

  const handleQuickAction = (action: string) => {
    onSubmit(action);
  };

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-fade-in">
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 p-1 flex flex-col gap-2 ring-1 ring-black/5">
        
        {/* Header / Selection Preview */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={12} className="text-indigo-500" />
            Selected Text ({selection.text.length} chars)
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            />
            <button 
              onClick={() => onSubmit(instruction)}
              disabled={!instruction.trim() || isLoading}
              className={`absolute right-4 p-1.5 rounded-lg transition-all ${
                instruction.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
          {['Make it punchy', 'Fix grammar', 'Expand', 'Simplfy', 'Make professional'].map((action) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-medium text-gray-600 rounded-lg transition-all"
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