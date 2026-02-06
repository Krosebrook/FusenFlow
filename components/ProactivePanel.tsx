
import React from 'react';
import { Suggestion } from '../types';
import { Lightbulb, Check, X, ArrowRight } from 'lucide-react';

interface ProactivePanelProps {
  suggestion: Suggestion | null;
  onApply: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

const ProactivePanel: React.FC<ProactivePanelProps> = ({ suggestion, onApply, onDismiss }) => {
  if (!suggestion) return null;

  return (
    <div 
      role="alertdialog"
      aria-labelledby="suggestion-title"
      aria-describedby="suggestion-desc"
      className="fixed z-30 animate-fade-in transition-all duration-300 
      bottom-4 left-4 right-4 
      md:bottom-8 md:left-auto md:right-8 md:w-96 
      xl:top-24 xl:bottom-auto xl:w-80">
      <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 overflow-hidden ring-1 ring-black/5">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-white px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
              <Lightbulb size={16} aria-hidden="true" />
            </div>
            <span id="suggestion-title" className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
              {suggestion.type} Insight
            </span>
          </div>
          <button 
            onClick={onDismiss} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"
            aria-label="Dismiss Suggestion"
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <p id="suggestion-desc" className="text-sm text-gray-600 leading-relaxed font-medium">
            {suggestion.reason}
          </p>
          
          {/* Diff View */}
          <div className="bg-gray-50 rounded-lg border border-gray-100 text-sm font-serif p-3 space-y-2">
             <div className="text-red-800 line-through decoration-red-300 decoration-2 opacity-60 text-xs" aria-label="Original text">
                {suggestion.originalText}
             </div>
             <div className="flex items-center justify-center text-gray-300">
                <ArrowRight size={12} aria-hidden="true" />
             </div>
             <div className="text-green-800 bg-green-50/50 p-1 -mx-1 rounded" aria-label="Suggested replacement">
                {suggestion.suggestedText}
             </div>
          </div>

          <button 
            onClick={() => onApply(suggestion)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 touch-manipulation"
          >
            <Check size={16} /> Apply Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProactivePanel;
