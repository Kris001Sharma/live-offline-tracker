import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoadingOverlay } from '../status/LoadingOverlay';
import { ErrorDisplay } from '../status/ErrorDisplay';

interface GlobalFeedbackContextValue {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  showError: (error: Error, onRetry?: () => void) => void;
  clearError: () => void;
  showToast: (message: string) => void;
}

const GlobalFeedbackContext = createContext<GlobalFeedbackContextValue | null>(null);

export const useGlobalFeedback = () => {
  const ctx = useContext(GlobalFeedbackContext);
  if (!ctx) {
    throw new Error('useGlobalFeedback must be used within GlobalFeedbackProvider');
  }
  return ctx;
};

export function GlobalFeedbackProvider({ children }: { children: ReactNode }) {
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{error: Error, onRetry?: () => void} | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showLoading = (message = 'Loading...') => setLoadingMsg(message);
  const hideLoading = () => setLoadingMsg(null);

  const showError = (error: Error, onRetry?: () => void) => setErrorState({ error, onRetry });
  const clearError = () => setErrorState(null);

  const showToast = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <GlobalFeedbackContext.Provider value={{ showLoading, hideLoading, showError, clearError, showToast }}>
      {children}
      
      {/* Loading Host */}
      {loadingMsg && <LoadingOverlay label={loadingMsg} />}

      {/* Error Host */}
      {errorState && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="max-w-md w-full bg-white border border-gray-200 shadow-xl rounded-xl p-6">
              <ErrorDisplay 
                 error={errorState.error} 
                 onRetry={() => {
                    clearError();
                    if (errorState.onRetry) errorState.onRetry();
                 }}
              />
              <button 
                 onClick={clearError}
                 className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
           </div>
        </div>
      )}

      {/* Toast Host */}
      {toastMsg && (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
           <div className="bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
             {toastMsg}
           </div>
        </div>
      )}
    </GlobalFeedbackContext.Provider>
  );
}
