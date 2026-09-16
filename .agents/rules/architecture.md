---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "app/**/*.ts"
  - "app/**/*.tsx"
---

# Architecture Rules

## Layering
- `Model → Service → Query → Hook → Screen/Component` — the flow is one-way
- Screens and components are presentation-only; no business logic
- Hooks own orchestration logic and expose intent-centric APIs to screens
- Services own transport, DTO parsing, and normalization
- DTOs are API contracts and must never reach the UI layer
- Models are domain types, derived from validated API data

## Structure
- No barrel imports (`index.ts` re-exporting everything)
- Feature files co-located: `screen.tsx`, `screen.hook.ts`, `screen.test.tsx`
- Stores must be flat: `{name}.store.ts` with selector subscriptions only

## Components
- Loading, error, and empty states are mandatory when a component fetches data
- Use `StyleSheet.create` for static styles; inline only for dynamic values
- Components must not import services directly
