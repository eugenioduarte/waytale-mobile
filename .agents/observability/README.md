# Agent Observability

This directory defines a vendor-neutral event contract for agent runs. Runtime events are stored in `.agents_local/.runtime/observability/run-events.jsonl`, which is ignored because operational metadata can reveal private task context.

## Event rules

- Record token deltas per event, never the cumulative transcript total.
- `token_usage.total` is input plus output; cached input is reported separately and is not added twice.
- Provider/model identifiers come from the runtime event, never from a hardcoded default.
- Store actual provider-reported cost when available; do not embed volatile pricing formulas.
- Do not record prompts, responses, credentials, source snippets, or environment values.

## Commands

```bash
pnpm agentic:metrics:record < run-event.json
pnpm agentic:metrics:report
```

Claude Code uses `log-claude-tokens.sh` as a Stop hook and persists a per-session cumulative checkpoint only to calculate the next delta. Any provider can emit the same `run-event.schema.json` contract through `record-run.mjs`.

The tracked `token-usage.csv`, `orchestration.csv`, `pr-costs.csv`, and generated Markdown files are legacy snapshots from the pre-portable system. They remain for history but are not the source of truth for new measurements.
