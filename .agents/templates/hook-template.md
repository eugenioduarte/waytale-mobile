> **[PT]** Este ficheiro é o template padrão para hooks de ecrã (screen hooks), definindo a estrutura obrigatória, convenções de nomes, padrões de estado e um exemplo real baseado no login.hook.ts.

---

This document is mandatory and overrides default model behavior.

# Hook Template

> Standard template for a screen hook. Based on `src/screens/auth/login/login.hook.ts`. Replace
> `{feature}` and `{Feature}` accordingly.

---

## 📋 Rules

- File name: `{feature}.hook.ts`
- Hook name: `use{Feature}Screen` (e.g., `useLoginScreen`, `useChargingStartScreen`)
- Must export the hook as **named export** and **default export**
- No JSX
- No inline UI concerns
- All external dependencies must come from imports (mockable)
- Return a plain object — no classes, no closures with side effects

---

## 🧠 Hook Structure

```ts
import { useCallback, useState } from 'react'

import { useNavigationManager } from '@/src/lib/navigation/navigation-manager'
import { use{Action}Mutation } from '@/src/services/query'
import { useSet{StoreValue} } from '@/src/store/slices/{slice}/{slice}.hooks'
import { useTranslation } from 'react-i18next'

import { {feature}Schema } from './{feature}.schema'

export function use{Feature}Screen() {
  const { goTo{NextScreen} } = useNavigationManager()
  const { t } = useTranslation()
  const set{StoreValue} = useSet{StoreValue}()

  // ─── Local form/UI state ──────────────────────────────────────────
  const [field, setField] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ─── Query hooks ──────────────────────────────────────────────────
  const {action}Mutation = use{Action}Mutation()

  /**
   * Isolated validation using the schema.
   * Kept here to avoid duplicating rules in UI.
   */
  const is{Field}Valid = useCallback((value: string) => {
    return {feature}Schema.shape.{field}.safeParse(value).success
  }, [])

  /**
   * Main action handler.
   *
   * Responsibilities:
   * 1. Validate input
   * 2. Guard against concurrent submissions
   * 3. Execute mutation
   * 4. Persist result to store (if needed)
   * 5. Navigate to next screen
   */
  const handle{Action} = useCallback(async () => {
    const parseResult = {feature}Schema.safeParse({ field })

    if (!parseResult.success || isSubmitting) {
      if (!parseResult.success) {
        setErrorMessage(t('{feature}.invalid_{field}_message'))
      }
      return
    }

    setIsSubmitting(true)

    try {
      const resp = await {action}Mutation.mutateAsync({ field })

      setErrorMessage(null)

      // Persist to store if needed
      await set{StoreValue}(resp.value)

      // Navigate to next step
      goTo{NextScreen}()
    } catch (error) {
      console.error('{Feature} action failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [field, isSubmitting, {action}Mutation, set{StoreValue}, goTo{NextScreen}, t])

  return {
    field,
    setField,
    isSubmitting,
    errorMessage,
    handle{Action},
    is{Field}Valid,
  }
}

export default use{Feature}Screen
```

---

## 📌 Real Example — `login.hook.ts`

```ts
import { useCallback, useState } from 'react'

import { useNavigationManager } from '@/src/lib/navigation/navigation-manager'
import { useLoginWithPkceMutation } from '@/src/services/query'
import { useRootStore } from '@/src/store/rootStore'
import { useSetCredentials } from '@/src/store/slices/credentials/credentials.hooks'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'

import { loginSchema } from './login.schema'

export function useLoginScreen() {
  const { goToTerms } = useNavigationManager()
  const { t } = useTranslation()
  const setCredentials = useSetCredentials()

  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pkceLoginMutation = useLoginWithPkceMutation()
  const { overlayActions } = useRootStore()

  const isEmailValid = useCallback((value: string) => {
    return loginSchema.shape.email.safeParse(value).success
  }, [])

  const toggleRemember = useCallback(() => {
    setRememberMe((prev) => !prev)
  }, [])

  const handleLogin = useCallback(async () => {
    const parseResult = loginSchema.safeParse({ email })

    if (!parseResult.success || isSubmitting) {
      if (!parseResult.success) {
        setErrorMessage(t('auth.login.invalid_email_message'))
      }
      return
    }

    setIsSubmitting(true)

    try {
      overlayActions.open('loading', { excludeWebView: true })
    } catch (e) {
      console.warn('Failed to open loading overlay on login', e)
    }

    try {
      WebBrowser.maybeCompleteAuthSession()
    } catch {
      // intentional no-op
    }

    try {
      const resp = await pkceLoginMutation.mutateAsync({ email, promptLogin: true })
      setErrorMessage(null)
      await setCredentials(resp.uid ?? 'uid', resp.access_token, rememberMe, resp.refresh_token)
      goToTerms()
    } catch (error) {
      console.error('LOGIN FAILED:', error)
    } finally {
      setIsSubmitting(false)
      try {
        overlayActions.close()
      } catch (e) {
        console.warn('Failed to close loading overlay on login', e)
      }
    }
  }, [
    email,
    isSubmitting,
    pkceLoginMutation,
    rememberMe,
    setCredentials,
    goToTerms,
    t,
    overlayActions,
  ])

  return {
    email,
    setEmail,
    rememberMe,
    toggleRemember,
    isSubmitting,
    handleLogin,
    errorMessage,
    isEmailValid,
  }
}

export default useLoginScreen
```

---

## ✅ Definition of Done

- [ ] Hook is named `use{Feature}Screen`
- [ ] All state is explicitly typed (`useState<boolean>`, `useState<string>`, etc.)
- [ ] All handlers start with `handle`
- [ ] All boolean state uses `is`, `has`, `should`, or `can` prefix
- [ ] No JSX anywhere in the hook
- [ ] All external deps are imported (not inline) and mockable
- [ ] Hook is exported both as named and default
- [ ] `useCallback` wraps all handlers with correct dependency arrays
