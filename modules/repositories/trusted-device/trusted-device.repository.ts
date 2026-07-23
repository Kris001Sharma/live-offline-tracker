import { StorageEngine } from '../../storage';
import { TrustedDeviceRecord, TrustedDeviceRegistrationData, TrustedDeviceStatus, SyncStatus } from './trusted-device.repository.types';

function mapRowToRecord(row: any): TrustedDeviceRecord {
  return {
    id: row.id,
    workerId: row.worker_id,
    deviceId: row.device_id,
    manufacturer: row.manufacturer,
    model: row.model,
    platform: row.platform,
    appVersion: row.app_version,
    registeredAt: row.registered_at,
    approvedAt: row.approved_at || undefined,
    approvedBy: row.approved_by || undefined,
    status: row.status as TrustedDeviceStatus,
    syncStatus: row.sync_status as SyncStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const TrustedDeviceRepository = {
  async register(data: TrustedDeviceRegistrationData): Promise<void> {
    const now = new Date().toISOString();
    const status: TrustedDeviceStatus = 'PENDING_APPROVAL';
    const syncStatus: SyncStatus = 'PENDING';
    
    await StorageEngine.execute(`
      INSERT INTO trusted_devices (
        id, worker_id, device_id, manufacturer, model, platform, app_version,
        registered_at, status, sync_status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `, [
      data.id,
      data.workerId,
      data.deviceId,
      data.manufacturer,
      data.model,
      data.platform,
      data.appVersion,
      data.registeredAt,
      status,
      syncStatus,
      now,
      now
    ]);
  },

  async findByWorker(workerId: string): Promise<TrustedDeviceRecord[]> {
    const result = await StorageEngine.execute(`
      SELECT * FROM trusted_devices WHERE worker_id = ?
    `, [workerId]);
    return result.rows.map(mapRowToRecord);
  },

  async findByDevice(deviceId: string): Promise<TrustedDeviceRecord[]> {
    const result = await StorageEngine.execute(`
      SELECT * FROM trusted_devices WHERE device_id = ?
    `, [deviceId]);
    return result.rows.map(mapRowToRecord);
  },

  async findPending(): Promise<TrustedDeviceRecord[]> {
    const result = await StorageEngine.execute(`
      SELECT * FROM trusted_devices WHERE status = 'PENDING_APPROVAL'
    `);
    return result.rows.map(mapRowToRecord);
  },

  async approve(id: string, approvedBy: string): Promise<void> {
    const now = new Date().toISOString();
    await StorageEngine.execute(`
      UPDATE trusted_devices
      SET status = 'APPROVED', approved_at = ?, approved_by = ?, sync_status = 'PENDING', updated_at = ?
      WHERE id = ?
    `, [now, approvedBy, now, id]);
  },

  async reject(id: string): Promise<void> {
    const now = new Date().toISOString();
    await StorageEngine.execute(`
      UPDATE trusted_devices
      SET status = 'REJECTED', sync_status = 'PENDING', updated_at = ?
      WHERE id = ?
    `, [now, id]);
  },

  async markSynced(id: string): Promise<void> {
    const now = new Date().toISOString();
    await StorageEngine.execute(`
      UPDATE trusted_devices
      SET sync_status = 'SYNCED', updated_at = ?
      WHERE id = ?
    `, [now, id]);
  }
};
