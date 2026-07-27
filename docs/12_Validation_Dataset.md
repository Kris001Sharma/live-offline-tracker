# 12 Validation Dataset

## Overview

This document outlines the permanent validation dataset used throughout the project's Quality Gates. It provides a deterministic, version-controlled foundation for validating application logic, synchronization, and infrastructure without relying on production data.

## 1. Baseline Dataset

Permanent records that should never change. They form the reliable base for end-to-end validation.

### Workers

*   **Identifier:** `worker-admin`
    *   **Purpose:** Validates administrative boundaries and elevated permissions.
    *   **Role:** `ADMIN`
    *   **Related Quality Gates:** QG2, QG3
    *   **Expected Behaviour:** Grants full access to worker administration endpoints.
*   **Identifier:** `worker-active-a`
    *   **Purpose:** Standard active worker profile for primary application flows.
    *   **Role:** `WORKER`
    *   **Related Quality Gates:** QG2, QG3
    *   **Expected Behaviour:** Can authenticate, register devices, and log attendance.
*   **Identifier:** `worker-active-b`
    *   **Purpose:** Secondary active worker to validate isolation and concurrency.
    *   **Role:** `WORKER`
    *   **Related Quality Gates:** QG2
    *   **Expected Behaviour:** Must not see data from `worker-active-a`.
*   **Identifier:** `worker-inactive`
    *   **Purpose:** Validates deactivation flows and access denial.
    *   **Role:** `WORKER`, active: `0`
    *   **Related Quality Gates:** QG2
    *   **Expected Behaviour:** Authentication or sync should be rejected or handled accordingly.

### Trusted Devices

*   **Identifier:** `device-trusted-1`
    *   **Purpose:** Validates approved device binding.
    *   **Worker:** `worker-active-a`
    *   **Status:** `APPROVED`
    *   **Related Quality Gates:** QG2
    *   **Expected Behaviour:** System accepts attendance payloads from this device.

### Attendance & Shifts

*   **Identifier:** `shift-baseline-1` & `attendance-baseline-1`
    *   **Purpose:** Provides a known historical state for synchronization and reporting.
    *   **Worker:** `worker-active-a`
    *   **Related Quality Gates:** QG2
    *   **Expected Behaviour:** Queries for historical shifts should return this data deterministically.

### Tracking Events

*   **Identifier:** `event-baseline-1`, `event-baseline-2`
    *   **Purpose:** Simulates known GPS points tied to `shift-baseline-1`.
    *   **Worker:** `worker-active-a`
    *   **Related Quality Gates:** QG2
    *   **Expected Behaviour:** Verifies event sorting and spatial logic.

## 2. Transaction Dataset

Temporary records created during validation runs to verify mutations. They should be considered disposable.

*   **Worker Create:** `worker-tx-create` (Validates `createWorker`)
*   **Worker Update:** `worker-tx-update` (Validates `updateWorker`)
*   **Worker Delete/Deactivate:** `worker-tx-deactivate` (Validates `deactivateWorker`)

## 3. Fault Dataset

Records intentionally created to trigger and validate failure scenarios.

*   **Duplicate Email:** Attempting to create a worker with `admin@sapana.local`.
*   **Invalid Worker:** Orphaned references or invalid enums.
*   **Missing Foreign Key:** Creating attendance for a non-existent worker.

This dataset ensures all infrastructure and feature engines fail deterministically when encountering bad data.
