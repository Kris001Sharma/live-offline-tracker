import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContextEngine } from '@/modules/user-context';
import { ConnectivityEngine } from '@/modules/connectivity';

export function AuthenticatedOnly({ children }: { children: ReactNode }) {
  const isAuth = UserContextEngine.isAuthenticated();
  if (!isAuth) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export function SupervisorOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const role = UserContextEngine.role();
  const isSupervisor = role === 'MANAGER' || role === 'ADMIN';
  if (!isSupervisor) return <>{fallback || <Navigate to="/dashboard" replace />}</>;
  return <>{children}</>;
}

export function WorkerOnly({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const role = UserContextEngine.role();
  if (role !== 'WORKER') return <>{fallback || null}</>;
  return <>{children}</>;
}

export function ConnectivityRequired({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  const status = ConnectivityEngine.status();
  if (!status.isOnline) {
    return <>{fallback || (
        <div className="p-4 bg-orange-50 border-l-4 border-orange-500 text-orange-700 m-4 rounded">
            This feature requires an active internet connection.
        </div>
    )}</>;
  }
  return <>{children}</>;
}

export function GPSRequired({ children, fallback }: { children: ReactNode, fallback?: ReactNode }) {
  // We assume location services capability is checked here, for now it returns children.
  return <>{children}</>;
}
