export enum AttendanceState {
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  CHECKING_IN = 'CHECKING_IN',
  CHECKED_IN = 'CHECKED_IN',
  CHECKING_OUT = 'CHECKING_OUT',
  CHECKED_OUT = 'CHECKED_OUT',
  ERROR = 'ERROR'
}

export interface AttendanceStatus {
  readonly state: AttendanceState;
  readonly checkedInAt?: string;
  readonly checkedOutAt?: string;
  readonly lastError?: string;
}

export interface AttendanceResult {
  readonly success: boolean;
  readonly state: AttendanceState;
  readonly timestamp?: string;
  readonly error?: string;
}
