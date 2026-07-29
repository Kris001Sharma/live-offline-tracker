import React, { ReactNode } from 'react';
import { TopAppBar } from './TopAppBar';
import { BottomNavigation } from './BottomNavigation';
import { ModalHost, ToastHost, GlobalDialogHost } from './Hosts';

interface ScaffoldProps {
  children: ReactNode;
}

export function Scaffold({ children }: ScaffoldProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-900">
      <TopAppBar />
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
      <BottomNavigation />
      
      {/* Global overlay hosts */}
      <ModalHost />
      <ToastHost />
      <GlobalDialogHost />
    </div>
  );
}
