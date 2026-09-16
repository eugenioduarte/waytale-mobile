> **[PT]** Este ficheiro é o template de referência para criação de novas funcionalidades (features), definindo a estrutura de pastas obrigatória, ficheiros necessários e padrões de testes para screens React Native.

---

This document is mandatory and overrides default model behavior.

# Feature Template

> Use this as the reference for creating a new screen. Based on `src/screens/auth/login/`. Replace
> `{feature}` with the kebab-case feature name and `{Feature}` with PascalCase.

---

## 📁 Required Folder Structure

```
src/screens/<domain>/{feature}/
  {feature}.screen.tsx          ← presentation layer only
  {feature}.hook.ts             ← business logic
  {feature}.schema.ts           ← Zod validation (if form/input exists)
  components/                   ← screen-specific sub-components (optional)
    some-component.tsx
  __tests__/
    {feature}.hook.test.tsx     ← hook tests (highest priority)
    {feature}.screen.test.tsx   ← screen render tests
```

---

## 📋 Checklist Before Starting

- [ ] Identify the domain group (`auth/`, `charging/`, `map/`, etc.)
- [ ] Define the screen name in kebab-case
- [ ] Confirm which query hooks are needed (`services/query/`)
- [ ] Confirm which store hooks are needed (`store/`)
- [ ] Define form schema if screen has inputs
- [ ] Identify which navigation action this screen triggers (`navigation-manager`)

---

## 🗂 File Responsibilities

| File                          | What it contains                               |
| ----------------------------- | ---------------------------------------------- |
| `{feature}.screen.tsx`        | JSX only. Calls the hook. No logic.            |
| `{feature}.hook.ts`           | State, handlers, queries, store. No JSX.       |
| `{feature}.schema.ts`         | Zod schema + inferred TypeScript type.         |
| `__tests__/*.hook.test.tsx`   | Unit tests for hook logic. Mock all externals. |
| `__tests__/*.screen.test.tsx` | Render tests. Mock the hook.                   |

---

## 🧩 Schema Template (`{feature}.schema.ts`)

```ts
import { z } from 'zod'
import { emailSchema } from '@/src/lib/validation/validation.schemas'

export const {feature}Schema = z.object({
  email: emailSchema,
  // add more fields as needed
})

export type {Feature}FormData = z.infer<typeof {feature}Schema>
```

---

## 🧠 Hook Template

See `hook-template.md`.

---

## 🖥 Screen Template

See `screen-template.md`.

---

## 🧪 Hook Test Template

```tsx
// __tests__/{feature}.hook.test.tsx
import React, { forwardRef, useImperativeHandle } from 'react'
import renderer, { act } from 'react-test-renderer'
import use{Feature}Screen from '../{feature}.hook'

// --------------------
// Mocks
// --------------------

const goTo{NextScreen}Mock = jest.fn()

jest.mock('../../../../lib/navigation/navigation-manager', () => ({
  useNavigationManager: () => ({
    goTo{NextScreen}: goTo{NextScreen}Mock,
  }),
}))

const mutateAsyncMock = jest.fn().mockResolvedValue({ /* expected response shape */ })

jest.mock('../../../../services/query', () => ({
  use{Action}Mutation: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

// --------------------
// Test Harness
// --------------------

type HookApi = ReturnType<typeof use{Feature}Screen>

const TestHarness = forwardRef<HookApi>((_props, ref) => {
  const hook = use{Feature}Screen()
  useImperativeHandle(ref, () => hook, [hook])
  return null
})

TestHarness.displayName = 'TestHarness'

function setup() {
  const ref = React.createRef<HookApi>()
  act(() => { renderer.create(<TestHarness ref={ref} />) })
  if (!ref.current) throw new Error('Hook not mounted')
  return ref.current
}

// --------------------
// Tests
// --------------------

describe('use{Feature}Screen', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('handles the main action successfully', async () => {
    const hook = setup()

    await act(async () => {
      await hook.handle{Action}()
    })

    expect(mutateAsyncMock).toHaveBeenCalledWith({ /* expected args */ })
    expect(goTo{NextScreen}Mock).toHaveBeenCalled()
  })

  it('does not submit with invalid input', async () => {
    const hook = setup()
    // set invalid state...
    await act(async () => { await hook.handle{Action}() })
    expect(mutateAsyncMock).not.toHaveBeenCalled()
  })
})
```

---

## 🔒 Rules

- Screens MUST NOT contain business logic
- Hooks MUST NOT contain JSX
- All external dependencies in hook tests MUST be mocked
- Schema MUST be co-located with the screen
- Tests MUST live in `__tests__/` next to the screen files
