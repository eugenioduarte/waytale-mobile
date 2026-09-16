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
- Use MSW for API mocking — handlers in `src/test/msw/handlers.ts`
- Setup server in `src/test/msw/server.ts` — call `server.listen()` in `beforeAll`

## E2E tests (Maestro — Mobile)
- Flows in `e2e/maestro/flows/*.yaml`
- Each flow covers one critical user journey (auth, checkout, core happy path)
- Run with: `pnpm e2e` or `pnpm e2e:smoke`
- Mock external API via Mockoon for local E2E
- Prefer stable text/accessibility labels; add `accessibilityLabel` for dynamic text

## E2E tests (Playwright — Web)
- Cover only critical user journeys
- Must run in CI on every PR to main

## Storybook
- Every reusable component needs a `.stories.tsx` file
- Cover: default, all prop variants, loading/error/empty where applicable
- Stories are the contract for visual review
