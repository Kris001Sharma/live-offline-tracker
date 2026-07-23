import { SyncState, SyncStatus } from './sync.types';

export const SYNC_ENGINE_VERSION = '1.0.0';

export const DEFAULT_SYNC_STATUS: SyncStatus = Object.freeze({
  state: SyncState.STOPPED,
  isRunning: false,
  consecutiveFailures: 0
});
