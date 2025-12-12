import React from 'react';
import { Suggestion } from '../types';
import { Lightbulb, Check } from 'lucide-react';

interface ProactivePanelProps {
  suggestion: Suggestion | null;
  onApply: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}

const ProactivePanel: React.FC<ProactivePanelProps> = ({ suggestion, onApply, onDismiss }) => {
  if (!suggestion) return null;

  return (
    <div className="fixed top-24 right-8 w-72 animate-fade-in z-30 hidden xl:block">
      <div className="bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden ring-1 ring-black/5">
        <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
          <div className="bg-indigo-100 p-1 rounded-md text-indigo-600">
            <Lightbulb size={14} />
          </div>
          <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">AI Insight</span>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {suggestion.reason}
          </p>
          
          {suggestion.suggestedText && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
               <p className="text-xs font-medium text-gray-400 mb-1 uppercase">Suggestion</p>
               <p className="text-sm text-gray-800 font-serif italic">"{suggestion.suggestedText}"</p>
            </div>
          )}

          <div className="flex gap-2">
            {suggestion.suggestedText && (
              <button 
                onClick={() => onApply(suggestion)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Check size={14} /> Apply
              </button>
            )}
            <button 
              onClick={onDismiss}
              className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProactivePanel;