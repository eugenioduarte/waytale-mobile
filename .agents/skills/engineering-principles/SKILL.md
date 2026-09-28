---
name: engineering-principles
description: Resolve repository trade-offs using clarity, deterministic behavior, isolation, type safety, testability, measured performance, simplicity, and maintainability. Use when rules conflict or an architecture/refactor choice needs rationale; not as an extra checklist for routine edits.
---

# Engineering Principles

When choices conflict, prefer in order:

1. Correct and safe user behavior.
2. Explicit domain and trust boundaries.
3. Deterministic, testable flow.
4. Clear TypeScript contracts.
5. Simple implementation with low coupling.
6. Measured performance over speculative optimization.
7. Maintainability for the next change.

Explain the concrete trade-off. Do not use principles to justify scope expansion or abstraction without evidence.
