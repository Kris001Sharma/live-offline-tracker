import React from 'react';
import { WifiOff, RefreshCcw, XCircle, MapPinOff, ShieldAlert, Inbox } from 'lucide-react';

export function Offline() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-md text-sm font-medium">
      <WifiOff className="w-4 h-4" />
      <span>You are currently offline</span>
    </div>
  );
}

export function SyncPending({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
      <RefreshCcw className="w-4 h-4 animate-spin-slow" />
      <span>{count} items pending sync</span>
    </div>
  );
}

export function SyncFailed({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium">
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4" />
        <span>Synchronization failed</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="underline hover:text-red-900">
          Retry
        </button>
      )}
    </div>
  );
}

export function GpsDisabled() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full">
      <MapPinOff className="w-12 h-12 mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">GPS Disabled</h3>
      <p>Location services are required for this feature.</p>
    </div>
  );
}

export function PermissionRequired({ title = 'Permission Required', message = 'Please grant the necessary permissions.' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full">
      <ShieldAlert className="w-12 h-12 mb-4 text-amber-400" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export function NoData({ title = 'No Data', message = 'There is nothing to show here yet.' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full">
      <Inbox className="w-12 h-12 mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p>{message}</p>
    </div>
  );
}
