import { CurrentWorker, UserContextStatus, WorkerRole } from './user-context.types';

let initialized = false;
let worker: CurrentWorker | null = null;
let lastUpdatedAt: string | undefined;

function freezeWorker(w: CurrentWorker): CurrentWorker {
  return Object.freeze({ ...w });
}

export const UserContextEngine = {
  initialize(): void {
    initialized = true;
    worker = null;
    lastUpdatedAt = undefined;
  },

  setCurrentWorker(newWorker: CurrentWorker): void {
    if (!newWorker.id || !newWorker.email || !newWorker.role) {
      throw new Error('User Context Engine: Worker must have id, email, and role.');
    }
    worker = freezeWorker(newWorker);
    lastUpdatedAt = new Date().toISOString();
  },

  clear(): void {
    worker = null;
    lastUpdatedAt = undefined;
  },

  status(): UserContextStatus {
    return Object.freeze({
      initialized,
      authenticated: !!worker,
      currentWorkerId: worker?.id,
      role: worker?.role,
      lastUpdatedAt
    });
  },

  currentWorker(): CurrentWorker | null {
    if (!worker) return null;
    return worker; // already frozen
  },

  workerId(): string | null {
    return worker?.id || null;
  },

  role(): WorkerRole | null {
    return worker?.role || null;
  },

  isAuthenticated(): boolean {
    return !!worker;
  }
};
