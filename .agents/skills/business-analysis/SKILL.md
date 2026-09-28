---
name: business-analysis
description: Convert a product brief, business summary, or feature idea into an implementation-grade SDD for Tá na Mão. Use when requirements need scope, flows, domain rules, architecture impact, risks, rollout, and acceptance criteria; store approved documents in `.agents_local/sdd/` and do not trigger for direct implementation.
---

# Business Analysis

1. Read the brief completely and preserve its intent.
2. Read `.agents_local/project.md`, `.agents_local/stack.md`, relevant SDDs, and adjacent code.
3. Separate facts, assumptions, decisions, and unknowns. Mark unknowns `TBD`.
4. Define objective, scope, exclusions, personas, flows, states, domain rules, data, integrations, security, rollout, rollback, verification, risks, and open questions.
5. Align the design with the closest `AGENTS.md` and current code; describe intentional exceptions explicitly.
6. Use `sdd-creation` and its template for the final artifact.
7. Store approved SDDs in `.agents_local/sdd/`. Never delete a source brief unless explicitly requested.
