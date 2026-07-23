import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { ConfigurationEngine } from '../configuration';
import { 
  AuthenticationState, 
  AuthenticationStatus, 
  AuthenticationResult, 
  AuthenticationErrorCode, 
  AuthenticatedUser 
} from './authentication.types';

let currentState: AuthenticationState = AuthenticationState.UNAUTHENTICATED;
let currentUserId: string | undefined;
let lastError: string | undefined;
let supabaseClient: SupabaseClient | null = null;
let currentAuthenticatedUser: AuthenticatedUser | null = null;
let initialized = false;

// Metrics
let lastLoginAt: string | undefined;
let lastLogoutAt: string | undefined;
let lastRestoreAttemptAt: string | undefined;
let lastAuthenticationFailureAt: string | undefined;
let consecutiveFailures: number = 0;

function freezeResult(result: AuthenticationResult): AuthenticationResult {
  return Object.freeze({ ...result });
}

function handleAuthFailure(errorMsg: string, code: AuthenticationErrorCode): AuthenticationResult {
  currentState = AuthenticationState.UNAUTHENTICATED;
  lastError = errorMsg;
  lastAuthenticationFailureAt = new Date().toISOString();
  consecutiveFailures += 1;

  return freezeResult({
    success: false,
    state: currentState,
    error: lastError,
    errorCode: code
  });
}

function parseSupabaseError(error: AuthError | null | any): AuthenticationErrorCode {
  if (!error) return AuthenticationErrorCode.UNKNOWN_ERROR;
  const msg = error?.message?.toLowerCase() || '';
  if (error?.status === 400 || msg.includes('credential')) {
    return AuthenticationErrorCode.INVALID_CREDENTIALS;
  } else if (error?.status === 0 || msg.includes('network') || msg.includes('fetch')) {
    return AuthenticationErrorCode.NETWORK_ERROR;
  } else if (msg.includes('expire') || msg.includes('refresh') || msg.includes('session')) {
    return AuthenticationErrorCode.SESSION_EXPIRED;
  }
  return AuthenticationErrorCode.UNKNOWN_ERROR;
}

export const AuthenticationEngine = {
  initialize(): void {
    if (initialized) {
      currentState = AuthenticationState.UNAUTHENTICATED;
      currentUserId = undefined;
      currentAuthenticatedUser = null;
      lastError = undefined;
      return;
    }

    currentState = AuthenticationState.UNAUTHENTICATED;
    currentUserId = undefined;
    currentAuthenticatedUser = null;
    lastError = undefined;
    
    lastLoginAt = undefined;
    lastLogoutAt = undefined;
    lastRestoreAttemptAt = undefined;
    lastAuthenticationFailureAt = undefined;
    consecutiveFailures = 0;

    const config = ConfigurationEngine.config.environment.supabase;
    supabaseClient = createClient(config.url, config.anonKey);
    initialized = true;
  },

  async login(email: string, password: string): Promise<AuthenticationResult> {
    if (currentState !== AuthenticationState.UNAUTHENTICATED) {
      throw new Error(`Authentication Engine: Cannot login from state ${currentState}`);
    }

    if (!supabaseClient) {
      throw new Error('Authentication Engine is not initialized');
    }

    currentState = AuthenticationState.AUTHENTICATING;
    lastError = undefined;

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return handleAuthFailure(error.message, parseSupabaseError(error));
      }

      if (!data.user || !data.session) {
        return handleAuthFailure('Authentication failed: No session returned', AuthenticationErrorCode.UNKNOWN_ERROR);
      }

      currentState = AuthenticationState.AUTHENTICATED;
      currentUserId = data.user.id;
      currentAuthenticatedUser = Object.freeze({
        id: data.user.id,
        email: data.user.email
      });
      lastLoginAt = new Date().toISOString();
      consecutiveFailures = 0;

      return freezeResult({
        success: true,
        state: currentState
      });
    } catch (err: any) {
      return handleAuthFailure(err.message || String(err), AuthenticationErrorCode.UNKNOWN_ERROR);
    }
  },

  async logout(): Promise<AuthenticationResult> {
    if (currentState !== AuthenticationState.AUTHENTICATED && currentState !== AuthenticationState.UNAUTHENTICATED) {
        throw new Error(`Authentication Engine: Cannot logout from state ${currentState}`);
    }

    if (!supabaseClient) {
      throw new Error('Authentication Engine is not initialized');
    }

    currentState = AuthenticationState.LOGGING_OUT;
    lastError = undefined;

    try {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.warn('Authentication Engine: Supabase sign out failed', error);
      }
    } catch (err: any) {
      console.warn('Authentication Engine: Unexpected error during sign out', err);
    } finally {
      currentState = AuthenticationState.UNAUTHENTICATED;
      currentUserId = undefined;
      currentAuthenticatedUser = null;
      lastLogoutAt = new Date().toISOString();
    }

    return freezeResult({
      success: true,
      state: currentState
    });
  },

  async restoreSession(): Promise<AuthenticationResult> {
    if (currentState !== AuthenticationState.UNAUTHENTICATED) {
      throw new Error(`Authentication Engine: Cannot restore session from state ${currentState}`);
    }

    if (!supabaseClient) {
      throw new Error('Authentication Engine is not initialized');
    }

    currentState = AuthenticationState.REFRESHING;
    lastError = undefined;
    lastRestoreAttemptAt = new Date().toISOString();

    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        return handleAuthFailure(error.message, parseSupabaseError(error));
      }

      if (!data.session) {
        return handleAuthFailure('No active session found', AuthenticationErrorCode.SESSION_EXPIRED);
      }

      currentState = AuthenticationState.AUTHENTICATED;
      currentUserId = data.session.user.id;
      currentAuthenticatedUser = Object.freeze({
        id: data.session.user.id,
        email: data.session.user.email
      });
      consecutiveFailures = 0;

      return freezeResult({
        success: true,
        state: currentState
      });
    } catch (err: any) {
      return handleAuthFailure(err.message || String(err), AuthenticationErrorCode.UNKNOWN_ERROR);
    }
  },

  status(): AuthenticationStatus {
    return Object.freeze({
      state: currentState,
      userId: currentUserId,
      lastError,
      lastLoginAt,
      lastLogoutAt,
      lastRestoreAttemptAt,
      lastAuthenticationFailureAt,
      consecutiveFailures
    });
  },

  currentUser(): AuthenticatedUser | null {
    if (currentState !== AuthenticationState.AUTHENTICATED || !currentAuthenticatedUser) {
      return null;
    }
    return currentAuthenticatedUser;
  }
};
