---
name: react-native-patterns
description: Build, debug, or review Expo and React Native code for lifecycle safety, platform behavior, accessibility, list performance, animations, navigation, offline state, and runtime verification. Use for mobile implementation or review under `apps/mobile`; verify SDK-specific APIs and do not assume Expo Router.
---

# React Native Patterns

1. Read `apps/mobile/AGENTS.md`, the affected flow, and installed package versions.
2. Confirm navigation, state ownership, trust boundaries, and platform scope before editing.
3. Keep render pure and move orchestration to hooks.
4. Clean up effects, timers, listeners, requests, animations, and subscriptions.
5. Handle safe areas, keyboard, accessibility, reduced motion, and platform differences.
6. Virtualize unbounded lists and optimize only after evidence.
7. Preserve offline idempotency, retry, and reconciliation behavior.
8. Run static checks, then verify the changed flow on a simulator or emulator when an approved tool is available.

Read `references/runtime-checklist.md` for UI, lifecycle, performance, and device-verification checkpoints during implementation or review.
