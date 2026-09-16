---
name: coding-conventions
description: Apply repository naming and structure to React Native files, components, hooks, stores, services, queries, navigation, tests, and constants. Use when creating, moving, or reviewing code; follow the surrounding feature when legacy naming differs and avoid broad renames outside scope.
---

# Coding Conventions

Use this skill when creating new files, naming identifiers, reviewing naming consistency, or deciding where code belongs.

---

## File and Folder Naming

- Prefer `kebab-case` for new folders and files.
- Preserve the surrounding feature's naming when a rename is outside scope.
- File suffix patterns:
  - `{name}.screen.tsx` — screens
  - `{name}.hook.ts` — hooks
  - `{name}.schema.ts` — validation schemas
  - `{name}.model.ts` — domain models
  - `{name}.store.ts` — Zustand stores
  - `{name}.dto.ts` — DTO and API contracts
  - `{name}.test.tsx` / `{name}.test.ts` — tests (never `.spec`)

---

## Components

- Export name: `PascalCase`
- File name: `kebab-case`
- Avoid redundant feature prefixes when context is already clear.

---

## Hooks

- Must start with `use`
- Screen-level hooks: `use{ScreenName}Screen` — e.g. `useLoginScreen`
- Shared hooks: `use{DomainIntent}` — e.g. `useUserLocation`
- Never suffix with `Hook`

---

## State Variables

| Pattern | Prefix | Examples |
|---|---|---|
| Boolean state | `is` / `has` / `should` / `can` | `isLoading`, `hasError`, `canProceed` |
| Internal handlers | `handle` | `handleSubmit`, `handleRetry` |
| Prop callbacks | `on` | `onPress`, `onSubmit` |

Avoid: `loading`, `errorState`, generic `handler`

---

## Models

- Type name: `PascalCase`
- No `I` prefix, no `Interface` suffix
- One model per file, or closely related models grouped
- Example: `export type User = { id: string; name: string }`

---

## DTOs

- Must end with `Dto` — e.g. `AuthLoginResponseDto`, `UserProfileDto`
- Never expose DTO types beyond the service boundary

---

## Store

- One flat file per domain: `{name}.store.ts`
- No separation into `slices/`, `domains/`, `flows/`
- File contains: `create()` + state + actions + exported hooks
- Hook naming:
  - State access: `useUser()`, `useIsAuthenticated()`
  - Action group: `useAuthActions()` — returns all actions for that domain

---

## Services

- API layer: verb-driven pure functions — `loginWithPKCE()`, `fetchCustomerStats()`
- No generic class containers like `UserService`
- DTO files: `{domain}.dto.ts`

---

## Query Layer

- Mutation hooks: `use{Action}Mutation` — e.g. `useLoginWithPkceMutation`
- Query hooks: `use{Resource}Query` — e.g. `useCustomerStatsQuery`
- Avoid generic names like `useData`, `useFetch`

---

## Constants

- `SCREAMING_SNAKE_CASE` — e.g. `MAX_RETRY_ATTEMPTS`, `CREDENTIALS_STORAGE_KEY`

---

## Navigation

- Use typed React Navigation definitions from `src/lib/navigation/`.
- Keep navigation decisions in screen hooks or the existing navigation abstraction, not presentational components.
- Do not introduce Expo Router APIs.

---

## Logger

- Tag format: `{Category}.{Subcategory}`
- Examples: `new Logger('Store.UserDomain')`, `new Logger('Api.Auth')`, `new Logger('Screen.Login')`

---

## Prohibited Patterns

- `I` prefix on interfaces or types
- `Hook` suffix on hooks
- Generic names such as `utils` or `helper` without domain context
- Abbreviations that obscure meaning
- Deep nested names like `login-form-input-field-container.tsx`
- New `.spec.ts` files when the surrounding suite uses `.test.ts(x)`
