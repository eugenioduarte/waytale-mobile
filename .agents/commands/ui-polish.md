# UI Polish — Legacy command adapter

This legacy command is retained for compatibility. Prefer invoking `ux-standards` with `react-native-patterns`.

**Invocation:** `/ui-polish [feature-name]`

`feature-name` is required. It must match an implemented screen and an SDD in `.agents_local/sdd/`.

---

## Pre-flight Checks

```bash
ls .agents_local/sdd/*-$ARGUMENTS.sdd.md
find apps/mobile/src/screens -path "*$ARGUMENTS*" -type f
```

If the screen is missing, stop and report:

```text
⛔ Screen not found for feature: $ARGUMENTS
Run /implement-logic $ARGUMENTS first.
```

## Read Before Polishing

1. `.agents_local/sdd/*-$ARGUMENTS.sdd.md`
2. `.agents/agents/design-docs.md`
3. `.agents/skills/ux-standards/SKILL.md`
4. active theme and shared component surfaces
5. the target screen and any local subcomponents

## Polishing Checklist

- replace raw structure with project components where appropriate
- remove inline visual styles
- apply theme tokens for color, typography, spacing, borders, and loading states
- ensure loading, error, empty, and populated states are visually complete
- add accessibility labels to actionable elements
- preserve unrelated code and do not introduce placeholder markers

## Post-Polish Validation

```bash
pnpm --filter @ta-na-mao/mobile typecheck
pnpm --filter @ta-na-mao/mobile lint
```

The expected grep output is empty.

## Report

```text
✅ UI polish complete: [feature-name]
TypeScript: ✅ no new errors
Lint: ✅ passing
Runtime evidence: [performed or unavailable]
```

## Arguments

`$ARGUMENTS` — feature name, required.
