---
paths:
  - "**/__tests__/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/*.stories.tsx"
  - "**/e2e/**"
---

# Test Rules

## Coverage

- Global baseline: `≥ 80%`
- Hooks and services: `≥ 90%`

## Unit tests

- No real API calls — mock at the service boundary
- Mocks must be local, explicit, and isolated (no shared global mocks)
- Test behaviour, not implementation details
- One assertion per logical scenario; group with `describe` blocks
- Use `@/` path alias for imports, not relative paths

## Integration tests

- Test full screen flows with mocked API responses
- Must cover loading, error, and empty states
- Use Testing Library (React / React Native) — no Enzyme
- The network is the shared Mockoon mock (`tooling/mockoon/`, skill `mock-data`): `startMockServer()`
  from `@tests/mockoon` in `beforeAll`, `stop()` in `afterAll`; pass `mockFetch` to clients
- Pick error/edge cases by request input from `scenarios` — never redefine responses or intercept
  requests in a test; new mock data goes in `tooling/mockoon/data/`
- Render with `@tests/render` (`renderWithProviders`, `renderApp`); data from `@tests/factories`

## E2E tests (Maestro — Mobile)

- Flows in `apps/mobile/.maestro/*.yaml`
- Each flow covers one critical user journey (auth, onboarding, journey)
- Run with: `pnpm --filter mobile e2e` or `pnpm --filter mobile e2e:smoke`
- Mock external API via Mockoon for local E2E
- Select by `testID` (required on interactive elements, lint rule `waytale/require-testid`); add `accessibilityLabel` for dynamic text

## E2E tests (Playwright — Web)

- Cover only critical user journeys
- Must run in CI on every PR to main

## Storybook

- Every reusable component needs a `.stories.tsx` file
- Cover: default, all prop variants, loading/error/empty where applicable
- Stories are the contract for visual review
