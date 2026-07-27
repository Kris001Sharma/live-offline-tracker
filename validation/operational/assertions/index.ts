import { OperationalHarness } from '../framework';

export function assertEqual<T>(actual: T, expected: T, message: string): void {
  const isMatch = actual === expected || JSON.stringify(actual) === JSON.stringify(expected);
  OperationalHarness.recordAssertion(isMatch);
  if (isMatch) {
    console.log(`  ✅ [ASSERT_EQUAL]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_EQUAL_FAIL]: ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`);
    throw new Error(`Assertion Failed [assertEqual]: ${message}`);
  }
}

export function assertTrue(condition: boolean, message: string): void {
  OperationalHarness.recordAssertion(condition);
  if (condition) {
    console.log(`  ✅ [ASSERT_TRUE]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_TRUE_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertTrue]: ${message}`);
  }
}

export function assertFalse(condition: boolean, message: string): void {
  const isMatch = !condition;
  OperationalHarness.recordAssertion(isMatch);
  if (isMatch) {
    console.log(`  ✅ [ASSERT_FALSE]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_FALSE_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertFalse]: ${message}`);
  }
}

export function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  const exists = value !== null && value !== undefined;
  OperationalHarness.recordAssertion(exists);
  if (exists) {
    console.log(`  ✅ [ASSERT_EXISTS]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_EXISTS_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertExists]: ${message}`);
  }
}

export function assertFrozen(obj: any, message: string): void {
  const isFrozen = obj !== null && typeof obj === 'object' && Object.isFrozen(obj);
  OperationalHarness.recordAssertion(isFrozen);
  if (isFrozen) {
    console.log(`  ✅ [ASSERT_FROZEN]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_FROZEN_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertFrozen]: ${message}`);
  }
}

export function assertLifecycle(currentLifecycle: string, expectedLifecycle: string, message: string): void {
  const isMatch = currentLifecycle === expectedLifecycle;
  OperationalHarness.recordAssertion(isMatch);
  if (isMatch) {
    console.log(`  ✅ [ASSERT_LIFECYCLE]: ${message} (${currentLifecycle})`);
  } else {
    console.error(`  ❌ [ASSERT_LIFECYCLE_FAIL]: ${message} (Expected ${expectedLifecycle}, Got ${currentLifecycle})`);
    throw new Error(`Assertion Failed [assertLifecycle]: ${message}`);
  }
}

export async function assertRepositoryCount(
  countFetcher: () => Promise<number>,
  expectedCount: number,
  message: string
): Promise<void> {
  const actualCount = await countFetcher();
  const isMatch = actualCount === expectedCount;
  OperationalHarness.recordAssertion(isMatch);
  if (isMatch) {
    console.log(`  ✅ [ASSERT_REPO_COUNT]: ${message} (Count: ${actualCount})`);
  } else {
    console.error(`  ❌ [ASSERT_REPO_COUNT_FAIL]: ${message} (Expected ${expectedCount}, Got ${actualCount})`);
    throw new Error(`Assertion Failed [assertRepositoryCount]: ${message}`);
  }
}

export async function assertDatabaseState(
  checkFn: () => Promise<boolean>,
  message: string
): Promise<void> {
  let passed = false;
  try {
    passed = await checkFn();
  } catch (err) {
    passed = false;
  }
  OperationalHarness.recordAssertion(passed);
  if (passed) {
    console.log(`  ✅ [ASSERT_DB_STATE]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_DB_STATE_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertDatabaseState]: ${message}`);
  }
}

export async function assertSupabaseState(
  checkFn: () => Promise<boolean>,
  message: string
): Promise<void> {
  let passed = false;
  try {
    passed = await checkFn();
  } catch (err) {
    passed = false;
  }
  OperationalHarness.recordAssertion(passed);
  if (passed) {
    console.log(`  ✅ [ASSERT_SUPABASE_STATE]: ${message}`);
  } else {
    console.error(`  ❌ [ASSERT_SUPABASE_STATE_FAIL]: ${message}`);
    throw new Error(`Assertion Failed [assertSupabaseState]: ${message}`);
  }
}
