import { AttendanceState, AttendanceStatus, AttendanceResult } from './attendance.types';

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

    currentState = AttendanceState.CHECKING_IN;
    lastError = undefined;

    try {
      // In this slice, we simply transition the state and record the timestamp.
      currentState = AttendanceState.CHECKED_IN;
      checkedInAt = new Date().toISOString();
      checkedOutAt = undefined; // Reset checkout if checking in again

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
        error: lastError
      });
    }
  },

  async checkOut(): Promise<AttendanceResult> {
    if (currentState !== AttendanceState.CHECKED_IN) {
      throw new Error(`Attendance Engine: Cannot check out from state ${currentState}`);
    }

    currentState = AttendanceState.CHECKING_OUT;

    try {
      // In this slice, we simply transition the state and record the timestamp.
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
        error: lastError
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
