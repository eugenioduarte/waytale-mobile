---
name: feature-delivery
description: Deliver an approved Tá na Mão feature or fix from scoped requirements through implementation, tests, runtime evidence, and final review. Use when the user asks to build, implement, fix, or complete mobile behavior; require an SDD for architecture-changing work and do not trigger for read-only planning or review.
---

# Feature Delivery

Use an event-driven loop so the workflow remains portable and does not waste tokens on repeated full-context reads.

1. **Orient:** Read the closest `AGENTS.md`, relevant SDD, target files, and adjacent tests. Record scope, invariants, and success criteria in the active plan.
2. **Slice:** Choose the smallest coherent vertical batch. Load only the skills needed for that batch.
3. **Implement:** Change the minimum files required and preserve unrelated work.
4. **Inspect:** Review the focused diff for boundary, state, lifecycle, i18n, accessibility, security, and platform issues.
5. **Verify:** Run the narrowest useful checks and capture actual results.
6. **Checkpoint:** Update the plan after each coherent batch, after any failed validation, and before expanding scope. Stop if authority or requirements are missing.
7. **Close:** Run final proportionate validation and summarize behavior, evidence, risks, and follow-up.

Read `references/delivery-checklist.md` at the first implementation checkpoint and before final handoff. Do not reload it on every tool call.
