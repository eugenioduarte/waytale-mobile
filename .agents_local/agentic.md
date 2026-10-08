# Active Agentic Runtime

This file holds project-specific facts that may change independently from the portable agent framework.

## Current mobile runtime

- Expo SDK ~57 and React Native 0.86 (TypeScript strict).
- `expo-router` (file-based routing), routes root is `src/app/`. Do not assume React Navigation.
- Expo MCP remains disabled until the project is upgraded to a supported SDK and OAuth is configured
  (see `.codex/config.toml`).

## Backend / Supabase

- Project ref: `iqmnbzgsqmmalqzdyxjg`. Used in `.mcp.json` (Claude Code) and
  `.codex/config.toml` (`mcp_servers.supabase`) — both point at the real Waytale project now,
  not a placeholder.
- MCP scopes enabled: `docs`, `account`, `database`, `debugging`, `development`, `functions`,
  `branching`.
- Authentication is per-machine/session, not stored in the repo: run `claude /mcp` in a regular
  terminal (not an IDE extension) and authenticate the `supabase` server there.
- App env vars live in `apps/mobile/.env.local` (gitignored; template `apps/mobile/.env.example`):
  `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`, the
  new key format — not the legacy anon key). Anything `EXPO_PUBLIC_*` ships in the bundle.
- Sign-in is by email code only (6 digits, no passwords); phone auth is off and Google is
  deferred. The user configured Resend SMTP, email and code templates on 2026-09-28; real email delivery/login smoke remains assigned to EPIC-04.
- The secret key (`sb_secret_…`), personal access token (`sbp_…`) and DB password are for the
  Supabase CLI only (`supabase/.env.local`, gitignored) — never in the app, the repo or chat.
- Supabase CLI: not installed globally; run it as `pnpm dlx supabase@2.117.0 <command>`.
  Migrations are in `supabase/migrations/`; `pnpm --filter @waytale/supabase test` checks RLS on
  a local Postgres (PGlite), no Docker needed.

## Firebase

- Project: `waytale-36b9f` (sender `205523884817`). Android and iOS apps are both registered as
  `com.waytale.app`. Only Android is being tested for now; iOS prebuild needs macOS (or EAS).
- Hand-over folder `arquivos_temp/` (repo root, gitignored): new config files arrive there; move
  them to `apps/mobile/` and empty the folder.
- `apps/mobile/google-services.json` / `GoogleService-Info.plist` are gitignored; download them
  from the Firebase console (Project settings › Your apps). In EAS they come from file env vars
  (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICE_INFO_PLIST`), set up in 01.13.
- Test push: Firebase console › Messaging › new campaign › "Send test message", with the FCM
  token printed in the Metro logs (`[push] FCM token:`). App Distribution is 01.13.

## Design source

- Claude Design project id: **TBD** — not yet confirmed for this repo, do not reuse an id from
  another project.
- Requested entry file: likely one of `Waytale UI Screens.dc.html`, `Waytale Design System.dc.html`,
  `Waytale Prototype.dc.html` (see `../description.md`), but not yet imported here.
- Shared MCP server name: `claude_design`.
- Authentication is interactive through Claude Code `/design-login`; credentials must not be stored in the repository.
- Until the project is imported through the authenticated MCP, do not invent screens/components —
  build only from `../description.md`, `../.user_stories/`, and explicit user instructions.

## Checkpoint policy

Use event-driven checkpoints, not periodic polling:

1. Complete one small coherent batch.
2. Run `validation-agent` against the focused diff and applicable checklist.
3. Fix only actionable failures, then rerun the failed check.
4. Stop after three attempts for the same cause and report the blocker.
5. Run a final checkpoint before handoff.

This policy keeps context small, makes loops deterministic, and works across Claude Code, Codex, and other tools that can read repository instructions.

## CI/CD scope (2026-10-06)

- Android only, including builds, Maestro and Firebase App Distribution. iOS is deferred in
  `.user_stories/EPIC-01-setup-projeto/subtasks/01.14-pendencias-ios.md`.
- Local quality command: `pnpm verify` (also Husky pre-commit/pre-push and CI).
- EAS/Sonar/Firebase provisioning and branch-protection verification are tracked in
  `.user_stories/EPIC-01-setup-projeto/PENDENCIAS.md`; workflow presence is not remote execution evidence.
