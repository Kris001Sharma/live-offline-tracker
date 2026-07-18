# 04 Database

## Purpose

This document defines the data model used by the application.

The project maintains two databases:

- Local SQLite Database (offline source of truth while the worker is offline)
- Supabase PostgreSQL Database (central synchronized source)

The schema should remain as similar as possible between both databases to simplify synchronization.

---

# Database Philosophy

The application is **Offline First**.

Every record follows this lifecycle:

```
Create

↓

Store Locally

↓

Queue for Sync

↓

Upload

↓

Mark Synced
```

The application never writes directly to Supabase.

---

# UUID Strategy

Every record uses UUID v4.

UUIDs are generated on the device.

Benefits:

- Works offline
- No ID conflicts
- Simple synchronization
- Easy future migration

Never use auto-increment IDs for business entities.

---

# Timestamp Standard

All timestamps use UTC ISO-8601.

Example

```
2026-07-18T08:42:31Z
```

Every table should contain

```
created_at

updated_at
```

where applicable.

---

# Worker

Represents a single authenticated employee.

This table is synchronized from Supabase.

Worker data is read-only on the device.

## Fields

| Field | Type |
|----------|-----------|
| id | UUID |
| full_name | Text |
| employee_code | Text |
| active | Boolean |
| created_at | Timestamp |

---

# Shift

Represents one work session.

Created locally.

Uploaded after synchronization.

## Fields

| Field | Type |
|----------|-----------|
| id | UUID |
| worker_id | UUID |
| started_at | Timestamp |
| ended_at | Timestamp (nullable) |
| status | Text |
| sync_status | Text |
| created_at | Timestamp |
| updated_at | Timestamp |

---

## Status

Possible values

```
ACTIVE

COMPLETED
```

---

## Sync Status

```
PENDING

SYNCED

FAILED
```

Only Sync Engine may modify this field.

---

# GPS Location

Stores every accepted GPS coordinate.

This is expected to become the largest table.

## Fields

| Field | Type |
|----------|-----------|
| id | UUID |
| shift_id | UUID |
| worker_id | UUID |
| latitude | Real |
| longitude | Real |
| accuracy | Real |
| altitude | Real (nullable) |
| speed | Real (nullable) |
| heading | Real (nullable) |
| recorded_at | Timestamp |
| sync_status | Text |
| created_at | Timestamp |

---

## Notes

Latitude

Longitude

Accuracy

Recorded Time

are mandatory.

Everything else is optional.

---

# Event

Records operational events.

Events explain tracking behaviour.

## Fields

| Field | Type |
|----------|-----------|
| id | UUID |
| worker_id | UUID |
| shift_id | UUID (nullable) |
| event_type | Text |
| message | Text |
| recorded_at | Timestamp |
| sync_status | Text |

---

## Example Events

```
SHIFT_STARTED

SHIFT_STOPPED

TRACKING_STARTED

TRACKING_STOPPED

GPS_DISABLED

GPS_ENABLED

INTERNET_LOST

INTERNET_RESTORED

SYNC_STARTED

SYNC_COMPLETED

SYNC_FAILED

APP_RESTARTED

FOREGROUND_SERVICE_RESTARTED
```

---

# Sync Queue

Instead of creating a dedicated queue table, synchronization is determined by:

```
sync_status
```

inside each business table.

Advantages

- Simpler implementation
- Less duplication
- Easier recovery
- No queue corruption

The Sync Engine queries

```
WHERE sync_status='PENDING'
```

---

# Local Only Data

The following remains only on the device.

```
Configuration cache

Authentication session

Application settings

Temporary runtime state
```

No synchronization required.

---

# Supabase Tables

Initial tables

```
workers

shifts

locations

events
```

Nothing more for MVP.

---

# SQLite Tables

```
workers

shifts

locations

events
```

Identical naming simplifies debugging.

---

# Relationships

```
Worker

│

├── Shift

│      │

│      ├── GPS Locations

│      │

│      └── Events
```

---

# Deletion Policy

Workers

Never deleted.

Inactive only.

---

Shifts

Never deleted.

Historical record.

---

Locations

Never deleted.

Historical record.

---

Events

Never deleted.

Operational audit.

---

# Indexes

SQLite should create indexes on

```
worker_id

shift_id

recorded_at

sync_status
```

No premature optimization.

Only essential indexes.

---

# Synchronization Rules

Order

```
Shift

↓

Locations

↓

Events
```

Reason

Locations cannot exist without Shift.

Events may reference Shift.

---

# Upload Rules

Never upload

```
FAILED
```

without retry.

Never upload

```
SYNCED
```

again.

Upload only

```
PENDING
```

records.

---

# Conflict Strategy

The worker application owns creation.

The admin dashboard is read-only.

Therefore,

conflicts are extremely unlikely.

If encountered,

latest update wins.

Keep implementation simple.

---

# Row Level Security (Supabase)

Every worker may only access

their own records.

Administrators may access all records.

Service Role Key is never exposed to the client.

---

# Data Retention

SQLite

Retain until

successful synchronization.

Historical data cleanup can be introduced later.

Not part of MVP.

---

# Migration Strategy

Schema changes must be versioned.

Do not modify existing production schema manually.

Every change should include

- migration
- rollback (where practical)

---

# Engineering Workflow

## Architecture Office Actions

- Freeze this schema before implementation.
- Any schema changes after implementation begins must be recorded in `ARCHITECTURE_DECISIONS.md`.

---

## Manual Actions

### 1. Create Supabase Tables

Do **not** let AI Studio invent the schema.

We will create the schema ourselves using SQL migrations.

### 2. Keep SQLite Schema Equivalent

SQLite should mirror Supabase as closely as possible.

### 3. Commit

Commit this document before any Engine implementation begins.

---

## Engineering Team (AI Studio)

When implementation starts:

- Read `03_Engines.md`
- Read `04_Database.md`
- Implement **Configuration Engine only**
- Do **not** implement Storage Engine yet
- Do **not** generate SQL independently
- Stop after Configuration Engine is complete and summarize the implementation

---

# Acceptance Criteria

This document is complete when:

- Every business entity is defined.
- Relationships are finalized.
- Sync lifecycle is finalized.
- UUID strategy is finalized.
- Timestamp standard is finalized.
- No Engine requires additional schema decisions.