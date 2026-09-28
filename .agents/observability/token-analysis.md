# Token Economics

> Data source: real sessions only, collected via the Stop hook (`log-claude-tokens.sh`).
> No sessions recorded yet for this repository.

## Current State

**Sessions tracked:** 0

Once sessions accumulate, this file should report total tokens, cost breakdown by component
(input/output/cache), and per-session notes — see `.agents/observability/README.md` for the
methodology and `update-token-totals.sh` / `report-runs.mjs` for how the numbers are generated.

## Pricing Reference

| Token type | Rate |
|---|---|
| Input | $3.00 / 1M |
| Output | $15.00 / 1M |
| Cache read | $0.30 / 1M |

Update this table if pricing changes.
