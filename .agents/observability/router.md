# Model Routing Policy

Routing is capability- and evidence-based, not tied to a permanent vendor.

## Decision order

1. Classify risk: architecture, security, destructive/external actions, and ambiguous product decisions require the strongest proven model and explicit gates.
2. Minimize context: load the closest instructions, selected skill, focused files, and previous checkpoint only.
3. Prefer deterministic tools for search, transforms, lint, tests, schemas, and reports.
4. Use a cheaper or local model only after it passes the same relevant eval cases and critical rubric criteria.
5. Escalate after a classified quality failure, not merely because a task is long.

## Evaluation gate

Before changing the default provider or model, run identical cases from `.agents/evals/` and compare:

- critical-criterion pass rate;
- overall pass rate and score;
- input/output/cache tokens;
- duration and retries;
- actual reported cost when available.

Quality is the gate and token efficiency is the optimizer. A cheaper run that fails a critical criterion is not a saving.

## Practical tiers

| Tier                   | Suitable work                                                     | Required evidence                         |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Deterministic          | discovery, validation, formatting, reports                        | command exit and focused output           |
| Economy model          | bounded boilerplate, translations, test scaffolds                 | affected eval cases and code checks       |
| Strong reasoning model | architecture, security, debugging, cross-layer refactors          | critical eval pass plus repository checks |
| Human gate             | production, destructive actions, merge, unclear product authority | explicit user approval                    |

Re-evaluate routing monthly and whenever instructions, tools, default models, or failure patterns change.
