import { AttendanceState, AttendanceStatus, AttendanceResult, AttendanceErrorCode } from './attendance.types';
import { LocationProvider, LocationErrorCode } from '../location';
import { LocationEvaluationEngine, LocationEvaluationRequest } from '../location-evaluation';
import { ConfigurationEngine } from '../configuration';

let currentState: AttendanceState = AttendanceState.NOT_CHECKED_IN;
let checkedInAt: string | undefined;
let checkedOutAt: string | undefined;
let lastError: string | undefined;

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
    currentState = AttendanceState.CHECKING_IN;
    lastError = undefined;

    try {
      const config = ConfigurationEngine.config;
      
      let location;
      try {
        location = await LocationProvider.getCurrentLocation();
      } catch (error: any) {
        currentState = previousState;
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
          geofence: config.runtime.attendance?.geofence
        }
      };

      const evaluation = LocationEvaluationEngine.evaluate(request);

      if (!evaluation.accepted) {
        currentState = previousState;
        return Object.freeze({
          success: false,
          state: currentState,
          error: `Location validation failed: ${evaluation.reasons.join(', ')}`,
          errorCode: AttendanceErrorCode.LOCATION_EVALUATION_FAILED
        });
      }

      currentState = AttendanceState.CHECKED_IN;
      checkedInAt = new Date().toISOString();
      checkedOutAt = undefined;

      return Object.freeze({
        success: true,
        state: currentState,
        timestamp: checkedInAt
      });
    } catch (error) {
      currentState = AttendanceState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      
      return Object.freeze({
        success: false,
        state: currentState,
        error: lastError,
        errorCode: AttendanceErrorCode.UNKNOWN_ERROR
      });
    }
  },

  async checkOut(): Promise<AttendanceResult> {
    if (currentState !== AttendanceState.CHECKED_IN) {
      throw new Error(`Attendance Engine: Cannot check out from state ${currentState}`);
    }

    const previousState = currentState;
    currentState = AttendanceState.CHECKING_OUT;

    try {
      const config = ConfigurationEngine.config;
      
      let location;
      try {
        location = await LocationProvider.getCurrentLocation();
      } catch (error: any) {
        currentState = previousState;
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
          geofence: config.runtime.attendance?.geofence
        }
      };

      const evaluation = LocationEvaluationEngine.evaluate(request);

      if (!evaluation.accepted) {
        currentState = previousState;
        return Object.freeze({
          success: false,
          state: currentState,
          error: `Location validation failed: ${evaluation.reasons.join(', ')}`,
          errorCode: AttendanceErrorCode.LOCATION_EVALUATION_FAILED
        });
      }

      currentState = AttendanceState.CHECKED_OUT;
      checkedOutAt = new Date().toISOString();

      return Object.freeze({
        success: true,
        state: currentState,
        timestamp: checkedOutAt
      });
    } catch (error) {
      currentState = AttendanceState.ERROR;
      lastError = error instanceof Error ? error.message : String(error);
      
      return Object.freeze({
        success: false,
        state: currentState,
        error: lastError,
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
