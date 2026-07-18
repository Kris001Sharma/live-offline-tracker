export interface WorkerEntity {
  id: string;
  external_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftEntity {
  id: string;
  worker_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export interface EventEntity {
  id: string;
  event_type: string;
  event_data: string;
  occurred_at: string;
  worker_id: string;
  shift_id: string | null;
}

export interface SyncQueueEntity {
  id: string;
  event_id: string;
  status: string;
  retry_count: number;
  last_error: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}
