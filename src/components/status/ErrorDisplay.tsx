import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: Error | string | null;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: Props) {
  const message = error instanceof Error ? error.message : (error || 'An unexpected error occurred');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-500 mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
