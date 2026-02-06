import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
          <div className="max-w-md w-full space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                {this.state.error?.message || 'An unexpected error occurred while processing your document.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                <RefreshCcw size={18} /> Reload Application
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Your work is likely safe in LocalStorage. Reloading will attempt to recover your session.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
