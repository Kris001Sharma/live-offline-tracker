import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationEngine } from '../authentication';
import { WorkerRole } from '../user-context';
import { ConfigurationEngine } from '../configuration';
import { 
  WorkerProfile, 
  WorkerProfileStatus, 
  WorkerProfileLifecycle, 
  WorkerProfileResult,
  WorkerProfileErrorCode 
} from './worker-profile.types';

/**
 * ARCHITECTURE NOTE: Worker Profile Engine Ownership
 * 
 * This engine owns application-specific worker metadata (employee code, role, etc.).
 * 
 * It is separate from Authentication because Authentication only proves WHO the user is.
 * It is separate from User Context because User Context only tracks runtime identity.
 * Worker Profile holds the extended domain information about the worker.
 * 
 * Refresh operations must be atomic to ensure the application never experiences
 * a partial or missing profile state during a background update.
 */

let initialized = false;
let lifecycle = WorkerProfileLifecycle.EMPTY;
let currentProfile: WorkerProfile | null = null;
let lastLoadedAt: string | undefined;
let supabaseClient: SupabaseClient | null = null;

const DEFAULT_STATUS = Object.freeze({
  initialized: false,
  lifecycle: WorkerProfileLifecycle.EMPTY,
  lastLoadedAt: undefined
});

function deepCloneAndFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const cloned: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCloneAndFreeze((obj as any)[key]);
    }
  }
  return Object.freeze(cloned);
}

function clearInternal(): void {
  if (lifecycle !== WorkerProfileLifecycle.CLEARED && lifecycle !== WorkerProfileLifecycle.EMPTY) {
    lifecycle = WorkerProfileLifecycle.CLEARED;
  }
  currentProfile = null;
  lastLoadedAt = undefined;
}

function transitionTo(newLifecycle: WorkerProfileLifecycle): void {
  // Enforce valid transitions
  const valid = (
    (lifecycle === WorkerProfileLifecycle.EMPTY && (newLifecycle === WorkerProfileLifecycle.LOADING || newLifecycle === WorkerProfileLifecycle.CLEARED)) ||
    (lifecycle === WorkerProfileLifecycle.CLEARED && (newLifecycle === WorkerProfileLifecycle.LOADING || newLifecycle === WorkerProfileLifecycle.EMPTY)) ||
    (lifecycle === WorkerProfileLifecycle.LOADING && (newLifecycle === WorkerProfileLifecycle.READY || newLifecycle === WorkerProfileLifecycle.CLEARED)) ||
    (lifecycle === WorkerProfileLifecycle.READY && (newLifecycle === WorkerProfileLifecycle.REFRESHING || newLifecycle === WorkerProfileLifecycle.CLEARED)) ||
    (lifecycle === WorkerProfileLifecycle.REFRESHING && (newLifecycle === WorkerProfileLifecycle.READY || newLifecycle === WorkerProfileLifecycle.CLEARED))
  );

  if (!valid) {
    throw new Error(`Worker Profile Engine: Invalid lifecycle transition from ${lifecycle} to ${newLifecycle}`);
  }

  lifecycle = newLifecycle;
}

function validateProfile(profile: Partial<WorkerProfile>): profile is WorkerProfile {
  if (
    !profile.workerId ||
    !profile.employeeCode ||
    !profile.displayName ||
    !profile.email ||
    !profile.role ||
    !profile.organization ||
    profile.active === undefined
  ) {
    return false;
  }
  return true;
}

export const WorkerProfileEngine = {
  initialize(): void {
    ConfigurationEngine.load();
    const config = ConfigurationEngine.config.environment.supabase;
    supabaseClient = createClient(config.url, config.anonKey);
    
    initialized = true;
    lifecycle = WorkerProfileLifecycle.EMPTY;
    currentProfile = null;
    lastLoadedAt = undefined;
  },

  async load(): Promise<WorkerProfileResult> {
    if (!initialized) {
      throw new Error('Worker Profile Engine is not initialized');
    }

    if (lifecycle !== WorkerProfileLifecycle.EMPTY && lifecycle !== WorkerProfileLifecycle.CLEARED) {
      throw new Error(`Worker Profile Engine: Cannot load from state ${lifecycle}`);
    }

    transitionTo(WorkerProfileLifecycle.LOADING);

    try {
      const authUser = AuthenticationEngine.currentUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }

      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      // Temporary Supabase profile loading
      const { data, error } = await supabaseClient
        .from('workers')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        throw new Error(`Failed to load profile: ${error.message}`);
      }

      if (!data) {
        return Object.freeze({
          success: false,
          error: 'Profile not found',
          errorCode: WorkerProfileErrorCode.PROFILE_NOT_FOUND
        });
      }

      const rawProfile: WorkerProfile = {
        workerId: authUser.id,
        employeeCode: data.employee_code || data.employeeCode || `EMP-${authUser.id.substring(0,6)}`,
        displayName: data.display_name || data.displayName || authUser.email || 'Unknown',
        email: authUser.email || data.email || '',
        role: (data.role || 'WORKER') as WorkerRole,
        organization: data.organization || 'Sapana',
        active: data.active !== undefined ? Boolean(data.active) : true
      };

      if (!validateProfile(rawProfile)) {
        throw new Error('Invalid profile data loaded from remote.');
      }

      currentProfile = deepCloneAndFreeze(rawProfile);
      lastLoadedAt = new Date().toISOString();
      
      transitionTo(WorkerProfileLifecycle.READY);

      return Object.freeze({ success: true });
    } catch (error: any) {
      clearInternal(); // Reverts to CLEARED
      return Object.freeze({
        success: false,
        error: error.message || String(error),
        errorCode: WorkerProfileErrorCode.UNKNOWN_ERROR
      });
    }
  },

  async refresh(): Promise<WorkerProfileResult> {
    if (!initialized) {
      throw new Error('Worker Profile Engine is not initialized');
    }

    if (lifecycle !== WorkerProfileLifecycle.READY) {
      throw new Error(`Worker Profile Engine: Cannot refresh from state ${lifecycle}`);
    }

    transitionTo(WorkerProfileLifecycle.REFRESHING);

    try {
      const authUser = AuthenticationEngine.currentUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }

      if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabaseClient
        .from('workers')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        throw new Error(`Failed to refresh profile: ${error.message}`);
      }

      if (!data) {
        // Revert to READY, do not clear
        transitionTo(WorkerProfileLifecycle.READY);
        return Object.freeze({
          success: false,
          error: 'Profile not found',
          errorCode: WorkerProfileErrorCode.PROFILE_NOT_FOUND
        });
      }

      const rawProfile: WorkerProfile = {
        workerId: authUser.id,
        employeeCode: data.employee_code || data.employeeCode || `EMP-${authUser.id.substring(0,6)}`,
        displayName: data.display_name || data.displayName || authUser.email || 'Unknown',
        email: authUser.email || data.email || '',
        role: (data.role || 'WORKER') as WorkerRole,
        organization: data.organization || 'Sapana',
        active: data.active !== undefined ? Boolean(data.active) : true
      };

      if (!validateProfile(rawProfile)) {
         throw new Error('Invalid profile data loaded from remote.');
      }

      // Replace current profile only after validation
      currentProfile = deepCloneAndFreeze(rawProfile);
      lastLoadedAt = new Date().toISOString();
      
      transitionTo(WorkerProfileLifecycle.READY);

      return Object.freeze({ success: true });
    } catch (error: any) {
      // Revert to READY, do not clear
      transitionTo(WorkerProfileLifecycle.READY);
      return Object.freeze({
        success: false,
        error: error.message || String(error),
        errorCode: WorkerProfileErrorCode.UNKNOWN_ERROR
      });
    }
  },

  clear(): void {
    clearInternal();
  },

  status(): WorkerProfileStatus {
    if (!initialized) {
      return DEFAULT_STATUS;
    }
    return Object.freeze({
      initialized,
      lifecycle,
      lastLoadedAt
    });
  },

  profile(): WorkerProfile | null {
    if (lifecycle !== WorkerProfileLifecycle.READY && lifecycle !== WorkerProfileLifecycle.REFRESHING) {
      return null;
    }
    if (!currentProfile) {
      return null;
    }
    return currentProfile;
  }
};
