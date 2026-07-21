# Project Roadmap

This document outlines the milestones, feature releases, and chronological plan for the development of Sapana Live Tracker.


| Engine              | Status    | Owner | Depends On          |
| ------------------- | --------- | ----- | ------------------- |
| Configuration       | ✅ Frozen  | Core  | None                |
| Storage             | ✅ Frozen  | Core  | Configuration       |
| SQLite Adapter      | ✅ Frozen  | Core  | Storage             |
| Repository Layer    | ✅ Frozen  | Core  | Storage             |
| Domain              | ✅ Frozen  | Core  | None                |
| Event               | ✅ Frozen  | Core  | Repository          |
| Location Provider   | ✅ Frozen  | Core  | None                |
| Location Evaluation | ✅ Frozen | Core  | Location            |
| Tracking            | ✅ Frozen  | Core  | Location Evaluation |
| Tracking Health     | ✅ Frozen  | Core  | Tracking            |
| Attendance          | ⏳ Planned | Core  | Tracking            |
| Sync                | ⏳ Planned | Core  | Event               |
| Background Worker   | ⏳ Planned | Core  | Tracking            |
| Admin API           | ⏳ Planned | Admin | Sync                |


Phase 1–4: Core Infrastructure (complete)
Phase 5: Offline Data Pipeline (Location Repository, Foreground Service, Recovery ✅, End-to-End Tracking)
Phase 6: Synchronization
Phase 7: Attendance
Phase 8: Applications (Mobile & Admin)