export enum SyncState {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING'
}

export enum SyncErrorCode {
  INVALID_LIFECYCLE_TRANSITION = 'INVALID_LIFECYCLE_TRANSITION',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface SyncStatus {
  readonly state: SyncState;
  readonly isRunning: boolean;
  readonly lastStartedAt?: string;
  readonly lastStoppedAt?: string;
  readonly lastSyncAttemptAt?: string;
  readonly consecutiveFailures: number;
}

export interface SyncResult {
  readonly success: boolean;
  readonly state: SyncState;
  readonly error?: string;
  readonly errorCode?: SyncErrorCode;
}
