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
