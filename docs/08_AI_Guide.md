# AI Assisted Development Guide

This document provides instructions, system prompts, and context guides to enable AI tools to assist in building the codebase.


## Frozen Slice Principle

Every approved implementation slice becomes architecturally frozen.

Future slices may consume existing public APIs.

Future slices may extend capabilities through new modules or optional extensions.

Future slices shall not silently modify, remove, or redefine existing public contracts.

Any change affecting a frozen public contract requires an explicit Architecture Review and an approved Architecture Decision before implementation.

Bug fixes and internal implementation improvements are permitted provided they preserve the published public API and architectural behaviour.