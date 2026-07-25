import { WorkerRepository, WorkerRepositoryErrorCode, WorkerRepositoryError } from '../repositories';
import { WorkerSyncEngine } from '../worker-sync';
import {
  WorkerAdminLifecycle,
  WorkerAdminStatus,
  WorkerAdminResult,
  WorkerAdminErrorCode,
  WorkerAdminError,
  WorkerAdminOperationType,
  WorkerCreationPayload,
  WorkerUpdatePayload,
  WorkerAdminRecord
} from './worker-administration.types';

let initialized = false;
let lifecycle = WorkerAdminLifecycle.IDLE;
let lastOperationAt: string | undefined;
let lastSuccessfulOperationAt: string | undefined;
let lastFailedOperationAt: string | undefined;
let lastOperationType: WorkerAdminOperationType | undefined;
let consecutiveFailures = 0;

let pendingSync = false;
let lastSyncNotificationAt: string | undefined;


const DEFAULT_STATUS = Object.freeze({
  initialized: false,
  lifecycle: WorkerAdminLifecycle.IDLE,
  consecutiveFailures: 0,
  pendingSync: false,
  lastSyncNotificationAt: undefined
});

function deepCloneAndFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  const cloned: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCloneAndFreeze((obj as any)[key]);
    }
  }
  return Object.freeze(cloned);
}

function clearInternal(): void {
  initialized = false;
  lifecycle = WorkerAdminLifecycle.IDLE;
  lastOperationAt = undefined;
  lastSuccessfulOperationAt = undefined;
  lastFailedOperationAt = undefined;
  lastOperationType = undefined;
  consecutiveFailures = 0;
  pendingSync = false;
  lastSyncNotificationAt = undefined;
}

function transitionTo(newLifecycle: WorkerAdminLifecycle): void {
  const valid = (
    (lifecycle === WorkerAdminLifecycle.IDLE && newLifecycle === WorkerAdminLifecycle.PROCESSING) ||
    (lifecycle === WorkerAdminLifecycle.PROCESSING && newLifecycle === WorkerAdminLifecycle.IDLE)
  );

  if (!valid) {
    throw new WorkerAdminError(
      WorkerAdminErrorCode.ALREADY_PROCESSING,
      `Worker Admin Engine: Invalid lifecycle transition from ${lifecycle} to ${newLifecycle}`
    );
  }

  lifecycle = newLifecycle;
}

function recordOperationStart(type: WorkerAdminOperationType): void {
  transitionTo(WorkerAdminLifecycle.PROCESSING);
  lastOperationAt = new Date().toISOString();
  lastOperationType = type;
}

function recordOperationSuccess(): void {
  lastSuccessfulOperationAt = new Date().toISOString();
  consecutiveFailures = 0;
  transitionTo(WorkerAdminLifecycle.IDLE);
}

function recordOperationFailure(): void {
  lastFailedOperationAt = new Date().toISOString();
  consecutiveFailures++;
  transitionTo(WorkerAdminLifecycle.IDLE);
}

function mapRepositoryError(error: any): WorkerAdminErrorCode {
  if (error instanceof WorkerRepositoryError) {
    switch (error.code) {
      case WorkerRepositoryErrorCode.WORKER_NOT_FOUND:
        return WorkerAdminErrorCode.WORKER_NOT_FOUND;
      case WorkerRepositoryErrorCode.WORKER_ALREADY_EXISTS:
        return WorkerAdminErrorCode.WORKER_ALREADY_EXISTS;
      case WorkerRepositoryErrorCode.STORAGE_ERROR:
        return WorkerAdminErrorCode.STORAGE_ERROR;
      default:
        return WorkerAdminErrorCode.UNKNOWN_ERROR;
    }
  }
  return WorkerAdminErrorCode.UNKNOWN_ERROR;
}


function notifySync(): void {
  pendingSync = true;
  lastSyncNotificationAt = new Date().toISOString();
  
  // Asynchronous fire-and-forget
  Promise.resolve().then(async () => {
    try {
      await WorkerSyncEngine.sync();
      // We don't change pendingSync on success or failure, because this is just metadata in Admin engine.
    } catch (e) {
      // Intentionally swallow errors to keep notification non-blocking
    }
  });
}

export const WorkerAdminEngine = {
  initialize(): void {
    clearInternal();
    initialized = true;
  },

  async createWorker(payload: WorkerCreationPayload): Promise<WorkerAdminResult<WorkerAdminRecord>> {
    if (!initialized) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine not initialized',
        errorCode: WorkerAdminErrorCode.UNINITIALIZED
      });
    }
    
    if (lifecycle !== WorkerAdminLifecycle.IDLE) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine is already processing an operation',
        errorCode: WorkerAdminErrorCode.ALREADY_PROCESSING
      });
    }

    if (!payload.workerId || !payload.email || !payload.displayName || !payload.role) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Validation failed: workerId, email, displayName, and role are required',
        errorCode: WorkerAdminErrorCode.VALIDATION_ERROR
      });
    }

    recordOperationStart(WorkerAdminOperationType.CREATE);

    try {
      const record = await WorkerRepository.create({
        workerId: payload.workerId,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
        employeeCode: payload.employeeCode,
        organization: payload.organization,
        active: payload.active !== undefined ? payload.active : true
      });

      recordOperationSuccess();
      notifySync();

      return deepCloneAndFreeze({
        success: true,
        data: record as WorkerAdminRecord
      });
    } catch (error: any) {
      recordOperationFailure();
      return deepCloneAndFreeze({
        success: false,
        error: error.message || String(error),
        errorCode: mapRepositoryError(error)
      });
    }
  },

  async updateWorker(workerId: string, payload: WorkerUpdatePayload): Promise<WorkerAdminResult<WorkerAdminRecord>> {
    if (!initialized) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine not initialized',
        errorCode: WorkerAdminErrorCode.UNINITIALIZED
      });
    }

    if (lifecycle !== WorkerAdminLifecycle.IDLE) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine is already processing an operation',
        errorCode: WorkerAdminErrorCode.ALREADY_PROCESSING
      });
    }

    if (!workerId) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Validation failed: workerId is required',
        errorCode: WorkerAdminErrorCode.VALIDATION_ERROR
      });
    }

    recordOperationStart(WorkerAdminOperationType.UPDATE);

    try {
      const existing = await WorkerRepository.findById(workerId);
      if (!existing) {
        throw new WorkerRepositoryError(WorkerRepositoryErrorCode.WORKER_NOT_FOUND, 'Worker not found');
      }

      // Map payload to repository update payload implicitly
      const record = await WorkerRepository.update(workerId, {
        email: payload.email, // If repository update payload supports email
        displayName: payload.displayName,
        role: payload.role,
        employeeCode: payload.employeeCode,
        organization: payload.organization,
        active: payload.active
      } as any);
      
      recordOperationSuccess();
      notifySync();

      return deepCloneAndFreeze({
        success: true,
        data: record as WorkerAdminRecord
      });
    } catch (error: any) {
      recordOperationFailure();
      return deepCloneAndFreeze({
        success: false,
        error: error.message || String(error),
        errorCode: mapRepositoryError(error)
      });
    }
  },

  async deactivateWorker(workerId: string): Promise<WorkerAdminResult<WorkerAdminRecord>> {
    return this.updateWorker(workerId, { active: false });
  },

  async getWorker(workerId: string): Promise<WorkerAdminResult<WorkerAdminRecord>> {
    if (!initialized) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine not initialized',
        errorCode: WorkerAdminErrorCode.UNINITIALIZED
      });
    }

    if (lifecycle !== WorkerAdminLifecycle.IDLE) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine is already processing an operation',
        errorCode: WorkerAdminErrorCode.ALREADY_PROCESSING
      });
    }

    if (!workerId) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Validation failed: workerId is required',
        errorCode: WorkerAdminErrorCode.VALIDATION_ERROR
      });
    }

    recordOperationStart(WorkerAdminOperationType.GET);

    try {
      const record = await WorkerRepository.findById(workerId);
      
      if (!record) {
        throw new WorkerRepositoryError(WorkerRepositoryErrorCode.WORKER_NOT_FOUND, 'Worker not found');
      }

      recordOperationSuccess();

      return deepCloneAndFreeze({
        success: true,
        data: record as WorkerAdminRecord
      });
    } catch (error: any) {
      recordOperationFailure();
      return deepCloneAndFreeze({
        success: false,
        error: error.message || String(error),
        errorCode: mapRepositoryError(error)
      });
    }
  },

  async listWorkers(): Promise<WorkerAdminResult<WorkerAdminRecord[]>> {
    if (!initialized) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine not initialized',
        errorCode: WorkerAdminErrorCode.UNINITIALIZED
      });
    }

    if (lifecycle !== WorkerAdminLifecycle.IDLE) {
      return deepCloneAndFreeze({
        success: false,
        error: 'Engine is already processing an operation',
        errorCode: WorkerAdminErrorCode.ALREADY_PROCESSING
      });
    }

    recordOperationStart(WorkerAdminOperationType.LIST);

    try {
      const records = await WorkerRepository.list();
      
      recordOperationSuccess();

      return deepCloneAndFreeze({
        success: true,
        data: records as WorkerAdminRecord[]
      });
    } catch (error: any) {
      recordOperationFailure();
      return deepCloneAndFreeze({
        success: false,
        error: error.message || String(error),
        errorCode: mapRepositoryError(error)
      });
    }
  },

  status(): WorkerAdminStatus {
    if (!initialized) {
      return DEFAULT_STATUS;
    }
    
    try {
      return deepCloneAndFreeze({
        initialized,
        lifecycle,
        lastOperationAt,
        lastSuccessfulOperationAt,
        lastFailedOperationAt,
        lastOperationType,
        consecutiveFailures,
        pendingSync,
        lastSyncNotificationAt
      });
    } catch {
      return DEFAULT_STATUS;
    }
  },

  clear(): void {
    clearInternal();
  }
};
