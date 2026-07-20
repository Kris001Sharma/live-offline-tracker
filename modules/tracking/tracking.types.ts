import { Location } from '../location';
import { LocationEvaluationResult } from '../location-evaluation';

export enum TrackingState {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR'
}

export interface TrackingStatus {
  readonly state: TrackingState;
  readonly lastError?: string;
  readonly startedAt?: string;
}

export interface ProcessLocationResult {
  readonly location: Location;
  readonly evaluation: LocationEvaluationResult;
}
