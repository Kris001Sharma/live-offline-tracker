export interface AppConfiguration {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  appVersion: string;
  trackingIntervalMs: number;
  syncIntervalMs: number;
  gpsAccuracyThresholdMeters: number;
  featureFlags: Record<string, boolean>;
}

export type ConfigKey = keyof AppConfiguration;
