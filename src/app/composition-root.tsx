import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppLifecycleState } from './lifecycle';
import { bootstrapApplication } from './bootstrap';
import { AuthenticationEngine, AuthenticatedUser } from '@/modules/authentication';
import { UserContextEngine, CurrentWorker, WorkerRole } from '@/modules/user-context';
import { WorkerProfileEngine } from '@/modules/worker-profile';

interface AppContextValue {
  lifecycleState: AppLifecycleState;
  error: Error | null;
  retry: () => void;
  refreshAuth: () => void;
  completeAuthentication: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AppContext = createContext<AppContextValue | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppCompositionRoot');
  }
  return ctx;
};

export function mapToWorker(authUser: AuthenticatedUser): CurrentWorker {
  return {
    id: authUser.id,
    email: authUser.email || '',
    displayName: authUser.email || 'Unknown User',
    role: 'WORKER' as WorkerRole,
    active: true
  };
}

export function AppCompositionRoot({ children }: { children: ReactNode }) {
  const [lifecycleState, setLifecycleState] = useState<AppLifecycleState>(AppLifecycleState.NOT_INITIALIZED);
  const [error, setError] = useState<Error | null>(null);
  const [authTrigger, setAuthTrigger] = useState(0);

  const init = async () => {
    try {
      setError(null);
      setLifecycleState(AppLifecycleState.INITIALIZING);
      
      await bootstrapApplication();

      setLifecycleState(AppLifecycleState.RESTORING_SESSION);
      const authStatus = await AuthenticationEngine.restoreSession();
      
      if (authStatus.errorCode === 'NETWORK_ERROR') {
         setLifecycleState(AppLifecycleState.OFFLINE_STARTUP);
         return;
      }
      
      if (authStatus.state === 'AUTHENTICATED') {
        setLifecycleState(AppLifecycleState.LOADING_PROFILE);
        const authUser = AuthenticationEngine.currentUser();
        if (authUser) {
           UserContextEngine.setCurrentWorker(mapToWorker(authUser));
        }

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

  const refreshAuth = () => {
    setAuthTrigger(prev => prev + 1);
  };

  const completeAuthentication = async () => {
    setLifecycleState(AppLifecycleState.LOADING_PROFILE);
    const authUser = AuthenticationEngine.currentUser();
    if (authUser) {
       UserContextEngine.setCurrentWorker(mapToWorker(authUser));
    }
    const userContextStatus = UserContextEngine.status();
    
    if (userContextStatus.currentWorkerId) {
      const profileResult = await WorkerProfileEngine.load();
      if (!profileResult.success) {
         console.warn('Failed to load profile:', profileResult.error);
      }
    }
    setLifecycleState(AppLifecycleState.READY);
    setAuthTrigger(prev => prev + 1);
  };

  const logout = async () => {
    try {
      await AuthenticationEngine.logout();
      UserContextEngine.clear();
      WorkerProfileEngine.clear();
      setAuthTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const isAuth = UserContextEngine.isAuthenticated() && AuthenticationEngine.status().state === 'AUTHENTICATED';

  return (
    <AppContext.Provider value={{ lifecycleState, error, retry, refreshAuth, completeAuthentication, logout, isAuthenticated: isAuth }}>
      {children}
    </AppContext.Provider>
  );
}
