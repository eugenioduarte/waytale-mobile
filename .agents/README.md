# Agentic Engineering System

This directory contains portable, repository-scoped agent capabilities. `AGENTS.md` is the instruction entry point; this file documents the system layout for maintainers.

## Architecture

```text
AGENTS.md                    durable repository instructions
apps/mobile/AGENTS.md        mobile-specific overrides
.agents/skills/              open Agent Skills workflows
.agents/roles/               vendor-neutral role contracts
.agents/evals/               versioned cases, rubrics, runner, and reports
.codex/agents/               Codex custom-agent adapters
.claude/agents/              Claude Code subagent adapters
.claude/skills -> ../.agents/skills
                              Claude skill-discovery adapter
.agents_local/               product, stack, and active SDD context
.mcp.json                    shared Claude MCP endpoints without secrets
.codex/config.toml           trusted-project Codex settings and MCP endpoints
```

## Design rules

- Put durable facts and constraints in the closest `AGENTS.md`.
- Put repeatable workflows in a focused skill.
- Put live data or controlled actions behind MCP.
- Use agents for isolated specialist work, not as mandatory handoff stages.
- Keep tool-specific configuration in its tool-specific directory.
- Keep secrets in environment variables or ignored local settings.
- Encode deterministic checks in scripts and CI.
- Evaluate provider behavior with the same versioned cases and rubrics; keep raw runs ignored.
- Keep project/product context in `.agents_local/`; do not duplicate it in skills.
- Use event-driven checkpoints after coherent batches; do not spend tokens polling unchanged state.
- Keep every project skill available. Select skills by description and load only those relevant to the current batch.

## Validation

Run:

```bash
pnpm agentic:validate
```

The validator checks discovery files, skill metadata, role adapters, stale paths, and obvious secret leakage in tracked agent configuration.

It also validates every skill eval, runs harness tests, and does not contact a model provider. See `.agents/evals/README.md` for benchmark commands and cadence.
