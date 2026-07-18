export interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
  };
}

export interface RuntimeConfig {
  tracking: {
    intervalMs: number;
  };
  sync: {
    intervalMs: number;
  };
  gps: {
    accuracyThresholdMeters: number;
  };
  featureFlags: Record<string, boolean>;
}

export interface ConfigurationState {
  environment: EnvironmentConfig;
  runtime: RuntimeConfig;
}
