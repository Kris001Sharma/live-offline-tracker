import { Migration } from './migrations.types';
import { migration001 } from './versions/001_initial_schema';
import { migration002 } from './versions/002_attendance_schema';
import { migration_003_trusted_device_schema } from './versions/003_trusted_device_schema';

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration_003_trusted_device_schema
];
