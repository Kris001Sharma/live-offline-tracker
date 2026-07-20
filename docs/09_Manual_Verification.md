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