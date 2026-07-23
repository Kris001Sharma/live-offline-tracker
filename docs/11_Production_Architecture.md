# Production Architecture

## Purpose

This document defines the production architecture of the Worker Platform. It documents the production technology choices, security boundaries, authentication model, deployment architecture, and operational principles.

---

## Architecture Overview

The Worker Platform follows an Offline-First architecture where mobile devices operate independently of network connectivity, using local storage for primary data transactions and synchronizing with the central backend asynchronously.

```
Worker Mobile App
      ↓
Offline SQLite
      ↓
Sync Engine
      ↓
Supabase Backend
      ↓
Admin Dashboard
```

- **Worker Mobile App**: Runs on the physical mobile device and handles user interactions and local workflows.
- **Offline SQLite**: Serves as the primary local source of truth on the mobile device.
- **Sync Engine**: Handles bidirectional, asynchronous synchronization between SQLite and Supabase.
- **Supabase Backend**: Functions as the central source of truth after synchronization, hosting relational data and authentication services.
- **Admin Dashboard**: Web interface for management, configuration, monitoring, and reporting.

---

## Production Technology Stack

- **Mobile Client**: Capacitor, React, TypeScript
- **Offline Database**: Local SQLite
- **Backend Service**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Object Storage**: Cloudinary
- **Administration**: Web Dashboard (React / TypeScript)

---

## Authentication Strategy

- Workers authenticate once using Supabase Auth.
- The authenticated session token and refresh token are cached securely on the device in local secure storage.
- The application never requests credentials repeatedly during standard usage.
- Session renewal occurs automatically in the background whenever network connectivity is available.
- The application relies strictly on secure device storage mechanisms to protect tokens.

---

## Device Registration Strategy

- Each worker is assigned exactly one trusted physical device.
- Upon initial registration/provisioning, a unique device identifier is securely stored on the device and registered on the backend.
- Every attendance and tracking operation validates against the registered device identifier.
- Transferring or changing a worker's assigned device requires explicit administrator approval.
- Multiple simultaneous devices for a single worker are not supported.

---

## Worker Login Experience

### First Login
- Credentials required: Email and Password.
- Upon successful authentication, the device binding and cached session are established.

### Subsequent App Launches
- The app automatically restores the cached session token.

### Re-Authentication / Unlocking
- Native biometric authentication (Fingerprint / Face ID) is preferred when supported by the device.
- Fallback: Device PIN / Screen Lock.
- Fallback to password occurs only when biometric/PIN options fail or session tokens expire invalidly.
- Goal: Minimal friction for daily worker workflows.

---

## Admin Authentication

- Administrators authenticate using Supabase Auth.
- Authorization is strictly enforced using Role-Based Access Control (RBAC).
- Field workers cannot access administrative features or API endpoints.
- No secondary or independent authentication system exists; Supabase Auth manages all identities.

---

## User Roles

- **Worker**: Field worker performing check-in, check-out, tracking, tasks, and submission of field data on mobile devices.
- **Administrator**: Operational manager supervising teams, managing geofences, reviewing attendance/tracking records, and approving device registration changes via the dashboard.
- **Super Administrator**: System owner managing system-wide configuration, administrative access control, and global parameters.

---

## Image Storage Strategy

- Binary image files (e.g., attendance selfies, inspection images, evidence photos) are uploaded directly to Cloudinary.
- Supabase stores only image metadata (URL, public ID, timestamp, entity reference).
- Mobile devices cache binary images temporarily in local offline storage until synchronization occurs.
- SQLite never stores binary image data (BLOBs); only local file paths or remote metadata URLs are stored locally.

---

## Offline Synchronization

- SQLite is always the primary local source of truth on the mobile device.
- Synchronization between SQLite and Supabase is strictly asynchronous and decoupled from local transaction execution.
- Operational actions (check-in, check-out, location logging) never block or fail due to network state or connectivity issues.

---

## Security Principles

- **Least Privilege**: Users and services operate with minimal necessary access rights.
- **Offline-First Security**: Local data is encrypted at rest; tokens are stored in secure platform storage.
- **Client Key Isolation**: The Supabase `Service Role Key` is strictly forbidden inside mobile or web clients; client access uses `Anon Key` with Row Level Security (RLS).
- **Transport Security**: HTTPS and TLS 1.3 for all network communication.
- **Device Binding**: Only verified, registered devices can emit location and attendance events.
- **Role-Based Authorization**: Strict authorization checks on backend endpoints and UI interfaces.

---

## Scalability

The architecture is designed to support the expansion of future domain modules without changing the core platform, engines, or storage interfaces:
- Attendance
- Tracking
- Client Visits
- Tasks
- Forms
- Inspections
- Assets
- Geofencing

---

## Out of Scope

This document intentionally excludes:
- Database table schemas and migration SQL
- Internal Engine method implementations
- Repository SQL query definitions
- API endpoint payload contracts
- UI design tokens and visual layouts

---

## Acceptance Criteria

- Production stack is frozen.
- Authentication model is frozen.
- Device registration strategy is frozen.
- Image storage strategy is frozen.
- Deployment architecture is frozen.
- Future module implementations will adhere to these established boundaries without requiring foundational architectural re-engineering.

---

## Architecture Baseline (Pre-Phase 8)

### Verified Subsystems
The following completed engines have been audited and verified for production:
- Configuration Engine
- Storage Engine (SQLite)
- Migration Engine
- Location Provider (GPS)
- Location Evaluation Engine
- Tracking Engine (Orchestration)
- Tracking Session (Scheduler)
- Tracking Health (Diagnostics)
- Attendance Engine (Lifecycle)
- Attendance Repository
- Event Engine
- Authentication Engine (Lifecycle)
- User Context Engine (Runtime Identity)
- Worker Profile Engine (Business Profile)
- Auth Session Engine (Orchestration)
- Trusted Device Engine (Device Identity)
- Trusted Device Registration Engine (Workflow)

All listed engines are officially frozen prior to synchronization.

### Current Dependency Graph
The baseline enforces a strict unidirectional dependency graph with no upward dependencies or circular imports:
`Authentication` -> `User Context` -> `Worker Profile` -> `Auth Session` -> `Attendance` -> `Tracking` -> `Repositories` -> `Storage` -> `SQLite`.

### Engine & Repository Ownership
- **Engines** own orchestration and business rules (e.g. tracking rules, attendance states, profile handling).
- **Repositories** strictly own SQL execution, persistence mapping, and lookup queries. No business logic resides in repositories.

### Offline-First Readiness
Every completed subsystem (Tracking, Attendance, Events, Repositories, Authentication via cached sessions, Trusted Device) has been verified to function autonomously without cloud connectivity. Data transactions securely persist to local SQLite.

### Architectural Health & Rollback Strategy
- Every module enforces consistent, atomic rollback behavior (e.g. `rollbackAuthentication()`, `rollbackSession()`, `rollbackRegistration()`) to prevent partial or corrupt states.
- All exported state (`status()`, identities, profiles, registrations) are guaranteed immutable via deep cloning and freezing.
- ADR compliance has been audited with **no deviations detected**.

### Outstanding Risks & Next Steps
- The backend remains isolated from the cloud backend.
- **Phase 8 (Synchronization)** will introduce the background upload pipeline to sync the authoritative local SQLite store with Supabase.
