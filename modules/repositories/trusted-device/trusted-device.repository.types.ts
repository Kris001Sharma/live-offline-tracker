export type TrustedDeviceStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface TrustedDeviceRecord {
  readonly id: string;
  readonly workerId: string;
  readonly deviceId: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly platform: string;
  readonly appVersion: string;
  readonly registeredAt: string;
  readonly approvedAt?: string;
  readonly approvedBy?: string;
  readonly status: TrustedDeviceStatus;
  readonly syncStatus: SyncStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TrustedDeviceRegistrationData {
  readonly id: string;
  readonly workerId: string;
  readonly deviceId: string;
  readonly manufacturer: string;
  readonly model: string;
  readonly platform: string;
  readonly appVersion: string;
  readonly registeredAt: string;
}
