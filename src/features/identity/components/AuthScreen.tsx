import React, { useState } from 'react';
import { AuthenticationEngine } from '../../../../modules/authentication';
import { useAppContext } from '../../../app/composition-root';
import { ErrorDisplay } from '../../../components/status/ErrorDisplay';
import { LoadingOverlay } from '../../../components/status/LoadingOverlay';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useNavigate } from 'react-router-dom';

export function AuthScreen() {
  const { completeAuthentication } = useAppContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFormValid = email.includes('@') && password.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const authResult = await AuthenticationEngine.login(email, password);
      
      if (authResult.success) {
        const authUser = AuthenticationEngine.currentUser();
        if (authUser) {
           await completeAuthentication();
           navigate('/dashboard', { replace: true });
        } else {
           setErrorMsg('Authentication succeeded but no user returned.');
        }
      } else {
        if (authResult.errorCode === 'NETWORK_ERROR') {
           setErrorMsg('Network error. Please check your connection and try again.');
        } else if (authResult.errorCode === 'INVALID_CREDENTIALS') {
           setErrorMsg('Invalid email or password. Please try again.');
        } else {
           setErrorMsg('An unexpected error occurred during sign in.');
        }
      }
    } catch (err: any) {
       setErrorMsg('An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-sm text-gray-500">Access your worker profile</p>
          </div>

          {errorMsg && (
            <div className="mb-6">
              <ErrorDisplay 
                 error={new Error(errorMsg)} 
                 onRetry={() => setErrorMsg(null)}
              />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="worker@example.com"
                required
                disabled={isLoading}
                aria-label="Email Address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
                required
                disabled={isLoading}
                aria-label="Password"
              />
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      {isLoading && <LoadingOverlay label="Authenticating..." />}
    </PageContainer>
  );
}
