import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLifecycleState } from './lifecycle';
import { useAppContext } from './composition-root';
import { ErrorBoundary } from '../components/error/ErrorBoundary';
import { WorkerLayout } from '../components/layout/WorkerLayout';
import { SplashScreen } from '../features/identity/components/SplashScreen';
import { AuthScreen } from '../features/identity/components/AuthScreen';
import { GlobalFeedbackProvider } from '../components/feedback/GlobalFeedbackProvider';
import { AuthenticatedOnly, SupervisorOnly } from '../features/permissions/components/Guards';

// Placeholder Pages
const WorkerDashboard = () => <div className="p-4">Worker Dashboard</div>;
const Attendance = () => <div className="p-4">Attendance Screen</div>;
const Tracking = () => <div className="p-4">Tracking Screen</div>;
const Synchronization = () => <div className="p-4">Synchronization Screen</div>;
const Settings = () => <div className="p-4">Settings Screen</div>;
const Supervisor = () => <div className="p-4">Supervisor Screen</div>;

export function AppRouter() {
  const { lifecycleState, isAuthenticated } = useAppContext();

  if (lifecycleState !== AppLifecycleState.READY) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <GlobalFeedbackProvider>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/auth" element={<AuthScreen />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </>
            ) : (
              <Route
                element={
                  <AuthenticatedOnly>
                    <WorkerLayout />
                  </AuthenticatedOnly>
                }
              >
                <Route path="/dashboard" element={<WorkerDashboard />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/sync" element={<Synchronization />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/supervisor" element={<SupervisorOnly><Supervisor /></SupervisorOnly>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            )}
          </Routes>
        </GlobalFeedbackProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
