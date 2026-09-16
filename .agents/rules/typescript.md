---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules

- `"strict": true` in every tsconfig — no exceptions
- No implicit `any`; explicit `unknown` at trust boundaries
- Type `useState` when inference is ambiguous
- Prefer exhaustive `switch` with a `default: assertNever(x)` guard
- Avoid unsafe type assertions (`as Foo`) — validate instead
- External data (API responses, storage reads, env vars) must be validated at runtime with zod or equivalent before use
