# 09 Manual Verification

## Purpose

This document defines the manual verification steps required after completing each implementation slice.
It verifies architectural behaviour, public APIs, and expected outcomes before a slice is considered complete.
It is not intended to replace automated testing.


**Every completed slice should verify**

- Public API behaves as documented.
- Success scenarios complete correctly.
- Failure scenarios fail predictably.
- No architectural boundaries are violated.
- No prohibited dependencies were introduced.




## Slice 3A — Shared Domain Models

### Purpose

Establish a shared domain model used consistently across Engines, Repositories, and Features.

### Verification

1. Build the project.
2. Import shared domain types from `modules/domain`.
3. Confirm all modules compile using the shared types.
4. Verify no duplicate domain models exist outside the Domain module.

### Expected Outcome

- Shared domain types are available through a single public API.
- All consumers use the same models and enums.
- TypeScript compilation succeeds without type conflicts.

### Regression Checks

- Existing Engine public APIs remain unchanged.
- No circular dependencies are introduced.



## Slice 3B — Event Engine

### Purpose

Provide a centralized mechanism for recording operational events and queuing them for synchronization.

### Verification

1. Create a test event using the Event Engine.
2. Verify the event is persisted locally.
3. Verify the event is queued for synchronization.
4. Verify the returned event contains a valid UUID and timestamp.
5. Attempt to create an invalid event and verify predictable failure behaviour.

### Expected Outcome

- Events are recorded successfully.
- Events are queued for synchronization.
- Event identifiers and timestamps are generated automatically.
- Event creation remains independent of business workflows.

### Regression Checks

- Shared Domain models remain unchanged.
- Storage Engine persists data successfully.
- No direct database access occurs outside approved repositories.



## Slice 4A — Location Provider

### Purpose

Provide a single abstraction over native location services for the entire application.

### Verification

1. Check location permission status.
2. Request permission if required.
3. Retrieve the current location.
4. Deny permission and verify graceful error handling.
5. Verify only the Location Provider communicates with native location APIs.

### Expected Outcome

- Permission status is correctly reported.
- Current location is returned as a standardized Location object.
- Errors are mapped to application-defined error types.
- Native APIs remain isolated inside the Location Provider.

### Regression Checks

- Event Engine continues functioning.
- Storage Engine remains unaffected.
- No Engine accesses native GPS APIs directly.



## Slice 4B — Location Evaluation Engine

### Purpose

Provide reusable, deterministic evaluation of captured locations before they are accepted by business features.

### Verification

1. Evaluate a location within the configured accuracy threshold.
2. Evaluate a location outside the accuracy threshold.
3. Evaluate minimum movement distance.
4. Evaluate minimum elapsed time.
5. Evaluate a location inside and outside a geofence.
6. Verify returned evaluation reasons and metadata.

### Expected Outcome

- Accepted locations satisfy all configured evaluation rules.
- Rejected locations include clear rejection reasons.
- Distance, time, accuracy, and geofence calculations are deterministic.
- No persistence or event generation occurs inside the engine.

### Regression Checks

- Location Provider continues returning standardized locations.
- No database access occurs.
- No Event Engine interaction occurs.
- Engine remains purely computational.



## Slice 4C — Tracking Engine

### Purpose

Coordinate the location tracking lifecycle while delegating persistence and evaluation to the appropriate engines.

### Verification

1. Initialize the Tracking Engine.
2. Start tracking.
3. Process a valid location.
4. Process an invalid location.
5. Pause and resume tracking.
6. Stop tracking.
7. Attempt an invalid state transition.

### Expected Outcome

- Tracking lifecycle follows the documented state machine.
- Accepted locations generate GPS_RECORDED events.
- Rejected locations generate LOCATION_REJECTED events.
- Invalid state transitions return explicit errors.
- No direct GPS, SQLite, or networking operations occur outside approved engine boundaries.



## Slice 4D — Tracking Session

### Purpose

Implement the execution loop that periodically polls the Location Provider and forwards locations to the Tracking Engine.

### Verification

1. Initialize `TrackingSession`.
2. Start the tracking session with `start()`.
3. Verify that polling begins and survives location failures without resetting.
4. Pause the session with `pause()` and verify polling stops.
5. Resume the session with `resume()` and verify polling resumes using the latest interval.
6. Stop the session with `stop()` and verify timers are cleared.
7. Attempt invalid transitions (e.g., `start()` while running or `stop()` while stopped) and verify explicit errors are thrown.

### Expected Outcome

- `TrackingSession` orchestrates exactly one running timer at a time.
- Successive `stop()` calls don't leak timers.
- Calling `resume()` uses the latest configuration values.
- Polling survives any unhandled exceptions during execution.
- Tracking engine state remains independent from the session state.

### Regression Checks

- No duplicated tracking states in `TrackingSession`.
- `TrackingEngine` behavior remains untouched.
- Only location retrieval and forwarding are managed; no SQLite or sync imports occur.

## Slice 4E — Background Execution Adapter

### Purpose

Implement the Background Execution Adapter responsible for integrating the application with the native application lifecycle. Enables continuous tracking while the application is running in the foreground or an approved background execution context.

### Verification

1. Initialize `BackgroundExecution` and verify duplicate initialize does not register duplicate listeners.
2. Start the background execution with `start()`.
3. Verify that the state transitions to `ACTIVE` and the `TrackingSession` starts.
4. Trigger foreground transition and background transition multiple times.
5. Verify duplicate lifecycle callbacks do not restart polling.
6. Verify execution state accurately reflects application lifecycle.
7. Stop the background execution with `stop()`.
8. Verify `stop()` removes listeners.
9. Attempt invalid transitions (e.g., `start()` while active or `stop()` while stopped) and verify explicit lifecycle errors.

### Expected Outcome

- `BackgroundExecution` manages the transition between foreground and background states based on Capacitor events.
- `TrackingSession` is started and stopped correctly as part of the execution lifecycle.
- Proper handling of lifecycle failures without state corruption.
- Safely ignores unexpected lifecycle events.

### Regression Checks

- No direct tracking orchestration, persistence, or evaluation occurs in `BackgroundExecution`.
- Location Provider and Event Engine remain untouched and un-imported.
- Previously implemented tracking features (Tracking Engine, Tracking Session) behave correctly.

## Slice 5A — Location Repository

### Purpose

Implement the dedicated Location Repository as the authoritative persistence layer for accepted GPS locations.

### Verification

1. Initialize `LocationRepository` and verify `append()` stores a valid location using SQLite.
2. Verify `findLatest()` correctly retrieves the most recent location for a specific worker.
3. Verify `findBetween()` returns locations within a specific time range.
4. Verify `findPending()` correctly retrieves locations that have `sync_status = 'PENDING'`.
5. Run tracking session and confirm that accepted locations are correctly appended to the repository.
6. Trigger tracking session and confirm that `findLatest()` returns the newly appended location to evaluate the next GPS coordinate.
7. Attempt to call `markSynced()` and confirm that the `sync_status` updates to `COMPLETED`.

### Expected Outcome

- GPS locations are stored in the `locations` table.
- Queries reliably retrieve the expected records using `recorded_at` and `sync_status`.
- `TrackingEngine` uses `LocationRepository` rather than `EventRepository` to retrieve previous locations for GPS validation.

### Regression Checks

- No direct business logic, location evaluation, or tracking orchestration exists within the repository.
- Location processing in `TrackingEngine` works correctly.

## Slice 5B — GPS Capture Pipeline

### Purpose

Implement the production GPS capture pipeline responsible for reliably processing every GPS sample produced by the scheduler. Ensure the pipeline correctly integrates `TrackingSession`, `LocationProvider`, `TrackingEngine`, `LocationEvaluationEngine`, `LocationRepository`, and `EventEngine`.

### Verification

1. Start a tracking session.
2. Verify `TrackingSession` repeatedly invokes `TrackingEngine.processLocation()`.
3. Verify accepted locations are recorded in `LocationRepository` and emit a `GPS_RECORDED` event.
4. Verify rejected locations are not recorded in `LocationRepository` and emit a `LOCATION_REJECTED` event.
5. Induce a retrieval error from `LocationProvider` and confirm a `TRACKING_ERROR` is logged, and the scheduler survives.
6. Induce a persistence error in `LocationRepository` and confirm a `TRACKING_ERROR` is logged, and the scheduler survives.
7. Induce an event generation failure and confirm the scheduler survives.
8. Verify no duplicate persistence paths exist.
9. Verify no concurrent `processLocation()` executions occur (trigger rapid polling manually if needed).

### Expected Outcome

- Deterministic outcome for every polling cycle (either accepted or rejected).
- Resilient pipeline that handles failures without crashing or terminating the scheduler.
- Absolute atomic execution of GPS processing.

### Regression Checks

- Architecture compliance remains unchanged.
- Single responsibility maintained across all engines.

## Revision — Tracking Session Scheduling

### Purpose
Refine `TrackingSession` to use a self-scheduling asynchronous loop, replacing `setInterval`.

### Verification
1. Start a tracking session.
2. Verify that the scheduler waits for each polling cycle to complete before scheduling the next cycle.
3. Verify that no overlapping or skipped timer callbacks occur.
4. Verify that the polling interval begins after successful completion of the previous cycle.

## Slice 5C — Tracking Resilience & Recovery

### Purpose
Complete the Tracking Engine by implementing automatic recovery behaviour, ensuring the system survives temporary failures without requiring manual restart.

### Verification
1. Induce a GPS read failure and verify the system records `TRACKING_ERROR`, continues scheduling, and never stops tracking.
2. Induce a persistence failure and verify `TrackingEngine` returns `PERSISTENCE_ERROR`, `TrackingSession` records `TRACKING_ERROR`, and scheduling continues.
3. Induce an event generation failure and verify that tracking continues without recursive error loops.
4. Verify the scheduler never silently stops, and always schedules the next execution.
5. Verify that a paused scheduler executes nothing.
6. Verify that a stopped scheduler executes nothing.

### Regression Checks
- Public APIs remain unchanged.
- No new dependencies.
- No architectural boundary changes.

## Slice 5D — Tracking Health

### Purpose
Implement a read-only tracking health diagnostic layer to improve observability of the tracking pipeline.

### Verification
1. Start the tracking session.
2. Query `TrackingHealth.status()` and verify that `isPipelineHealthy` returns `true` and state is `HEALTHY`.
3. Induce a failure (e.g. GPS failure) and check `TrackingHealth.status()`.
4. Verify that `consecutiveFailureCount` increments and `isRecoveryActive` becomes `true`.
5. Verify that `state` degrades to `DEGRADED` or `UNHEALTHY` if failures exceed threshold.
6. Verify that `TrackingHealth.status()` includes correct timestamps for location, processing, and persistence.

### Slice 5D — Health Hardening
1. Verify startup state returns `UNKNOWN` before the first polling tick completes, preventing premature `HEALTHY` or `STOPPED` reports.
2. Induce a clock rollback (device time moves backwards) and verify the diagnostic layer avoids negative durations and remains operational.
3. Simulate a delayed scheduler (tick doesn't occur for 2x interval) and verify health state degrades gracefully.

## Phase 5 — End-to-End Validation

### Purpose
Validate the complete tracking pipeline from scheduler through persistence under realistic operating conditions.

### Verification
1. **Normal Tracking**: Start session, ensure GPS is polled, locations are evaluated and persisted, and `TrackingHealth` reports `HEALTHY`.
2. **Scheduler**: Pause, resume, and stop the session to verify no duplicate timers or overlapping executions occur.
3. **GPS Failure Recovery**: Deny location permissions mid-session; verify `TRACKING_ERROR` is logged and tracking continues. Grant permissions and verify normal polling resumes.
4. **Persistence Failure Recovery**: Simulate a repository error and confirm tracking loop survives and correctly reports `PERSISTENCE_ERROR`.
5. **Event Failure Recovery**: Simulate an error when generating an event and verify tracking loop continues cleanly.
6. **Connectivity**: Run tracking continuously while toggling Airplane Mode; verify pipeline operates strictly offline and continues storing location samples.
7. **Application Lifecycle**: Run app in foreground, background, screen lock, and screen unlock scenarios to ensure `BackgroundExecution` properly handles state transitions without duplicating timers.
8. **Long Running Stability**: Leave the session active for multiple hours (6+ recommended); verify `TrackingHealth` remains `HEALTHY` with no scheduler stalls.


# Phase 5 — Final Validation

The complete offline tracking pipeline has been verified.

Validated scenarios:

- Tracking lifecycle
- Background execution
- Scheduler recovery
- GPS unavailable
- Persistence failure
- Event logging failure
- Airplane mode
- Screen locked
- Background execution
- Long-running scheduler stability
- Tracking Health diagnostics

Expected outcome:

- Tracking continues whenever possible.
- Failures never terminate the scheduler.
- Accepted locations are stored only through LocationRepository.
- Operational events are stored only through EventEngine.
- No duplicate timers or overlapping processing occur.
## Slice 6A — Attendance Engine Foundation (Refinement)

### Purpose
Implement and harden the core Attendance Engine as the single orchestration point for attendance operations, establishing the Attendance domain with immutable states and explicit transitions.

### Verification
1. **Idempotency**: Call `AttendanceEngine.initialize()` multiple times; verify it consistently resets the engine to `NOT_CHECKED_IN` without side effects.
2. **Valid Transitions**: Verify `checkIn()` succeeds from `NOT_CHECKED_IN` and `CHECKED_OUT`, and `checkOut()` succeeds from `CHECKED_IN`.
3. **Invalid Transitions**: Verify invalid transitions (e.g., `checkOut()` from `NOT_CHECKED_IN`, `checkIn()` from `CHECKED_IN`) explicitly throw lifecycle errors.
4. **Immutability**: Verify `AttendanceEngine.status()` returns a frozen object and timestamps remain unmodified after transition completes.

## Slice 6B — Attendance Location Validation

### Purpose
Extend the Attendance Engine so that attendance decisions become location-aware, delegating logic to `LocationProvider` and `LocationEvaluationEngine`.

### Verification
1. **Valid Location Check-in**: Set device location inside geofence (or meet accuracy rules), call `AttendanceEngine.checkIn()`, and verify it succeeds and state updates to `CHECKED_IN`.
2. **Invalid Location Check-in**: Set device location outside geofence (or low accuracy), call `checkIn()`, and verify it fails with `LOCATION_EVALUATION_FAILED`, leaving state unchanged.
3. **Valid Location Check-out**: While checked in, set location inside geofence, call `checkOut()`, verify it succeeds and state updates to `CHECKED_OUT`.
4. **Invalid Location Check-out**: Set location outside geofence, call `checkOut()`, verify it fails with `LOCATION_EVALUATION_FAILED`, leaving state unchanged (`CHECKED_IN`).
5. **No Location Access**: Deny GPS permission and verify `checkIn()` or `checkOut()` fails with `PERMISSION_DENIED` and states are preserved.

## Slice 6B-A — Attendance Engine Hardening

### Purpose
Strengthen the Attendance Engine through configuration validation, robust rollback on failure, and comprehensive exception handling without modifying the public API.

### Verification
1. **Invalid Configuration**: Provide invalid or missing geofence coordinates in configuration; verify `checkIn()` fails with `UNKNOWN_ERROR` and state instantly rolls back to `NOT_CHECKED_IN` without calling location logic.
2. **Unexpected Exceptions**: Simulate an unexpected error inside the engine (e.g. mocking a failure); verify the transaction is caught, state is rolled back, previous timestamps are preserved, and it returns `UNKNOWN_ERROR`.
3. **Lifecycle Immutability**: Validate that multiple consecutive failures (e.g., location unavailable or denied) never leave the engine in `CHECKING_IN` or `CHECKING_OUT` state.
4. **Successful Operation**: Verify that valid `checkIn()` and `checkOut()` still behave identically as they did in Slice 6B.

### Slice 6C — Attendance Repository
1. **Persistence Integration**: Verify a successful check-in creates one database record inside the `attendance` table using the local SQLite db.
2. **Checkout Update**: Verify a successful check-out updates the same existing record by setting `check_out_at` rather than creating a duplicate row.
3. **Rollback Integrity**: Verify that if persistence to SQLite fails, the `AttendanceEngine` performs a complete state rollback and does not leave a partial session.
4. **Duplicate Prevention**: Verify duplicate active sessions for the same worker cannot be created.
5. **Pending Records**: Ensure un-synced attendance records correctly report as `PENDING`.

### Slice 6C-A — Attendance Persistence Hardening
1. **Active Recovery**: Verify that after a simulated restart, only a genuinely open session (check_out_at is NULL) is restored.
2. **Completed Isolation**: Verify completed attendance records (check_out_at exists) are never mistakenly restored as active.
3. **Duplicate Prevention**: Verify the repository actively rejects attempts to append a new session when an active one already exists.
4. **Rollback Integrity**: Verify that if the repository rejects an append (e.g. duplicate session), the Engine fully rolls back its state and timestamps.

## Slice 6D — Attendance Event Logging
1. **Successful check-in**: Verify `checkIn()` succeeds and the attendance record is persisted, and `ATTENDANCE_CHECKED_IN` event exists.
2. **Successful check-out**: Verify `checkOut()` succeeds, attendance updates, and `ATTENDANCE_CHECKED_OUT` event exists.
3. **Rejected location**: Verify invalid location check-in/out leaves attendance unchanged and records `ATTENDANCE_LOCATION_REJECTED`.
4. **Repository failure**: Simulate repository error and verify a rollback occurs while `ATTENDANCE_PERSISTENCE_FAILED` is recorded.
5. **EventEngine failure**: Simulate `EventEngine.createEvent` failing and verify that attendance still succeeds, with no rollback, no recursive failures, and engine remains healthy.

## Slice 7A — Authentication Foundation
1. **Login Success**: Verify `login(email, password)` succeeds with valid credentials, state becomes `AUTHENTICATED`, and `currentUser()` returns the correct user.
2. **Login Failure**: Verify `login` with invalid credentials returns `INVALID_CREDENTIALS` and state remains `UNAUTHENTICATED`.
3. **Session Restore**: Verify `restoreSession()` succeeds and restores state to `AUTHENTICATED` when a valid session exists.
4. **Logout**: Verify `logout()` clears the session and resets state to `UNAUTHENTICATED`.
5. **Invalid Lifecycle Transitions**: Verify `login` while `AUTHENTICATED` explicitly throws a lifecycle error.
