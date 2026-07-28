import { ConfigurationEngine } from '@/modules/configuration';
import { StorageEngine } from '@/modules/storage';
import { CapacitorSQLiteAdapter } from '@/modules/storage/storage.adapter';
import { ConnectivityEngine } from '@/modules/connectivity';
import { AuthenticationEngine } from '@/modules/authentication';
import { UserContextEngine } from '@/modules/user-context';
import { WorkerProfileEngine } from '@/modules/worker-profile';

export async function bootstrapApplication(): Promise<void> {
  // 1. Configuration
  ConfigurationEngine.load();

  // 2. Storage
  const adapter = new CapacitorSQLiteAdapter();
  await StorageEngine.initialize(adapter);

  // 3. Connectivity
  ConnectivityEngine.initialize();

  // 4. Authentication
  AuthenticationEngine.initialize();

  // 5. UserContext
  UserContextEngine.initialize();

  // 6. WorkerProfile
  WorkerProfileEngine.initialize();
}
