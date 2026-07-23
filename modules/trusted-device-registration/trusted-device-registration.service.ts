import { UserContextEngine } from '../user-context';
import { TrustedDeviceEngine } from '../trusted-device';
import { TrustedDeviceRepository, TrustedDeviceRecord } from '../repositories';
import { 
  TrustedDeviceRegistrationStatus, 
  RegistrationStatus, 
  TrustedDeviceRegistrationResult,
  TrustedDeviceRegistrationResultCode
} from './trusted-device-registration.types';

export const TrustedDeviceRegistrationEngine = {
  initialize(): void {
    // Intentionally empty. Registration does not hold state.
  },

  async status(): Promise<RegistrationStatus> {
    const worker = UserContextEngine.currentWorker();
    const device = TrustedDeviceEngine.device();

    if (!worker || !device) {
      return Object.freeze({ status: TrustedDeviceRegistrationStatus.NOT_REGISTERED });
    }

    try {
      const workerDevices = await TrustedDeviceRepository.findByWorker(worker.id);
      const thisDevice = workerDevices.find(d => d.deviceId === device.deviceId);

      if (thisDevice) {
        return Object.freeze({ status: thisDevice.status as unknown as TrustedDeviceRegistrationStatus });
      }

      return Object.freeze({ status: TrustedDeviceRegistrationStatus.NOT_REGISTERED });
    } catch (e) {
      return Object.freeze({ status: TrustedDeviceRegistrationStatus.NOT_REGISTERED });
    }
  },

  async registerCurrentDevice(): Promise<TrustedDeviceRegistrationResult> {
    const worker = UserContextEngine.currentWorker();
    if (!worker) {
      return Object.freeze({
        success: false,
        code: TrustedDeviceRegistrationResultCode.PRECONDITION_FAILED,
        error: 'No active worker in User Context'
      });
    }

    const device = TrustedDeviceEngine.device();
    if (!device) {
      return Object.freeze({
        success: false,
        code: TrustedDeviceRegistrationResultCode.PRECONDITION_FAILED,
        error: 'No active device identity in Trusted Device Engine'
      });
    }

    try {
      const workerDevices = await TrustedDeviceRepository.findByWorker(worker.id);

      // Check if this specific device is already registered
      const thisDeviceRegistration = workerDevices.find(d => d.deviceId === device.deviceId);
      
      if (thisDeviceRegistration) {
        if (thisDeviceRegistration.status === 'APPROVED') {
          return Object.freeze({
            success: true,
            code: TrustedDeviceRegistrationResultCode.APPROVED
          });
        }
        if (thisDeviceRegistration.status === 'PENDING_APPROVAL') {
          return Object.freeze({
            success: true,
            code: TrustedDeviceRegistrationResultCode.PENDING_APPROVAL
          });
        }
        if (thisDeviceRegistration.status === 'REJECTED') {
          return Object.freeze({
            success: false,
            code: TrustedDeviceRegistrationResultCode.PRECONDITION_FAILED,
            error: 'Device is rejected.'
          });
        }
      }

      // Check if worker already has another APPROVED device
      const approvedDevice = workerDevices.find(d => d.status === 'APPROVED' && d.deviceId !== device.deviceId);
      if (approvedDevice) {
        return Object.freeze({
          success: false,
          code: TrustedDeviceRegistrationResultCode.DEVICE_MISMATCH,
          error: 'Worker already has an approved device.'
        });
      }

      // No registration exists
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      
      await TrustedDeviceRepository.register({
        id: uuid,
        workerId: worker.id,
        deviceId: device.deviceId,
        manufacturer: device.manufacturer,
        model: device.model,
        platform: device.platform,
        appVersion: device.appVersion,
        registeredAt: new Date().toISOString()
      });

      return Object.freeze({
        success: true,
        code: TrustedDeviceRegistrationResultCode.DEVICE_NOT_REGISTERED
      });

    } catch (error: any) {
      return Object.freeze({
        success: false,
        code: TrustedDeviceRegistrationResultCode.PERSISTENCE_ERROR,
        error: error.message || String(error)
      });
    }
  },

  async registration(): Promise<TrustedDeviceRecord | null> {
    const worker = UserContextEngine.currentWorker();
    const device = TrustedDeviceEngine.device();
    if (!worker || !device) return null;
    
    try {
      const workerDevices = await TrustedDeviceRepository.findByWorker(worker.id);
      return workerDevices.find(d => d.deviceId === device.deviceId) || null;
    } catch {
      return null;
    }
  },

  clear(): void {
    // Intentionally empty. No state to clear.
  }
};
