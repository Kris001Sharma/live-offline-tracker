# Project Roadmap

This document outlines the milestones, feature releases, and chronological plan for the development of Sapana Live Tracker.

---

## Phase Summary

| Phase | Title | Status |
| ----- | ----- | ------ |
| **Phase 1–4** | Core Infrastructure | ✅ COMPLETED |
| **Phase 5** | Offline GPS Tracking | ✅ COMPLETED |
| **Phase 6** | Attendance | ✅ COMPLETED |
| **Phase 7** | Identity & Authentication | ✅ COMPLETED |
| **Phase 8** | Synchronization | ⏳ PLANNED |
| **Phase 9** | Administration | ⏳ PLANNED |
| **Phase 10** | Application Shell & UI | ⏳ PLANNED |
| **Phase 11** | Production Hardening | ⏳ PLANNED |
| **Phase 12** | Deployment & Release | ⏳ PLANNED |

---

## Detailed Phase Breakdown

### Phase 1–4: Core Infrastructure
- **Status**: COMPLETED ✅
- **Scope**: Core configuration, storage, SQLite adapter, repository layer, domain types, event engine, location provider, and evaluation infrastructure.

---

### Phase 5: Offline GPS Tracking
- **Status**: COMPLETED ✅
- **Scope**:
  - Tracking Engine
  - Tracking Session
  - Background Execution
  - Tracking Health
  - Recovery
  - End-to-End Validation

---

### Phase 6: Attendance
- **Status**: COMPLETED ✅
- **Scope**:
  - Attendance Engine
  - Location Validation
  - Attendance Repository
  - Event Integration
  - Attendance Recovery
  - End-to-End Validation

---

### Phase 7: Identity & Authentication
- **Status**: COMPLETED ✅
- **Scope**:

| Slice | Title | Status |
| ----- | ----- | ------ |
| **7A** | Authentication Engine | ✅ COMPLETED |
| **7B** | User Context Engine | ✅ COMPLETED |
| **7C** | Authentication Session | ✅ COMPLETED |
| **7D** | Worker Profile Engine | ✅ COMPLETED |
| **7D-A** | Worker Profile Hardening | ✅ COMPLETED |
| **7E** | Trusted Device Registration | ✅ COMPLETED |
| **7E-A** | Trusted Device Engine Hardening | ✅ COMPLETED |
| **7E-B** | Trusted Device Engine Final Hardening | ✅ COMPLETED |
| **7F** | Trusted Device Registration | ✅ COMPLETED |
| **7F-A** | Trusted Device Registration Hardening | ✅ COMPLETED |
| **7G** | Authentication Hardening | ✅ COMPLETED |
| **7H** | End-to-End Identity Validation | ✅ COMPLETED |

#### Slice Responsibilities
- **7A Authentication Engine**: Supabase Auth integration, sign-in/out, session restoration, error handling.
- **7B User Context Engine**: In-memory, immutable current worker identity state and role accessor.
- **7C Authentication Session**: Orchestration between Authentication Engine and User Context Engine with rollback support.
- **7D Worker Profile Engine**: Manages application-specific worker metadata (employee code, role, active status, organization, trusted device reference, profile sync). Replaces temporary placeholders in Auth Session.
- **7E Trusted Device Registration**: Single trusted Android device management, device registration, admin approval, device replacement. Intentionally simple without root/emulator detection.
- **7F Trusted Device Registration**: SQLite device registration persistence, status check, pending registration management.
- **7F-A Trusted Device Registration Hardening**: Atomic registration transaction, defensive runtime validation, registration rollback, repository ownership, exception translation, deep freeze immutability.
- **7G Authentication Hardening**: Session consistency validation, robust offline authentication behavior, immutable state, single rollback path.
- **7H End-to-End Identity Validation**: Architecture audit, offline authentication verification, session restore, logout recovery, trusted device scenarios, documentation freeze.

---

### Milestone: Architecture Baseline Audit (Pre-Phase 8)
- **Status**: COMPLETED ✅
- **Scope**: All completed backend engines verified. Architecture validated. Backend ready for synchronization.

---

### Phase 8: Synchronization
- **Status**: PLANNED ⏳
- **Scope**: Upload pipeline for Locations, Attendance, Events, and future Photos. SQLite remains the authoritative offline source of truth.

| Slice | Title | Status |
| ----- | ----- | ------ |
| **8A** | Sync Foundation | ⬜ SCHEDULED |
| **8B** | Connectivity Monitoring | ⬜ SCHEDULED |
| **8C** | Upload Pipeline | ⬜ SCHEDULED |
| **8D** | Retry Strategy | ⬜ SCHEDULED |
| **8E** | Conflict Handling | ⬜ SCHEDULED |
| **8F** | End-to-End Validation | ⬜ SCHEDULED |

---

### Future Phases

- **Phase 9**: Administration
- **Phase 10**: Application Shell & UI
- **Phase 11**: Production Hardening
- **Phase 12**: Deployment & Release
