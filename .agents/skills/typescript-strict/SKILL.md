---
name: typescript-strict
description: Implement or review strict TypeScript boundaries with explicit state, exhaustive branching, safe narrowing, typed exports, and runtime validation of unknown data. Use for TypeScript changes, DTOs, stores, hooks, navigation, or unsafe assertions.
---

# TypeScript Strict

- Do not introduce implicit or explicit `any`.
- Type exported contracts and ambiguous state explicitly.
- Treat API, storage, environment, navigation, and deep-link input as unknown until validated.
- Narrow discriminated unions exhaustively and make impossible states unrepresentable.
- Avoid unsafe assertions; use parsing, predicates, or schema validation.
- Keep DTO types out of domain and UI layers.
