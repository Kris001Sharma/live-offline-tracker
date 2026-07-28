import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  isVisible: boolean;
  error?: Error | string | null;
  onDismiss?: () => void;
}

export function ErrorOverlay({ isVisible, error, onDismiss }: Props) {
  if (!isVisible) return null;

  const errorMessage = error instanceof Error ? error.message : (error || 'An unexpected error occurred');

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 px-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-lg font-bold text-gray-900 mb-2">Error</h2>
      <p className="text-gray-600 mb-6">{errorMessage}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
