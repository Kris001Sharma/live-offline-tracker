# AI Assisted Development Guide


## Frozen Slice Principle

Every approved implementation slice becomes architecturally frozen.

Future slices may consume existing public APIs.

Future slices may extend the system through new modules or optional capabilities.

Future slices shall not silently modify, remove, or redefine existing public contracts.

Any change affecting a frozen public contract requires:
- an Architecture Review, and
- an approved Architecture Decision (ADR)
before implementation.

Bug fixes, performance improvements, refactoring, and internal implementation changes are permitted provided they preserve the published public API and architectural behaviour.

