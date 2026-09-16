# Waytale — Repository Instructions

Waytale is a mobile app for audio-guided walking tours: narration in the ear, a minimal map on
screen, attention on the city rather than the phone. Full product context lives in
`description.md`; agent-oriented domain/persona/business-rules context lives in
`.agents_local/project.md`.

## Before implementing

1. Read `.agents_local/project.md` (product/domain) and `.agents_local/stack.md` (tech stack,
   what's already scaffolded vs. pending) before writing code.
2. Read `.agents_local/agentic.md` for current runtime facts and design-source status.
3. Read the relevant epic under `.user_stories/epics/` for the feature you're building — each has
   its own stories, acceptance criteria, and estimate.
4. Read `.agents/README.md` for how this repository's agent system (`.agents/`, `.claude/`,
   `.codex/`) is laid out, and the closest `AGENTS.md` for the path you're editing.

## Durable product constraints

1. **Audio first, screen second** — the phone stays in the pocket; the essential is heard.
2. **Living routes, not fixed itineraries** — detours suggested in real time based on interests.
3. **No noise** — every screen has one primary action; no gamification or badges.
4. **Trust in the stories** — every narrative shows its sources and can be reported.
5. **Offline-first** — all UI reads come from local SQLite; network only feeds that local store
   (see `.agents_local/stack.md`).

## Workflow

- `main` is protected — no direct pushes, only merges via pull request.
- Work happens on `develop` or feature branches off it.
- New epics/stories start as markdown under `.user_stories/epics/`, then become GitHub Issues
  (labels `epic`/`story`/`task`/`bug`, templates under `.github/ISSUE_TEMPLATE/`).
