import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

export const AuthenticationEngine = {
  initialize(): void {
    currentState = AuthenticationState.UNAUTHENTICATED;
    currentUserId = undefined;
    currentAuthenticatedUser = null;
    lastError = undefined;
    
    const config = ConfigurationEngine.config.environment.supabase;
    supabaseClient = createClient(config.url, config.anonKey);
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
        currentState = AuthenticationState.UNAUTHENTICATED;
        lastError = error.message;
        let errorCode = AuthenticationErrorCode.UNKNOWN_ERROR;
        
        if (error.status === 400 || error.message.toLowerCase().includes('credential')) {
          errorCode = AuthenticationErrorCode.INVALID_CREDENTIALS;
        } else if (error.status === 0 || error.message.toLowerCase().includes('network')) {
          errorCode = AuthenticationErrorCode.NETWORK_ERROR;
        }

        return Object.freeze({
          success: false,
          state: currentState,
          error: lastError,
          errorCode
        });
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed: No session returned');
      }

      currentState = AuthenticationState.AUTHENTICATED;
      currentUserId = data.user.id;
      currentAuthenticatedUser = {
        id: data.user.id,
        email: data.user.email
      };

      return Object.freeze({
        success: true,
        state: currentState
      });
    } catch (err: any) {
      currentState = AuthenticationState.UNAUTHENTICATED;
      lastError = err.message || String(err);
      return Object.freeze({
        success: false,
        state: currentState,
        error: lastError,
        errorCode: AuthenticationErrorCode.UNKNOWN_ERROR
      });
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
      
      currentState = AuthenticationState.UNAUTHENTICATED;
      currentUserId = undefined;
      currentAuthenticatedUser = null;

      return Object.freeze({
        success: true,
        state: currentState
      });
    } catch (err: any) {
      currentState = AuthenticationState.UNAUTHENTICATED;
      currentUserId = undefined;
      currentAuthenticatedUser = null;
      lastError = err.message || String(err);
      
      return Object.freeze({
        success: true,
        state: currentState,
        error: lastError,
        errorCode: AuthenticationErrorCode.UNKNOWN_ERROR
      });
    }
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

    try {
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        currentState = AuthenticationState.UNAUTHENTICATED;
        lastError = error.message;
        
        let errorCode = AuthenticationErrorCode.UNKNOWN_ERROR;
        if (error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('refresh')) {
           errorCode = AuthenticationErrorCode.SESSION_EXPIRED;
        } else if (error.status === 0 || error.message.toLowerCase().includes('network')) {
           errorCode = AuthenticationErrorCode.NETWORK_ERROR;
        }
        
        return Object.freeze({
          success: false,
          state: currentState,
          error: lastError,
          errorCode
        });
      }

      if (!data.session) {
        currentState = AuthenticationState.UNAUTHENTICATED;
        return Object.freeze({
          success: false,
          state: currentState,
          error: 'No active session found',
          errorCode: AuthenticationErrorCode.SESSION_EXPIRED
        });
      }

      currentState = AuthenticationState.AUTHENTICATED;
      currentUserId = data.session.user.id;
      currentAuthenticatedUser = {
        id: data.session.user.id,
        email: data.session.user.email
      };

      return Object.freeze({
        success: true,
        state: currentState
      });
    } catch (err: any) {
      currentState = AuthenticationState.UNAUTHENTICATED;
      lastError = err.message || String(err);
      return Object.freeze({
        success: false,
        state: currentState,
        error: lastError,
        errorCode: AuthenticationErrorCode.UNKNOWN_ERROR
      });
    }
  },

  status(): AuthenticationStatus {
    return Object.freeze({
      state: currentState,
      userId: currentUserId,
      lastError
    });
  },

  currentUser(): AuthenticatedUser | null {
    if (currentState !== AuthenticationState.AUTHENTICATED || !currentAuthenticatedUser) {
      return null;
    }
    return Object.freeze({ ...currentAuthenticatedUser });
  }
};
