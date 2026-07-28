import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavigation } from './BottomNavigation';

export function WorkerLayout() {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-50 text-gray-900 w-full relative">
      <TopAppBar />
      <main className="flex-1 overflow-y-auto relative w-full pb-safe">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
