# 03 Engines

## Purpose

This document defines the reusable infrastructure ("Engines") that form the foundation of the application.

An Engine is a self-contained module responsible for one technical capability. Engines **must not** contain business workflows and **must not** know about UI.

Features orchestrate Engines.

This separation allows Engines to be reused across future projects.

---

# Engine Dependency Diagram

```
                 Configuration
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Storage        Event        Tracking
        │                           │
        └─────────────┬─────────────┘
                      │
                    Sync
```

Dependency Rules:

- Configuration has no dependency.
- Storage depends only on Configuration.
- Event depends on Configuration and Storage.
- Tracking depends on Configuration, Storage and Event.
- Sync depends on every previous Engine.
- Reverse dependencies are prohibited.

---

# Engine Standards

Every Engine must contain:

```
index.ts

types.ts

constants.ts

service.ts

(optional)
repository.ts
adapter.ts
```

Avoid unnecessary files.

If an Engine contains fewer than ~300 lines of logic, prefer keeping it compact.

---

# Engine Lifecycle

Every Engine follows the same lifecycle.

```
Initialize

↓

Load Configuration

↓

Perform Work

↓

Publish Result

↓

Dispose
```

Engines must never require manual lifecycle management from UI components.

---

# Engine Communication

Allowed

```
Feature

↓

Engine

↓

Engine
```

Not Allowed

```
Feature

↓

SQLite
```

```
Feature

↓

Supabase
```

```
Feature

↓

GPS
```

```
React Component

↓

Engine Internals
```

---

# 1. Configuration Engine

## Purpose

Provide all runtime configuration for the application.

No other module should hardcode configurable values.

---

## Responsibilities

- Environment configuration
- GPS intervals
- Retry policies
- Feature flags
- API configuration
- Build configuration

---

## Public Interface

```
load()

get(key)

set(key)

isFeatureEnabled(feature)
```

---

## Inputs

Environment

Local configuration

---

## Outputs

Application configuration

---

## Dependencies

None

---

## Future Extensions

Remote configuration

Organization-specific configuration

---

## Non Responsibilities

Authentication

Storage

Networking

GPS

---

# 2. Storage Engine

## Purpose

Provide a single interface for local persistence.

SQLite implementation details remain hidden from Features.

---

## Responsibilities

Store

Retrieve

Update

Delete

Queue

Transactions

---

## Public Interface

```
initialize()

save()

update()

delete()

find()

findMany()

transaction()
```

---

## Responsibilities in MVP

Persist

- GPS Locations

- Shift Records

- Event Records

- Pending Upload Queue

---

## Dependencies

Configuration

SQLite

---

## Rules

No Feature may directly execute SQL.

No Engine except Storage may access SQLite.

---

## Future Extensions

Encryption

Multiple databases

Migration system

---

## Non Responsibilities

Synchronization

Networking

GPS

---

# 3. Event Engine

## Purpose

Record significant application events.

Events are operational—not analytics.

---

## Responsibilities

Persist application events.

Provide chronological event history.

---

## Example Events

Shift Started

Shift Stopped

GPS Disabled

GPS Enabled

Permission Revoked

Permission Granted

Tracking Started

Tracking Stopped

Internet Connected

Internet Lost

Sync Started

Sync Completed

Sync Failed

Application Restarted

Foreground Service Restarted

---

## Why Events Exist

Events help explain why tracking behaved a certain way.

Example

```
09:00

Shift Started

↓

09:01

GPS Disabled

↓

09:10

GPS Enabled

↓

09:11

Tracking Resumed
```

Instead of missing GPS records with no explanation.

---

## Public Interface

```
record()

find()

findBetween()

clear()
```

---

## Dependencies

Configuration

Storage

---

## Non Responsibilities

Business reporting

Analytics

Notifications

---

# 4. Tracking Engine

## Purpose

Own the complete lifecycle of location tracking.

This is the most critical Engine in the application.

No other Engine or Feature should communicate directly with GPS.

---

## Responsibilities

Start tracking

Stop tracking

Collect locations

Validate locations

Persist locations

Monitor provider availability

Handle Android Foreground Service communication

---

## Public Interface

```
start()

stop()

pause()

resume()

currentStatus()

currentLocation()
```

---

## Tracking Lifecycle

```
Shift Started

↓

Tracking Starts

↓

Location Received

↓

Validate

↓

Persist

↓

Repeat
```

---

## Validation Rules

Reject locations when:

Accuracy exceeds configured threshold.

Latitude or longitude is invalid.

Timestamp is older than previous accepted point.

Duplicate point.

---

## GPS Interval

Interval is configuration driven.

Never hardcoded.

---

## Storage Rule

Every accepted GPS point is immediately stored locally.

Upload is **never** attempted here.

Tracking Engine is unaware of networking.

---

## Failure Behaviour

If GPS becomes unavailable

```
Record Event

↓

Keep Tracking Active

↓

Retry

↓

Resume Automatically
```

Do not terminate tracking.

---

## Dependencies

Configuration

Storage

Event

Native Adapter

---

## Future Extensions

Geofencing

Motion Detection

Battery Optimization

---

## Non Responsibilities

Uploading

Synchronization

Authentication

---

# 5. Sync Engine

## Purpose

Synchronize locally stored data with Supabase.

Owns every network interaction.

---

## Responsibilities

Detect connectivity.

Upload queued data.

Retry failures.

Maintain upload order.

Prevent duplicate uploads.

---

## Public Interface

```
start()

stop()

sync()

retry()

pending()

status()
```

---

## Synchronization Strategy

```
Connectivity Restored

↓

Fetch Pending Records

↓

Upload Oldest First

↓

Mark Uploaded

↓

Repeat
```

---

## Upload Order

Always chronological.

Never upload newest first.

---

## Retry Strategy

Retry only failed uploads.

Use exponential backoff.

Do not retry indefinitely.

---

## Queue Ownership

Sync Engine owns upload state.

Storage Engine owns data.

---

## Connectivity

Listen for connectivity changes.

Avoid polling.

---

## Dependencies

Configuration

Storage

Event

Supabase

---

## Future Extensions

Background worker

Compression

Batch uploads

Delta synchronization

---

## Non Responsibilities

GPS Collection

Business Logic

SQLite Implementation

---

# Engine Boundaries

| Engine | Owns |
|----------|----------------------------|
| Configuration | Runtime configuration |
| Storage | SQLite |
| Event | Operational events |
| Tracking | GPS lifecycle |
| Sync | Network synchronization |

If ownership is unclear, it belongs in neither until reviewed.

---

# Implementation Order

The Engineering Team must implement Engines in this exact order.

```
Configuration

↓

Storage

↓

Event

↓

Tracking

↓

Sync
```

No Engine should begin implementation before all dependencies are complete.

---

# Coding Principles

Every Engine should:

- expose a minimal public API
- hide implementation details
- avoid circular dependencies
- avoid static global state where possible
- support dependency injection if required later
- remain independently testable

---

# Reusability Goal

The following Engines should be portable to another project with minimal changes:

- Configuration
- Storage
- Event
- Tracking
- Sync

Only adapters should require replacement.

Example:

```
Tracking Engine

↓

Android Adapter
```

can later become

```
Tracking Engine

↓

iOS Adapter
```

without modifying the Engine itself.

---

# AI Studio Implementation Rules

For every Engine:

1. Create only the agreed file structure.
2. Define interfaces before implementation.
3. Implement one Engine at a time.
4. Do not create placeholder code for future Engines.
5. Do not introduce dependencies outside this document.
6. Keep every Engine independently testable.
7. Stop after one Engine is complete and summarize the implementation.

---

# Acceptance Criteria

An Engine is considered complete when:

- Public API is implemented.
- Responsibilities match this document.
- Dependencies follow the approved graph.
- No prohibited responsibilities exist.
- Unit testing is possible.
- No Feature-specific logic has been introduced.