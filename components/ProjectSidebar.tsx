import React from 'react';
import { Document } from '../types';
import { FileText, Plus, Trash2, BookOpen, X } from 'lucide-react';

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  activeDocId: string | undefined;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  isOpen, 
  onClose,
  documents,
  activeDocId,
  onSwitch,
  onCreate,
  onDelete
}) => {
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif font-bold text-gray-800 dark:text-gray-100">
            <BookOpen size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>Projects</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {documents.map(doc => (
            <div 
              key={doc.id}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                activeDocId === doc.id 
                  ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
              }`}
              onClick={() => {
                onSwitch(doc.id);
                if (window.innerWidth < 1024) onClose();
              }}
            >
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${
                  activeDocId === doc.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {doc.title || 'Untitled'}
                </h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <FileText size={10} />
                  {formatDate(doc.lastModified)}
                </p>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm("Are you sure?")) onDelete(doc.id);
                }}
                className={`p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                  documents.length === 1 ? 'hidden' : ''
                }`}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            <Plus size={16} /> New Document
          </button>
        </div>
      </div>
    </>
  );
};

export default ProjectSidebar;