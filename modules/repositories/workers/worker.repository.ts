import { StorageEngine } from '../../storage';
import { WorkerEntity } from '../repository.types';

export const WorkerRepository = {
  async createWorker(worker: WorkerEntity): Promise<void> {
    await StorageEngine.execute(
      `INSERT INTO workers (id, external_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [worker.id, worker.external_id, worker.name, worker.created_at, worker.updated_at]
    );
  },

  async getActiveWorker(): Promise<WorkerEntity | null> {
    const result = await StorageEngine.execute<WorkerEntity>(
      `SELECT id, external_id, name, created_at, updated_at FROM workers LIMIT 1`
    );
    return result.rows[0] ?? null;
  },

  async updateWorker(worker: Pick<WorkerEntity, 'id' | 'name' | 'updated_at'>): Promise<void> {
    await StorageEngine.execute(
      `UPDATE workers SET name = ?, updated_at = ? WHERE id = ?`,
      [worker.name, worker.updated_at, worker.id]
    );
  }
};
