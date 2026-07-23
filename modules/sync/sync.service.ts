import { 
  SyncState, 
  SyncStatus, 
  SyncResult, 
  SyncErrorCode 
} from './sync.types';
import { DEFAULT_SYNC_STATUS } from './sync.constants';

/**
 * Offline Synchronization Engine
 * 
 * Architectural Responsibilities:
 * - Sync Engine owns synchronization orchestration only.
 * - Upload logic belongs to later slices.
 * - Connectivity monitoring belongs to later slices.
 * - Repository interaction and SQLite belong to later slices.
 * - Authentication integration belongs to later slices.
 */

/**
 * Deep clones and deep freezes an object recursively to ensure immutability.
 */
function deepCloneAndFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    const arrCopy = obj.map(item => deepCloneAndFreeze(item));
    return Object.freeze(arrCopy) as unknown as T;
  }
  const copy: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCloneAndFreeze((obj as Record<string, any>)[key]);
    }
  }
  return Object.freeze(copy) as unknown as T;
}

function freezeResult(result: SyncResult): SyncResult {
  return deepCloneAndFreeze(result);
}

let currentState: SyncState = SyncState.STOPPED;
let isRunning: boolean = false;
let lastStartedAt: string | undefined;
let lastStoppedAt: string | undefined;
let lastSyncAttemptAt: string | undefined;
let consecutiveFailures: number = 0;

// Rollback state
let previousState: SyncState = SyncState.STOPPED;
let previousIsRunning: boolean = false;
let previousLastStartedAt: string | undefined;
let previousLastStoppedAt: string | undefined;
let previousLastSyncAttemptAt: string | undefined;
let previousConsecutiveFailures: number = 0;

function saveStateForRollback(): void {
  previousState = currentState;
  previousIsRunning = isRunning;
  previousLastStartedAt = lastStartedAt;
  previousLastStoppedAt = lastStoppedAt;
  previousLastSyncAttemptAt = lastSyncAttemptAt;
  previousConsecutiveFailures = consecutiveFailures;
}

function rollbackSync(): void {
  currentState = previousState;
  isRunning = previousIsRunning;
  lastStartedAt = previousLastStartedAt;
  lastStoppedAt = previousLastStoppedAt;
  lastSyncAttemptAt = previousLastSyncAttemptAt;
  consecutiveFailures = previousConsecutiveFailures;
}

function commitState(): void {
  saveStateForRollback();
}

/**
 * Single reset path for the engine.
 * Ensures state is cleared safely and deterministically.
 */
function clearInternal(): void {
  currentState = SyncState.STOPPED;
  isRunning = false;
  lastStartedAt = undefined;
  lastStoppedAt = undefined;
  lastSyncAttemptAt = undefined;
  consecutiveFailures = 0;
}

export const SyncEngine = {
  initialize(): void {
    clearInternal();
    saveStateForRollback();
  },

  async start(): Promise<SyncResult> {
    if (currentState !== SyncState.STOPPED) {
      return freezeResult({
        success: false,
        state: currentState,
        error: `Sync Engine: Cannot start from state ${currentState}`,
        errorCode: SyncErrorCode.INVALID_LIFECYCLE_TRANSITION
      });
    }

    saveStateForRollback();
    currentState = SyncState.STARTING;
    
    try {
      // Future slices will inject actual start logic here
      
      currentState = SyncState.RUNNING;
      isRunning = true;
      lastStartedAt = new Date().toISOString();
      commitState();

      return freezeResult({
        success: true,
        state: currentState
      });
    } catch (error: any) {
      rollbackSync();
      return freezeResult({
        success: false,
        state: currentState,
        error: error.message || String(error),
        errorCode: SyncErrorCode.UNKNOWN_ERROR
      });
    }
  },

  async stop(): Promise<SyncResult> {
    if (currentState !== SyncState.RUNNING) {
      return freezeResult({
        success: false,
        state: currentState,
        error: `Sync Engine: Cannot stop from state ${currentState}`,
        errorCode: SyncErrorCode.INVALID_LIFECYCLE_TRANSITION
      });
    }

    saveStateForRollback();
    currentState = SyncState.STOPPING;

    try {
      // Future slices will inject actual stop logic here

      currentState = SyncState.STOPPED;
      isRunning = false;
      lastStoppedAt = new Date().toISOString();
      commitState();

      return freezeResult({
        success: true,
        state: currentState
      });
    } catch (error: any) {
      rollbackSync();
      return freezeResult({
        success: false,
        state: currentState,
        error: error.message || String(error),
        errorCode: SyncErrorCode.UNKNOWN_ERROR
      });
    }
  },

  status(): SyncStatus {
    try {
      return deepCloneAndFreeze({
        state: currentState,
        isRunning,
        lastStartedAt,
        lastStoppedAt,
        lastSyncAttemptAt,
        consecutiveFailures
      });
    } catch (e) {
      return deepCloneAndFreeze({ ...DEFAULT_SYNC_STATUS });
    }
  }
};
