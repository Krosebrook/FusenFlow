
import React from 'react';
import { Snapshot } from '../services/storage';
import { History, Clock, RotateCcw, X, FileText } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: Snapshot[];
  onRestore: (s: Snapshot) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onRestore }) => {
  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date(ts));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        role="dialog"
        aria-label="Version History"
        className="w-full sm:w-80 bg-white h-full shadow-2xl flex flex-col pointer-events-auto animate-fade-in border-l border-gray-100"
      >
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <History size={18} className="text-indigo-600" />
            Time Travel
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
            aria-label="Close History"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
              <Clock size={32} className="opacity-20" />
              <p className="text-sm">No history yet.</p>
              <p className="text-xs">Versions are saved automatically.</p>
            </div>
          ) : (
            history.map((snap) => (
              <div key={snap.id} role="listitem" className="group relative bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    snap.trigger === 'ai-pre-flight' ? 'bg-purple-100 text-purple-700' :
                    snap.trigger === 'manual' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {snap.trigger === 'ai-pre-flight' ? 'AI Safety' : snap.trigger}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{formatDate(snap.timestamp)}</span>
                </div>
                
                <p className="text-sm font-medium text-gray-800 mb-1">{snap.label}</p>
                <div className="text-xs text-gray-500 line-clamp-2 font-serif bg-gray-50 p-2 rounded border border-gray-100 mb-2">
                  {snap.content.substring(0, 100) || "(Empty)"}
                </div>

                <button 
                  onClick={() => onRestore(snap)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                >
                  <RotateCcw size={12} /> Restore this version
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;
