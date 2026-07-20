import { SessionState, SessionStatus } from './tracking-session.types';
import { ConfigurationEngine } from '../configuration';
import { LocationProvider } from '../location';
import { TrackingEngine } from '../tracking';

/**
 * TrackingSession decides **when** a location is collected.
 * TrackingEngine decides **what happens** to that location.
 */

let currentState: SessionState = SessionState.STOPPED;
let lastError: string | undefined;
let timerId: ReturnType<typeof setInterval> | undefined;

async function executeCycle(): Promise<void> {
  if (currentState !== SessionState.RUNNING) {
    return;
  }
  try {
    const location = await LocationProvider.getCurrentLocation();
    await TrackingEngine.processLocation(location);
  } catch (error) {
    // Failures retrieving a location must not terminate the scheduler,
    // not reset the session, and allow the next interval to continue.
  }
}

function startTimer(intervalMs: number): void {
  if (timerId !== undefined) {
    clearInterval(timerId);
  }
  // The scheduler intentionally uses standard setInterval().
  // Do not attempt drift correction. Long-running compensation strategies are outside MVP.
  timerId = setInterval(() => {
    executeCycle(); // Fire and forget
  }, intervalMs);
}

function stopTimer(): void {
  if (timerId !== undefined) {
    clearInterval(timerId);
    timerId = undefined;
  }
}

export const TrackingSession = {
  initialize(): void {
    stopTimer();
    currentState = SessionState.STOPPED;
    lastError = undefined;
  },

  async start(): Promise<void> {
    if (currentState !== SessionState.STOPPED) {
      throw new Error(`Tracking Session: Cannot start from state ${currentState}`);
    }

    currentState = SessionState.STARTING;

    try {
      const config = ConfigurationEngine.config;
      const intervalMs = config.runtime.tracking.intervalMs;

      startTimer(intervalMs);

      currentState = SessionState.RUNNING;
      lastError = undefined;
    } catch (error) {
      currentState = SessionState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      stopTimer();
      throw error;
    }
  },

  async stop(): Promise<void> {
    if (currentState !== SessionState.RUNNING && currentState !== SessionState.PAUSED) {
      throw new Error(`Tracking Session: Cannot stop from state ${currentState}`);
    }

    currentState = SessionState.STOPPING;
    stopTimer();
    currentState = SessionState.STOPPED;
  },

  async pause(): Promise<void> {
    if (currentState !== SessionState.RUNNING) {
      throw new Error(`Tracking Session: Cannot pause from state ${currentState}`);
    }

    currentState = SessionState.PAUSED;
    stopTimer();
  },

  async resume(): Promise<void> {
    if (currentState !== SessionState.PAUSED) {
      throw new Error(`Tracking Session: Cannot resume from state ${currentState}`);
    }

    currentState = SessionState.RUNNING;
    
    try {
      // Always obtain the latest tracking interval from ConfigurationEngine to allow runtime updates.
      const config = ConfigurationEngine.config;
      const intervalMs = config.runtime.tracking.intervalMs;

      startTimer(intervalMs);
    } catch (error) {
      currentState = SessionState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      stopTimer();
      throw error;
    }
  },

  status(): SessionStatus {
    return {
      state: currentState,
      lastError
    };
  }
};
