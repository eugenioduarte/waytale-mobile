# Feature Delivery — Legacy command adapter

This legacy command is retained for compatibility. Prefer invoking the `feature-delivery` skill.

**Invocation:** `/implement-logic [feature-name]`

`feature-name` is required. It must match an existing SDD at `.agents_local/sdd/*-[feature-name].sdd.md`.

---

## Pre-flight Checks

Before writing code:

```bash
ls .agents_local/sdd/*-$ARGUMENTS.sdd.md
pnpm --filter @ta-na-mao/mobile typecheck
ls apps/mobile/src/models/
ls apps/mobile/src/db/repositories/
ls apps/mobile/src/services/
```

If the SDD is missing, stop and report:

```text
⛔ SDD not found: .agents_local/sdd/*-$ARGUMENTS.sdd.md
Run /business-to-sdd $ARGUMENTS first.
```

## Read Before Implementing

1. `.agents_local/sdd/*-$ARGUMENTS.sdd.md`
2. `.agents/agents/engineer.md`
3. `.agents/agents/architect.md`
4. Relevant migrations, repositories, navigation, and adjacent models

## Implementation Checklist

Implement in this order:

1. domain model
2. DTO and transport mapping
3. persistence and migrations
4. repository boundary
5. hook orchestration
6. functional screen
7. navigation wiring
8. tests

Rules:

- preserve the contract `Model -> Service -> Query -> Hook -> Screen`
- do not leak DTOs into hooks or screens
- keep the screen functional and intentionally light on presentation
- add tests before reporting completion

## Post-implementation Validation

```bash
pnpm --filter @ta-na-mao/mobile typecheck
pnpm --filter @ta-na-mao/mobile lint
pnpm --filter @ta-na-mao/mobile test -- --testPathPattern=$ARGUMENTS
```

Fix failures before reporting success.

## Report

```text
✅ Logic implementation complete: [feature-name]
TypeScript: ✅ no new errors
Lint: ✅ passing
Tests: ✅ passing

Next step: /ui-polish [feature-name]
```

## Arguments

`$ARGUMENTS` — feature name, required.
