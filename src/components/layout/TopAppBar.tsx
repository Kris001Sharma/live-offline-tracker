import React from 'react';
import { useAppContext } from '../../app/composition-root';
import { AuthenticationEngine } from '@/modules/authentication';
import { UserContextEngine } from '@/modules/user-context';
import { WorkerProfileEngine } from '@/modules/worker-profile';

export function TopAppBar() {
  const { isAuthenticated, refreshAuth } = useAppContext();

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

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
      <div className="font-semibold text-lg text-gray-800">Sapana Village</div>
      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Logout
        </button>
      )}
    </header>
  );
}
