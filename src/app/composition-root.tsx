import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppLifecycleState } from './lifecycle';
import { bootstrapApplication } from './bootstrap';
import { AuthenticationEngine } from '@/modules/authentication';
import { UserContextEngine } from '@/modules/user-context';
import { WorkerProfileEngine } from '@/modules/worker-profile';

interface AppContextValue {
  lifecycleState: AppLifecycleState;
  error: Error | null;
  retry: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppCompositionRoot');
  }
  return ctx;
};

export function AppCompositionRoot({ children }: { children: ReactNode }) {
  const [lifecycleState, setLifecycleState] = useState<AppLifecycleState>(AppLifecycleState.NOT_INITIALIZED);
  const [error, setError] = useState<Error | null>(null);

  const init = async () => {
    try {
      setError(null);
      setLifecycleState(AppLifecycleState.INITIALIZING);
      
      await bootstrapApplication();

      // Simple session restoration sequence check
      setLifecycleState(AppLifecycleState.RESTORING_SESSION);
      const authStatus = await AuthenticationEngine.restoreSession();
      
      if (authStatus.state === 'AUTHENTICATED') {
        setLifecycleState(AppLifecycleState.LOADING_PROFILE);
        const userContextStatus = UserContextEngine.status();
        
        if (userContextStatus.currentWorkerId) {
          const profileResult = await WorkerProfileEngine.load();
          if (!profileResult.success) {
             console.warn('Failed to load profile:', profileResult.error);
          }
        }
      }

      setLifecycleState(AppLifecycleState.READY);
    } catch (err) {
      console.error('App Bootstrap Error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLifecycleState(AppLifecycleState.ERROR);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const retry = () => {
    init();
  };

  return (
    <AppContext.Provider value={{ lifecycleState, error, retry }}>
      {children}
    </AppContext.Provider>
  );
}
