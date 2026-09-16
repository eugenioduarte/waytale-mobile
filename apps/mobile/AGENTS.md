# apps/mobile — Overrides

Read the root `AGENTS.md` and `.agents_local/` first; this file only adds what's specific to this
package.

- Runtime facts (Expo SDK, React Native, routing) live in `.agents_local/agentic.md` — don't
  duplicate them here, they'd drift.
- Routes root is `src/app/` (expo-router). Shared design-system components come from
  `@waytale/ui` (`packages/ui`) once EPIC-02 lands — don't reinvent primitives locally.
- Monorepo resolution depends on `metro.config.js` (watches the workspace root, disables
  hierarchical lookup) — don't remove it or `expo start`/`expo export` will fail to resolve
  `packages/*`.
- Scripts here run through the root `.npmrc` (`node-linker=hoisted`) — don't add a
  package-local `.npmrc` that changes that.
