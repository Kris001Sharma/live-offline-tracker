# Validation Workspace

This directory is the permanent home for every validation harness, regression test, execution utility, and future Quality Gate implementation.

## Architecture

- `repository/`: Validation harnesses for offline-first local repositories (testing SQLite persistence, object mapping, and constraints).
- `engine/`: Validation harnesses for business feature engines (testing state machines, orchestration, and domain logic).
- `integration/`: Integration tests combining multiple layers.
- `synchronization/`: Validation harnesses for offline/online synchronization engines.
- `production/`: Validation of production readiness.

## Rules

- Validation infrastructure must remain completely isolated from production code (never inside `modules/` or `src/`).
- Validation harnesses must never execute automatically during application startup.
- They must never become part of production builds.
- Future Quality Gates must extend this validation framework rather than creating isolated validation scripts.
