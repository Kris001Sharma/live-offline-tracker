import { StorageEngine } from '../../storage';
import { EventEntity } from '../repository.types';

export const EventRepository = {
  async appendEvent(event: EventEntity): Promise<void> {
    await StorageEngine.execute(
      `INSERT INTO events (id, event_type, event_data, occurred_at, worker_id, shift_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [event.id, event.event_type, event.event_data, event.occurred_at, event.worker_id, event.shift_id]
    );
  },

  async getEvents(limit = 100, offset = 0): Promise<EventEntity[]> {
    const result = await StorageEngine.execute<EventEntity>(
      `SELECT id, event_type, event_data, occurred_at, worker_id, shift_id FROM events ORDER BY occurred_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return result.rows;
  },

  async getUnsyncedEvents(): Promise<EventEntity[]> {
    const result = await StorageEngine.execute<EventEntity>(
      `SELECT e.id, e.event_type, e.event_data, e.occurred_at, e.worker_id, e.shift_id FROM events e
       JOIN sync_queue q ON e.id = q.event_id
       WHERE q.status IN ('PENDING', 'FAILED')
       ORDER BY e.occurred_at ASC`
    );
    return result.rows;
  },

  async getEventsByShift(shiftId: string): Promise<EventEntity[]> {
    const result = await StorageEngine.execute<EventEntity>(
      `SELECT id, event_type, event_data, occurred_at, worker_id, shift_id FROM events WHERE shift_id = ? ORDER BY occurred_at ASC`,
      [shiftId]
    );
    return result.rows;
  }
};
