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
