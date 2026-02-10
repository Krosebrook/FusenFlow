
import React, { useState } from 'react';
import { Snapshot } from '../services/storage';
import { History, Clock, RotateCcw, X, Plus, Save } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: Snapshot[];
  onRestore: (s: Snapshot) => void;
  onSnapshot: (label: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, history, onRestore, onSnapshot }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  if (!isOpen) return null;

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date(ts));
  };

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    onSnapshot(newLabel);
    setNewLabel('');
    setIsCreating(false);
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
        className="w-full sm:w-80 bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col pointer-events-auto animate-fade-in border-l border-gray-100 dark:border-gray-800"
      >
        
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-semibold">
            <History size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            Time Travel
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close History"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Manual Creation Section */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
           {!isCreating ? (
             <button 
               onClick={() => setIsCreating(true)}
               className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
             >
               <Plus size={16} aria-hidden="true" /> Save New Version
             </button>
           ) : (
             <div className="space-y-2 animate-fade-in">
               <label htmlFor="snapshot-label" className="sr-only">Version Label</label>
               <input 
                 id="snapshot-label"
                 autoFocus
                 type="text" 
                 placeholder="Version label (e.g. 'Before rewrite')"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                 className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
               />
               <div className="flex gap-2">
                 <button 
                   onClick={handleCreate}
                   disabled={!newLabel.trim()}
                   className="flex-1 flex items-center justify-center gap-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   aria-label="Save Snapshot"
                 >
                   <Save size={14} aria-hidden="true" /> Save
                 </button>
                 <button 
                   onClick={() => setIsCreating(false)}
                   className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="list" aria-label="Snapshots List">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
              <Clock size={32} className="opacity-20" aria-hidden="true" />
              <p className="text-sm">No history yet.</p>
              <p className="text-xs">Versions are saved automatically.</p>
            </div>
          ) : (
            history.map((snap) => (
              <div key={snap.id} role="listitem" className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-sm transition-all" tabIndex={0}>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    snap.trigger === 'ai-pre-flight' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                    snap.trigger === 'manual' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {snap.trigger === 'ai-pre-flight' ? 'AI Safety' : snap.trigger}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{formatDate(snap.timestamp)}</span>
                </div>
                
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{snap.label}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-serif bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800 mb-2">
                  {snap.content.replace(/<[^>]*>?/gm, ' ').substring(0, 100) || "(Empty)"}
                </div>

                <button 
                  onClick={() => onRestore(snap)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                  aria-label={`Restore version from ${formatDate(snap.timestamp)}`}
                >
                  <RotateCcw size={12} aria-hidden="true" /> Restore this version
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
