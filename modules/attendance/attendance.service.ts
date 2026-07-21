import { AttendanceState, AttendanceStatus, AttendanceResult, AttendanceErrorCode } from './attendance.types';
import { LocationProvider, LocationErrorCode } from '../location';
import { LocationEvaluationEngine, LocationEvaluationRequest } from '../location-evaluation';
import { ConfigurationEngine } from '../configuration';

let currentState: AttendanceState = AttendanceState.NOT_CHECKED_IN;
let checkedInAt: string | undefined;
let checkedOutAt: string | undefined;
let lastError: string | undefined;

/**
 * Restores the engine to its previous state if an operation fails or is rejected.
 * Attendance never owns GPS validation or location logic; it acts only as an orchestrator.
 * State and timestamps are only committed after a fully successful location validation.
 */
function rollback(state: AttendanceState, inAt: string | undefined, outAt: string | undefined): void {
  currentState = state;
  checkedInAt = inAt;
  checkedOutAt = outAt;
}

export const AttendanceEngine = {
  initialize(): void {
    currentState = AttendanceState.NOT_CHECKED_IN;
    checkedInAt = undefined;
    checkedOutAt = undefined;
    lastError = undefined;
  },

  async checkIn(): Promise<AttendanceResult> {
    if (currentState !== AttendanceState.NOT_CHECKED_IN && currentState !== AttendanceState.CHECKED_OUT) {
      throw new Error(`Attendance Engine: Cannot check in from state ${currentState}`);
    }

    const previousState = currentState;
    const previousInAt = checkedInAt;
    const previousOutAt = checkedOutAt;

    currentState = AttendanceState.CHECKING_IN;
    lastError = undefined;

    try {
      const config = ConfigurationEngine.config;
      const geofence = config.runtime.attendance?.geofence;

      if (!geofence || typeof geofence.center.latitude !== 'number' || typeof geofence.center.longitude !== 'number' || geofence.radiusMeters <= 0 || isNaN(geofence.center.latitude) || isNaN(geofence.center.longitude) || isNaN(geofence.radiusMeters)) {
        rollback(previousState, previousInAt, previousOutAt);
        return Object.freeze({
          success: false,
          state: currentState,
          error: 'Invalid attendance configuration',
          errorCode: AttendanceErrorCode.UNKNOWN_ERROR
        });
      }
      
      let location;
      try {
        location = await LocationProvider.getCurrentLocation();
      } catch (error: any) {
        rollback(previousState, previousInAt, previousOutAt);
        const code = error?.code === LocationErrorCode.PERMISSION_DENIED ? AttendanceErrorCode.PERMISSION_DENIED : AttendanceErrorCode.LOCATION_UNAVAILABLE;
        const msg = error?.message || 'Failed to acquire location';
        return Object.freeze({
          success: false,
          state: currentState,
          error: msg,
          errorCode: code
        });
      }

      const request: LocationEvaluationRequest = {
        currentLocation: location,
        options: {
          maxAccuracyMeters: config.runtime.gps.accuracyThresholdMeters,
          geofence
        }
      };

      const evaluation = LocationEvaluationEngine.evaluate(request);

      if (!evaluation.accepted) {
        rollback(previousState, previousInAt, previousOutAt);
        return Object.freeze({
          success: false,
          state: currentState,
          error: `Location validation failed: ${evaluation.reasons.join(', ')}`,
          errorCode: AttendanceErrorCode.LOCATION_EVALUATION_FAILED
        });
      }

      // Commit only after successful validation
      currentState = AttendanceState.CHECKED_IN;
      checkedInAt = new Date().toISOString();
      checkedOutAt = undefined;

      return Object.freeze({
        success: true,
        state: currentState,
        timestamp: checkedInAt
      });
    } catch (error) {
      rollback(previousState, previousInAt, previousOutAt);
      return Object.freeze({
        success: false,
        state: currentState,
        error: error instanceof Error ? error.message : String(error),
        errorCode: AttendanceErrorCode.UNKNOWN_ERROR
      });
    }
  },

  async checkOut(): Promise<AttendanceResult> {
    if (currentState !== AttendanceState.CHECKED_IN) {
      throw new Error(`Attendance Engine: Cannot check out from state ${currentState}`);
    }

    const previousState = currentState;
    const previousInAt = checkedInAt;
    const previousOutAt = checkedOutAt;

    currentState = AttendanceState.CHECKING_OUT;
    lastError = undefined;

    try {
      const config = ConfigurationEngine.config;
      const geofence = config.runtime.attendance?.geofence;

      if (!geofence || typeof geofence.center.latitude !== 'number' || typeof geofence.center.longitude !== 'number' || geofence.radiusMeters <= 0 || isNaN(geofence.center.latitude) || isNaN(geofence.center.longitude) || isNaN(geofence.radiusMeters)) {
        rollback(previousState, previousInAt, previousOutAt);
        return Object.freeze({
          success: false,
          state: currentState,
          error: 'Invalid attendance configuration',
          errorCode: AttendanceErrorCode.UNKNOWN_ERROR
        });
      }
      
      let location;
      try {
        location = await LocationProvider.getCurrentLocation();
      } catch (error: any) {
        rollback(previousState, previousInAt, previousOutAt);
        const code = error?.code === LocationErrorCode.PERMISSION_DENIED ? AttendanceErrorCode.PERMISSION_DENIED : AttendanceErrorCode.LOCATION_UNAVAILABLE;
        const msg = error?.message || 'Failed to acquire location';
        return Object.freeze({
          success: false,
          state: currentState,
          error: msg,
          errorCode: code
        });
      }

      const request: LocationEvaluationRequest = {
        currentLocation: location,
        options: {
          maxAccuracyMeters: config.runtime.gps.accuracyThresholdMeters,
          geofence
        }
      };

      const evaluation = LocationEvaluationEngine.evaluate(request);

      if (!evaluation.accepted) {
        rollback(previousState, previousInAt, previousOutAt);
        return Object.freeze({
          success: false,
          state: currentState,
          error: `Location validation failed: ${evaluation.reasons.join(', ')}`,
          errorCode: AttendanceErrorCode.LOCATION_EVALUATION_FAILED
        });
      }

      // Commit only after successful validation
      currentState = AttendanceState.CHECKED_OUT;
      checkedOutAt = new Date().toISOString();

      return Object.freeze({
        success: true,
        state: currentState,
        timestamp: checkedOutAt
      });
    } catch (error) {
      rollback(previousState, previousInAt, previousOutAt);
      return Object.freeze({
        success: false,
        state: currentState,
        error: error instanceof Error ? error.message : String(error),
        errorCode: AttendanceErrorCode.UNKNOWN_ERROR
      });
    }
  },

  status(): AttendanceStatus {
    return Object.freeze({
      state: currentState,
      checkedInAt,
      checkedOutAt,
      lastError
    });
  }
};
