# PR Lifecycle Compatibility Command

This legacy command remains for compatibility. Apply the `pr-workflow` skill and the closest `AGENTS.md`.

`$ARGUMENTS` may contain a PR number and one explicitly requested phase: `inspect`, `create`, `fix`, `push`, `reply`, `monitor`, or `merge`.

Rules:

1. Resolve the exact authorized phase from the user's request. If it is absent or ambiguous, perform read-only inspection and report the available next actions.
2. Never treat this command as authorization for the complete lifecycle.
3. Commit, push, external replies, and merge require explicit authorization for that exact action.
4. Never force-push. Never merge without required approvals and green checks.
5. Recheck state after meaningful changes; do not poll unchanged state aggressively.
6. Stop after three failed attempts for the same cause and report the evidence.
