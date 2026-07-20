import { TrackingState, TrackingStatus, ProcessLocationResult } from './tracking.types';
import { EventEngine } from '../event';
import { EventType, TrackingSample } from '../domain';
import { LocationEvaluationEngine, LocationEvaluationRequest } from '../location-evaluation';
import { Location } from '../location';
import { EventRepository } from '../repositories';
import { ConfigurationEngine } from '../configuration';

let currentState: TrackingState = TrackingState.STOPPED;
let lastError: string | undefined;
let startedAt: string | undefined;

export const TrackingEngine = {
  initialize(): void {
    currentState = TrackingState.STOPPED;
    lastError = undefined;
    startedAt = undefined;
  },

  async start(): Promise<void> {
    if (currentState !== TrackingState.STOPPED) {
      throw new Error(`Tracking Engine: Cannot start from state ${currentState}`);
    }

    currentState = TrackingState.STARTING;

    try {
      await EventEngine.createEvent({
        type: EventType.TRACKING_STARTED,
        workerId: 'SYSTEM',
        payload: {}
      });

      currentState = TrackingState.RUNNING;
      startedAt = new Date().toISOString();
      lastError = undefined;
    } catch (error) {
      currentState = TrackingState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      
      try {
        await EventEngine.createEvent({
          type: EventType.TRACKING_ERROR,
          workerId: 'SYSTEM',
          payload: { error: lastError }
        });
      } catch (innerError) {
        // Suppress inner errors
      }
      
      throw error;
    }
  },

  async stop(): Promise<void> {
    if (currentState !== TrackingState.RUNNING && currentState !== TrackingState.PAUSED) {
      throw new Error(`Tracking Engine: Cannot stop from state ${currentState}`);
    }

    currentState = TrackingState.STOPPING;

    try {
      await EventEngine.createEvent({
        type: EventType.TRACKING_STOPPED,
        workerId: 'SYSTEM',
        payload: {}
      });

      currentState = TrackingState.STOPPED;
      startedAt = undefined;
    } catch (error) {
      currentState = TrackingState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  },

  async pause(): Promise<void> {
    if (currentState !== TrackingState.RUNNING) {
      throw new Error(`Tracking Engine: Cannot pause from state ${currentState}`);
    }

    currentState = TrackingState.PAUSED;

    try {
      await EventEngine.createEvent({
        type: EventType.TRACKING_PAUSED,
        workerId: 'SYSTEM',
        payload: {}
      });
    } catch (error) {
      currentState = TrackingState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  },

  async resume(): Promise<void> {
    if (currentState !== TrackingState.PAUSED) {
      throw new Error(`Tracking Engine: Cannot resume from state ${currentState}`);
    }

    currentState = TrackingState.RUNNING;

    try {
      await EventEngine.createEvent({
        type: EventType.TRACKING_RESUMED,
        workerId: 'SYSTEM',
        payload: {}
      });
    } catch (error) {
      currentState = TrackingState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  },

  status(): TrackingStatus {
    return {
      state: currentState,
      lastError,
      startedAt
    };
  },

  async processLocation(location: Location): Promise<ProcessLocationResult> {
    if (currentState !== TrackingState.RUNNING) {
      throw new Error(`Tracking Engine: Cannot process location in state ${currentState}`);
    }

    // TODO (Roadmap): Replace EventRepository lookup with LocationRepository once the dedicated repository is introduced. EventRepository should remain responsible only for operational history.
    const lastEvent = await EventRepository.getLatestEventByType(EventType.GPS_RECORDED);
    let previousLocation: Location | undefined;
    let previousTimestamp: string | undefined;

    if (lastEvent) {
      try {
        const sample = JSON.parse(lastEvent.event_data) as TrackingSample;
        previousLocation = {
          latitude: sample.coordinates.latitude,
          longitude: sample.coordinates.longitude,
          accuracy: sample.coordinates.accuracy,
          timestamp: sample.timestamp,
          altitude: sample.coordinates.altitude,
          heading: sample.coordinates.heading,
          speed: sample.coordinates.speed
        };
        previousTimestamp = sample.timestamp;
      } catch (err) {
        // Invalid previous location format, ignore
      }
    }

    const config = ConfigurationEngine.config;

    const request: LocationEvaluationRequest = {
      currentLocation: location,
      previousLocation,
      previousTimestamp,
      options: {
        maxAccuracyMeters: config.runtime.gps.accuracyThresholdMeters
      }
    };

    const evaluation = LocationEvaluationEngine.evaluate(request);

    if (evaluation.accepted) {
      const payload: TrackingSample = {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          altitude: location.altitude ?? null,
          heading: location.heading ?? null,
          speed: location.speed ?? null
        },
        timestamp: location.timestamp,
        isMocked: false
      };
      
      await EventEngine.createEvent({
        type: EventType.GPS_RECORDED,
        workerId: 'SYSTEM',
        payload
      });
    } else {
      await EventEngine.createEvent({
        type: EventType.LOCATION_REJECTED,
        workerId: 'SYSTEM',
        payload: {
          location,
          reasons: evaluation.reasons,
          measurements: evaluation.measurements
        }
      });
    }

    return {
      location,
      evaluation
    };
  }
};
