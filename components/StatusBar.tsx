
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
  const charCount = cleanText.length;
  const readingTime = Math.ceil(wordCount / 225); // 225 wpm average
  const readabilityScore = calculateFleschKincaid(content);
  const readabilityLabel = getReadabilityLabel(readabilityScore);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-9 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-[11px] font-medium text-gray-500 dark:text-gray-400 z-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 group cursor-help">
          <span className="font-mono text-gray-400 dark:text-gray-500">{wordCount} WORDS</span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700"></span>
          <span>{readingTime} MIN READ</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-700"></span>
          <div className="flex items-center gap-1.5" title={`Flesch-Kincaid Score: ${readabilityScore}`}>
            <span className={`w-2 h-2 rounded-full ${
              readabilityScore > 60 ? 'bg-green-400' : readabilityScore > 30 ? 'bg-yellow-400' : 'bg-red-400'
            }`}></span>
            <span className="uppercase tracking-tight">{readabilityLabel}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {showExportMenu && (
          <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-1 animate-fade-in">
            <button 
              onClick={() => { exportToPDF(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileType size={14} className="text-red-500" /> PDF Document
            </button>
            <button 
              onClick={() => { exportToDocx(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileText size={14} className="text-blue-500" /> Word (.docx)
            </button>
            <button 
              onClick={() => { exportToMarkdown(title, content); setShowExportMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-left transition-colors"
            >
              <FileDown size={14} className="text-gray-500" /> Markdown
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1.5 px-2 py-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold"
        >
          Export {showExportMenu ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
