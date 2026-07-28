import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../app/composition-root';
import { AuthenticationEngine } from '@/modules/authentication';
import { UserContextEngine } from '@/modules/user-context';
import { WorkerProfileEngine } from '@/modules/worker-profile';
import { ConnectivityEngine } from '@/modules/connectivity';
import { WorkerSyncEngine, WorkerSyncLifecycle } from '@/modules/worker-sync';
import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function TopAppBar() {
  const { isAuthenticated, refreshAuth } = useAppContext();
  
  const [connectivityStatus, setConnectivityStatus] = useState(ConnectivityEngine.status());
  const [syncStatus, setSyncStatus] = useState(WorkerSyncEngine.status());

  useEffect(() => {
     const interval = setInterval(() => {
        setConnectivityStatus(ConnectivityEngine.status());
        setSyncStatus(WorkerSyncEngine.status());
     }, 2000);
     return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await AuthenticationEngine.logout();
      UserContextEngine.clear();
      WorkerProfileEngine.clear();
      refreshAuth();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const userContext = UserContextEngine.status();
  const workerName = UserContextEngine.currentWorker()?.displayName || 'Worker';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 w-full pt-safe">
      <div className="flex items-center space-x-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-gray-900 truncate max-w-[120px]">{workerName}</span>
          <span className="text-[10px] text-gray-500 font-medium">Sapana Village</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
           {syncStatus.lifecycle === WorkerSyncLifecycle.SYNCING ? (
             <RefreshCw size={16} className="text-blue-500 animate-spin" aria-label="Syncing" />
           ) : null}
           {connectivityStatus.isOnline ? (
             <Wifi size={16} className="text-green-600" aria-label="Online" />
           ) : (
             <WifiOff size={16} className="text-red-500" aria-label="Offline" />
           )}
        </div>
        <button className="text-gray-500 hover:text-gray-900 relative" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
