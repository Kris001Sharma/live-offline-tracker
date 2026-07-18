import { StorageEngine } from '../../storage';
import { SyncQueueEntity } from '../repository.types';

export const SyncQueueRepository = {
  async enqueueEvent(item: SyncQueueEntity): Promise<void> {
    await StorageEngine.execute(
      `INSERT INTO sync_queue (id, event_id, status, retry_count, last_error, last_attempt_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.event_id, item.status, item.retry_count, item.last_error, item.last_attempt_at, item.created_at, item.updated_at]
    );
  },

  async updateSyncStatus(id: string, status: string, updatedAt: string, lastError: string | null = null): Promise<void> {
    await StorageEngine.execute(
      `UPDATE sync_queue SET status = ?, last_error = ?, updated_at = ? WHERE id = ?`,
      [status, lastError, updatedAt, id]
    );
  },

  async incrementRetryCount(id: string, updatedAt: string, lastAttemptAt: string): Promise<void> {
    await StorageEngine.execute(
      `UPDATE sync_queue SET retry_count = retry_count + 1, last_attempt_at = ?, updated_at = ? WHERE id = ?`,
      [lastAttemptAt, updatedAt, id]
    );
  },

  async getPendingQueue(limit = 50): Promise<SyncQueueEntity[]> {
    const result = await StorageEngine.execute<SyncQueueEntity>(
      `SELECT id, event_id, status, retry_count, last_error, last_attempt_at, created_at, updated_at FROM sync_queue WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
    return result.rows;
  }
};
