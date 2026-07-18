import { AppConfiguration, ConfigKey } from './configuration.types';
import {
  DEFAULT_GPS_ACCURACY_THRESHOLD_METERS,
  DEFAULT_SYNC_INTERVAL_MS,
  DEFAULT_TRACKING_INTERVAL_MS,
} from './configuration.constants';

export class ConfigurationService {
  private config: AppConfiguration | null = null;

  public load(): void {
    // In Vite environments, env variables are exposed on import.meta.env
    // We cast to any to avoid strict type errors if import.meta.env is not fully typed
    const env = (import.meta as any).env || {};

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl) {
      throw new Error('Configuration Engine Error: VITE_SUPABASE_URL is missing.');
    }
    
    if (!supabaseAnonKey) {
      throw new Error('Configuration Engine Error: VITE_SUPABASE_ANON_KEY is missing.');
    }

    const appName = env.VITE_APP_NAME || 'Sapana Live Tracker';
    const appVersion = env.VITE_APP_VERSION || '1.0.0';

    const trackingInterval = parseInt(env.VITE_TRACKING_INTERVAL_MS, 10);
    const syncInterval = parseInt(env.VITE_SYNC_INTERVAL_MS, 10);
    const gpsAccuracy = parseInt(env.VITE_GPS_ACCURACY_THRESHOLD_METERS, 10);

    this.config = {
      supabaseUrl,
      supabaseAnonKey,
      appName,
      appVersion,
      trackingIntervalMs: isNaN(trackingInterval) ? DEFAULT_TRACKING_INTERVAL_MS : trackingInterval,
      syncIntervalMs: isNaN(syncInterval) ? DEFAULT_SYNC_INTERVAL_MS : syncInterval,
      gpsAccuracyThresholdMeters: isNaN(gpsAccuracy) ? DEFAULT_GPS_ACCURACY_THRESHOLD_METERS : gpsAccuracy,
      featureFlags: this.parseFeatureFlags(env.VITE_FEATURE_FLAGS),
    };
  }

  public get<K extends ConfigKey>(key: K): AppConfiguration[K] {
    this.ensureLoaded();
    return this.config![key];
  }

  public isFeatureEnabled(name: string): boolean {
    this.ensureLoaded();
    return !!this.config!.featureFlags[name];
  }

  private ensureLoaded(): void {
    if (!this.config) {
      throw new Error('Configuration Engine has not been initialized. Call load() first.');
    }
  }

  private parseFeatureFlags(flagsStr?: string): Record<string, boolean> {
    if (!flagsStr) return {};
    try {
      return flagsStr.split(',').reduce((acc, flag) => {
        const [key, value] = flag.split('=');
        if (key) {
          acc[key.trim()] = value ? value.trim().toLowerCase() === 'true' : true;
        }
        return acc;
      }, {} as Record<string, boolean>);
    } catch (error) {
      console.warn('Configuration Engine: Failed to parse feature flags.', error);
      return {};
    }
  }
}

export const Configuration = new ConfigurationService();
