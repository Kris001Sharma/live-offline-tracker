import { Migration } from './migrations.types';
import { migration001 } from './versions/001_initial_schema';

export const migrations: Migration[] = [
  migration001
];
