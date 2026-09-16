# Delivery checkpoints

## Start

- Confirm outcome, scope, non-goals, approval boundaries, and success criteria.
- Inspect git status and protect unrelated changes.
- Identify the closest `AGENTS.md`, active SDD, trust boundaries, and affected platforms.

## After each coherent batch

- Review only the focused diff.
- Check architecture, types, state ownership, lifecycle cleanup, errors, i18n, accessibility, security, and tests.
- Run the narrowest relevant check.
- Update the plan; do not reread unchanged global context.

## Before handoff

- Run proportionate typecheck, lint, tests, and runtime verification.
- Confirm no secrets, placeholders, debug logs, commented-out code, or unrelated changes were introduced.
- Report commands and observed results, not assumptions.
- List residual risk and any external or manual step.
