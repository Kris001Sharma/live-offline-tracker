import React from 'react';
import { Loading } from '../../../components/status/Loading';
import { AppLifecycleState } from '../../../app/lifecycle';
import { useAppContext } from '../../../app/composition-root';

export function SplashScreen() {
  const { lifecycleState, error, retry } = useAppContext();

  let message = 'Starting application...';
  if (lifecycleState === AppLifecycleState.INITIALIZING) {
      message = 'Initializing engines...';
  } else if (lifecycleState === AppLifecycleState.RESTORING_SESSION) {
      message = 'Restoring session...';
  } else if (lifecycleState === AppLifecycleState.LOADING_PROFILE) {
      message = 'Loading worker profile...';
  }

  if (lifecycleState === AppLifecycleState.ERROR) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
            <h1 className="text-xl font-bold text-red-600 mb-2">Initialization Error</h1>
            <p className="mb-4 text-gray-700">{error?.message || 'An unknown error occurred during startup.'}</p>
            <button 
              onClick={retry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
      );
  }

  if (lifecycleState === AppLifecycleState.OFFLINE_STARTUP) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Offline</h1>
            <p className="mb-4 text-gray-700">The application cannot reach the server to initialize.</p>
            <button 
              onClick={retry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Identity</h1>
            <p className="text-gray-500">Worker Portal</p>
        </div>
        <Loading label={message} />
    </div>
  );
}
