
import React, { useState } from 'react';
import { Download, FileDown, FileType, FileText, ChevronUp, ChevronDown } from 'lucide-react';
import { calculateFleschKincaid, getReadabilityLabel } from '../utils/readability';
import { exportToPDF, exportToDocx, exportToMarkdown } from '../services/exportService';

interface StatusBarProps {
  content: string;
  title: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ content, title }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Metrics calculation
  const cleanText = content.replace(/<[^>]*>?/gm, ' ');
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 225)); // 225 wpm average
  const readabilityScore = calculateFleschKincaid(content);
  const readabilityLabel = getReadabilityLabel(readabilityScore);

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 h-9 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-[11px] font-medium text-gray-500 dark:text-gray-400 z-50 transition-colors"
      aria-label="Editor status and metrics"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 group" title={`${wordCount} words total`}>
          <span className="font-mono text-gray-400 dark:text-gray-500" aria-label={`${wordCount} words`}>{wordCount} WORDS</span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
          <span aria-label={`Approximately ${readingTime} minute reading time`}>{readingTime} MIN READ</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
          <div className="flex items-center gap-1.5" title={`Readability Score: ${readabilityScore} (${readabilityLabel})`}>
            <span className={`w-2 h-2 rounded-full ${
              readabilityScore > 60 ? 'bg-green-400' : readabilityScore > 30 ? 'bg-yellow-400' : 'bg-red-400'
            }`} aria-hidden="true"></span>
            <span className="uppercase tracking-tight" aria-label={`Readability is ${readabilityLabel}`}>{readabilityLabel}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {showExportMenu && (
          <div 
            className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-1 animate-fade-in"
            role="menu"
            aria-label="Export options"
          >
            <button 
              role="menuitem"
              onClick={() => { exportToPDF(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileType size={14} className="text-red-500" aria-hidden="true" /> PDF Document
            </button>
            <button 
              role="menuitem"
              onClick={() => { exportToDocx(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileText size={14} className="text-blue-500" aria-hidden="true" /> Word (.docx)
            </button>
            <button 
              role="menuitem"
              onClick={() => { exportToMarkdown(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileDown size={14} className="text-gray-500" aria-hidden="true" /> Markdown
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          aria-expanded={showExportMenu}
          aria-haspopup="true"
          className="flex items-center gap-1.5 px-2 py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold"
        >
          Export {showExportMenu ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronUp size={12} aria-hidden="true" />}
        </button>
      </div>
    </footer>
  );
};

export default StatusBar;
