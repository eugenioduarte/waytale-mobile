---
name: pr-workflow
description: Execute a deterministic pull-request workflow only when the user explicitly asks to create a PR, inspect or fix CI/review feedback, push changes, or merge. Respect the exact authorized phase, verify gates, and never merge implicitly.
---

# PR Workflow

1. Resolve the exact authorized phase: create, inspect, fix, push, reply, monitor, or merge.
2. Inspect branch, diff, worktree, PR state, checks, and unresolved review context before acting.
3. Make only changes needed for the authorized phase and run focused validation.
4. Recheck CI or review state after each meaningful update; do not poll unchanged state aggressively.
5. Stop after three failed attempts for the same cause and report evidence.
6. Require explicit user authorization for commit, push, external replies, and merge unless that exact action is already in the request.
7. Never force-push. Never merge without required approval and green checks.
