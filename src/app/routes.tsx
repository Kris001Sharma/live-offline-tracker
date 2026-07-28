import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLifecycleState } from './lifecycle';
import { useAppContext } from './composition-root';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { Scaffold } from '../components/layout/Scaffold';
import { Loading } from '../components/status/Loading';

// Placeholder Pages
const Splash = () => <div className="flex items-center justify-center min-h-screen">Splash Screen</div>;
const Authentication = () => <div className="p-4">Authentication Screen</div>;
const WorkerDashboard = () => <div className="p-4">Worker Dashboard</div>;
const Attendance = () => <div className="p-4">Attendance Screen</div>;
const Tracking = () => <div className="p-4">Tracking Screen</div>;
const Synchronization = () => <div className="p-4">Synchronization Screen</div>;
const Settings = () => <div className="p-4">Settings Screen</div>;
const Supervisor = () => <div className="p-4">Supervisor Screen</div>;

export function AppRouter() {
  const { lifecycleState, error, retry } = useAppContext();

  if (lifecycleState === AppLifecycleState.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Initialization Error</h1>
        <p className="mb-4 text-gray-700">{error?.message || 'An unknown error occurred during startup.'}</p>
        <button 
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (lifecycleState !== AppLifecycleState.READY) {
    return <Loading label={`Starting application... (${lifecycleState})`} />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Scaffold>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/auth" element={<Authentication />} />
            
            {/* Protected Routes (Conceptual) */}
            <Route path="/dashboard" element={<WorkerDashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/sync" element={<Synchronization />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/supervisor" element={<Supervisor />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Scaffold>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
