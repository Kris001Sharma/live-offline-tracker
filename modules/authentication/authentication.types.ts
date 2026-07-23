export enum AuthenticationState {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATING = 'AUTHENTICATING',
  AUTHENTICATED = 'AUTHENTICATED',
  REFRESHING = 'REFRESHING',
  LOGGING_OUT = 'LOGGING_OUT'
}

export enum AuthenticationErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AuthenticationStatus {
  readonly state: AuthenticationState;
  readonly userId?: string;
  readonly lastError?: string;
}

export interface AuthenticationResult {
  readonly success: boolean;
  readonly state: AuthenticationState;
  readonly error?: string;
  readonly errorCode?: AuthenticationErrorCode;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
}
