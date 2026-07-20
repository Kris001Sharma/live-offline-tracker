# Project Roadmap

This document outlines the milestones, feature releases, and chronological plan for the development of Sapana Live Tracker.


| Engine              | Status    | Owner | Depends On          |
| ------------------- | --------- | ----- | ------------------- |
| Configuration       | ✅ Frozen  | Core  | None                |
| Storage             | ✅ Frozen  | Core  | Configuration       |
| SQLite Adapter      | ✅ Frozen  | Core  | Storage             |
| Domain              | ✅ Frozen  | Core  | None                |
| Event               | ✅ Frozen  | Core  | Repository          |
| Location Provider   | ✅ Frozen  | Core  | None                |
| Location Evaluation | ⏳ Planned | Core  | Location            |
| Tracking            | ⏳ Planned | Core  | Location Evaluation |
| Attendance          | ⏳ Planned | Core  | Tracking            |
| Sync                | ⏳ Planned | Core  | Event               |
| Background Worker   | ⏳ Planned | Core  | Tracking            |
| Admin API           | ⏳ Planned | Admin | Sync                |
