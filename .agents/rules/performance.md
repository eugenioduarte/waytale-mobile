---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "app/**/*.ts"
  - "app/**/*.tsx"
---

# Performance and Quality Rules

## Rendering
- No heavy computation inside render functions or component bodies
- Large lists: use `FlatList` / `FlashList` (mobile) or virtualization (web) — never a raw `ScrollView` over a mapped array
- Memoize only when profiling shows a real gain — premature memoization adds complexity

## State
- Local UI state → `useState`
- Screen business state → hook
- Cross-feature state → Zustand store with selectors
- Server state → TanStack Query
- No global context for frequently-changing state

## Memory and lifecycle
- All event listeners cleaned up on unmount
- All timers and intervals cleared on unmount
- No reference cycles or closures holding large objects

## Code hygiene
- No `console.log` in production code — use a Logger abstraction
- No TODO without a linked issue
- No commented-out dead code
- No reliance on system time without an abstraction (breaks tests)
