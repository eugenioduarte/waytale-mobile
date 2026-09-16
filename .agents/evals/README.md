# Agent Evals

This is the vendor-neutral quality layer for the repository's agent system. It evaluates the same skill cases whether the producer is Claude, Codex, a local model, or another provider.

## What is measured

- task correctness against explicit case expectations;
- repository and React Native alignment;
- scope, safety, evidence, and token discipline;
- provider, model, duration, retries, and token usage for comparison.

The runner never calls a paid model API. It prepares a versioned run bundle, then grades evidence produced by any provider. This keeps CI deterministic and prevents hidden token spend.

## Commands

```bash
pnpm agentic:eval:validate
pnpm agentic:eval:list
pnpm agentic:eval:prepare --skill react-native-patterns --case lifecycle_cleanup --provider codex --model MODEL_ID
pnpm agentic:eval:grade --result .agents_local/eval-runs/RUN_ID/result.json --record
pnpm agentic:eval:report
```

`prepare` creates an ignored bundle with `prompt.md`, `response.md`, and `result.json`. Run the prompt with the provider under evaluation, save its response and evidence, complete each rubric assessment as `pass`, `fail`, or `not_applicable`, then run `grade`. Pass `--record` to publish the scored run into the common local observability stream.

The producer sees the task but not the case expectations. The evaluator reads the versioned suite separately, which reduces answer-shaping and benchmark leakage.

## Quality gates and cadence

- Every PR: run `pnpm agentic:validate`; CI enforces schema and harness tests without model calls.
- When a skill, role, routing rule, or durable instruction changes: run the affected cases before approval.
- Before changing the default provider or model: run the same tagged suite on both candidates and compare score, tokens, duration, and retries.
- Monthly while the system is active: review failures and add a regression case for every repeated failure mode.
- Before a mobile release: run the delivery and React Native cases relevant to changed workflows.

Do not optimize prompts against only one case. Keep a small holdout set outside the repository when model selection has commercial or security impact.

## Scoring policy

Rubrics are versioned in `rubrics.json`; each rubric totals 100 points. A case passes only when its score reaches `minimum_score` and every critical criterion passes. `not_applicable` is forbidden for critical criteria and is removed from the score denominator for non-critical criteria.

Raw run artifacts remain under `.agents_local/eval-runs/` and are ignored because they can contain prompts, diffs, logs, or sensitive product context. Share only reviewed aggregate results.
