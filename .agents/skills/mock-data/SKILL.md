---
name: mock-data
description: Add or change mock API data and test network scenarios through the project's single Mockoon environment. Use when a feature needs a new endpoint mocked, demo/catalog data, an error or edge-case response for tests, or when a test talks to the network; not for pure unit tests with local function mocks.
---

# Mock Data

All mock network data lives in one place, `tooling/mockoon/`, served by the same Mockoon
environment in dev (`pnpm mockoon`) and in tests (`startMockServer` from `@tests/mockoon`).
Project facts — routes, files, scenarios, ports — are in `.agents_local/sdd/mock-data.md`; read
it first.

1. Mirror the real contract: the mock answers on Supabase's paths (`/auth/v1`, `/rest/v1`,
   `/functions/v1`) with the real response shape. Check the Edge Function or table before
   writing a body.
2. Put bodies in `tooling/mockoon/data/<area>/*.json` (`bodyType: FILE`), not inline in
   `waytale.json`; inline only for one-line error bodies. Catalog rows use the Supabase row
   shape (snake_case, `updated_at`), fixed ISO timestamps and `5a1e…` ids.
3. Model variants as Mockoon rules picked by the request's input (an email, a code, a body
   field), never by editing a response per test. Add the input to `scenarios.json`;
   `server.test.js` fails if a rule and the scenarios drift.
4. Tests import data and scenarios from `@waytale/mockoon-config` / `@tests/mockoon` — never
   copy a mock body into a test, never add an in-test HTTP interceptor. Offline is
   `UNREACHABLE_URL`; clients take `mockFetch` (Jest's global `fetch` has no network).
5. Demo content the app seeds (`src/db/seed.ts`) reads the same `data/rest` rows: change them
   there, and the seed, the mock and the tests follow.
6. Run `pnpm --filter @waytale/mockoon-config test` and the affected app tests.
