# Architecture Decisions

This document records the key architectural decisions made for the Sapana Live Tracker project.

---

## ADR-001: Mobile Platform Selection

- **Decision**: Capacitor selected for the mobile application.
- **Reason**: Allows a single web codebase (React + TypeScript) while supporting native Android plugins and platform integration required for long-running background GPS tracking and platform services.
- **Status**: Approved

---

## ADR-002: Local Data Persistence

- **Decision**: SQLite selected as local storage.
- **Reason**: Provides a reliable, transactional local database engine on mobile devices, ensuring zero data loss during network dropouts and offering robust indexing for queuing and location buffer queries.
- **Status**: Approved

---

## ADR-003: Cloud Backend Infrastructure

- **Decision**: Supabase selected as backend.
- **Reason**: Provides an out-of-the-box PostgreSQL relational database with geodetic extensions, standard user authentication, and secure file storage, minimizing backend deployment and maintenance complexity.
- **Status**: Approved

---

## ADR-004: Architectural Pattern

- **Decision**: Engine + Feature Architecture adopted.
- **Reason**: Decouples reusable core modules (the "engines", such as GPS tracking, local queuing, and server sync) from user-facing UI components and screens (the "features"). This maximizes code reuse, structural clarity, and unit testability.
- **Status**: Approved

---

## ADR-005: Offline-First Philosophy

- **Decision**: Offline First architecture.
- **Reason**: Field workers operate in remote, low-connectivity terrains where they may remain disconnected for extended periods. The local storage is treated as the primary source of truth, with synchronization to the cloud treated as a background, asynchronous process.
- **Status**: Approved

## ADR-006: Engine Dependency Direction

- **Decision**: No Engine shall directly instantiate or depend on another Engine's internal implementation. All Engine interactions shall occur exclusively through their public APIs, with dependencies injected during application bootstrap where required.
- **Reason**: This preserves strict module boundaries, prevents tight coupling between Engines, improves testability, and allows individual Engines to be replaced or extended without affecting the overall architecture.
- **Status**: Approved


## ADR-007: Single Persistence Responsibility

- **Decision**: Each Engine shall perform only one logical persistence operation for a single business action. Where multiple persistence operations appear necessary, the architecture shall be reviewed to simplify the data model or move orchestration to a lower architectural layer.
- **Reason**: This minimizes transactional complexity, reduces failure scenarios, prevents duplicated persistence logic, and keeps Engine responsibilities focused and predictable.
- **Status**: Approved


## ADR-008: Shared Location Services

- **Decision**: All location-based features shall consume a shared Location Provider and shared Location Rule Services. No feature may directly access the native Geolocation APIs or implement its own location validation, distance calculation, or geofence logic.
- **Reason**: Centralizing all location-related functionality eliminates duplicate implementations, guarantees consistent business rules across the application, improves maintainability, and enables new location-based features such as Tracking, Attendance, Client Visits, and Geofencing to be added in a plug-and-play manner.
- **Status**: Approved
