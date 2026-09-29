# apps/mobile — Overrides

Read the root `AGENTS.md` and `.agents_local/` first; this file only adds what's specific to this
package.

- Runtime facts (Expo SDK, React Native, routing) live in `.agents_local/agentic.md` — don't
  duplicate them here, they'd drift.
- Routes root is `src/app/` (expo-router). Shared design-system components come from
  `@waytale/ui` (`packages/ui`) once EPIC-02 lands — don't reinvent primitives locally.
- Style with NativeWind classes built from the design tokens (`bg-surface`, `p-4`, `text-body`);
  no `StyleSheet` for spacing, colour or type. Brand semantics (button variants, states) belong in
  design-system components, not repeated class strings. Token values live in
  `tooling/tailwind/tokens.json`; see `.agents_local/stack.md` › Estilo for the rules.
- Monorepo resolution depends on `metro.config.js` (watches the workspace root, disables
  hierarchical lookup) — don't remove it or `expo start`/`expo export` will fail to resolve
  `packages/*`.
- Scripts here run through the root `.npmrc` (`node-linker=hoisted`) — don't add a
  package-local `.npmrc` that changes that.
- A new reusable component gets a `*.stories.tsx` next to it (CSF, types from
  `@storybook/react-native`). Global decorators and store mocks (`parameters.stores`) live in
  `src/storybook/decorators.tsx`; `src/storybook/__tests__/stories.test.tsx` renders every story,
  so a broken one fails the tests. `pnpm storybook` (on-device, `waytale://storybook`) or
  `pnpm storybook:web`.
- Network goes through `getHttp()` (`src/lib/http.ts`) or supabase-js; dates through
  `src/lib/date.ts` — lint rejects `fetch`, `axios`, `Date` and `Intl` elsewhere. Mock data lives
  only in `tooling/mockoon/` (skill `mock-data`); `pnpm mockoon` + `pnpm start:mock` runs the app
  against it.
- Tests: helpers in `tests/` (import `@tests/render`, `@tests/factories`, `@tests/mockoon`),
  see `.agents_local/sdd/test-strategy.md`. Interactive elements need a `testID`
  (`<screen>-<action>`, lint rule `waytale/require-testid`); screens get `screen-<route>`. Never put
  tests under `src/app/` (expo-router would treat them as routes).
