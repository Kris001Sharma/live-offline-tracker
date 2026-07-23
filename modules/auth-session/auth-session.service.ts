import { AuthenticationEngine, AuthenticatedUser } from '../authentication';
import { UserContextEngine, CurrentWorker, WorkerRole } from '../user-context';
import { AuthSessionStatus, AuthSessionResult } from './auth-session.types';

let initialized = false;
let lastLoginAt: string | undefined;
let lastRestoreAt: string | undefined;
let lastLogoutAt: string | undefined;

function mapToWorker(authUser: AuthenticatedUser): CurrentWorker {
  // Temporary mapping until Worker repository is introduced.
  // Using placeholder values for displayName, role, active.
  return {
    id: authUser.id,
    email: authUser.email || '',
    displayName: authUser.email || 'Unknown User',
    role: 'WORKER' as WorkerRole,
    active: true
  };
}

export const AuthSession = {
  initialize(): void {
    if (!initialized) {
      AuthenticationEngine.initialize();
      UserContextEngine.initialize();
      initialized = true;
    }
  },

  async login(email: string, password: string): Promise<AuthSessionResult> {
    const authResult = await AuthenticationEngine.login(email, password);

    if (!authResult.success) {
      return Object.freeze({
        success: false,
        error: authResult.error,
        errorCode: authResult.errorCode
      });
    }

    try {
      const authUser = AuthenticationEngine.currentUser();
      if (!authUser) {
        throw new Error('Authentication succeeded but no user was returned');
      }

      const worker = mapToWorker(authUser);
      UserContextEngine.setCurrentWorker(worker);
      
      lastLoginAt = new Date().toISOString();
      return Object.freeze({ success: true });
    } catch (error: any) {
      // Rollback
      await AuthenticationEngine.logout();
      UserContextEngine.clear();
      
      return Object.freeze({
        success: false,
        error: error.message || String(error)
      });
    }
  },

  async logout(): Promise<AuthSessionResult> {
    try {
      const authResult = await AuthenticationEngine.logout();
      return Object.freeze({
        success: authResult.success,
        error: authResult.error,
        errorCode: authResult.errorCode
      });
    } finally {
      // Always clear user context even if network fails
      UserContextEngine.clear();
      lastLogoutAt = new Date().toISOString();
    }
  },

  async restore(): Promise<AuthSessionResult> {
    const authResult = await AuthenticationEngine.restoreSession();

    if (!authResult.success) {
      UserContextEngine.clear();
      return Object.freeze({
        success: false,
        error: authResult.error,
        errorCode: authResult.errorCode
      });
    }

    try {
      const authUser = AuthenticationEngine.currentUser();
      if (!authUser) {
         throw new Error('Session restored but no user was returned');
      }

      const worker = mapToWorker(authUser);
      UserContextEngine.setCurrentWorker(worker);

      lastRestoreAt = new Date().toISOString();
      return Object.freeze({ success: true });
    } catch (error: any) {
      UserContextEngine.clear();
      return Object.freeze({
        success: false,
        error: error.message || String(error)
      });
    }
  },

  status(): AuthSessionStatus {
    const userContextStatus = UserContextEngine.status();
    
    return Object.freeze({
      initialized,
      authenticated: userContextStatus.authenticated,
      workerId: userContextStatus.currentWorkerId,
      role: userContextStatus.role,
      lastLoginAt,
      lastRestoreAt,
      lastLogoutAt
    });
  }
};
