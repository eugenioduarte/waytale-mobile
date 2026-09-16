# Business Analyst — Legacy command adapter

This legacy command is retained for compatibility. Prefer invoking `business-analysis` and `sdd-creation` as skills.

**Invocation:** `/business-to-sdd [feature-name]`

- If `feature-name` is provided, use the matching user-supplied brief.
- If no brief is discoverable, stop and report what input is missing.

---

## Execution Steps

### Step 1 — Discover summaries

Do not assume or create an inbox path.

### Step 2 — Read required context

Read in this order:

1. `.agents/agents/design-docs.md`
2. `.agents/skills/business-analysis/SKILL.md`
3. Existing SDDs in `.agents_local/sdd/`
4. `.agents/agents/architect.md`
5. Existing domain models and migrations relevant to the feature

### Step 3 — Generate the SDD

Rules:

- preserve the business intent without inventing requirements
- align the design with the closest `AGENTS.md`
- mark unknowns as `TBD`
- if the feature name has no sequence yet, use the next available `NN-` prefix in `.agents_local/sdd/`

Write the result to:

```text
.agents_local/sdd/[sequence]-[feature-name].sdd.md
```

### Step 4 — Report

Output:

```text
✅ SDD created: .agents_local/sdd/[sequence]-[feature-name].sdd.md

Next step: /implement-logic [feature-name]
```

Never delete the source brief unless the user explicitly requests deletion. If it is too vague, report missing information instead of guessing.

## Arguments

`$ARGUMENTS` — optional feature name. If empty, processes all summaries in the inbox.
