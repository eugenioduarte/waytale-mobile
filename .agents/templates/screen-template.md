> **[PT]** Este ficheiro é o template padrão para componentes de ecrã (screen components), definindo a estrutura obrigatória, regras de apresentação pura e um exemplo real baseado no login.screen.tsx.

---

This document is mandatory and overrides default model behavior.

# Screen Template

> Standard template for a screen component. Based on `src/screens/auth/login/login.screen.tsx`.
> Replace `{feature}` and `{Feature}` accordingly.

---

## 📋 Rules

- File name: `{feature}.screen.tsx`
- Component name: `{Feature}Screen` (PascalCase, default export)
- Must use `use{Feature}Screen()` hook — no inline business logic
- Must use `WrapperSafeArea` as root container
- Must use design system `Text` component (never `react-native` Text)
- Must use Tailwind classes for all styling (via Uniwind)
- No `useState`, no `useEffect`, no API calls inside the screen
- Screen is purely declarative

---

## 🖥 Screen Structure

```tsx
import React from 'react'
import { View } from 'react-native'

import Button from '@/src/components/buttons/Button'
import Text from '@/src/components/typography/Text'
import WrapperSafeArea from '@/src/components/wrappers/WrapperSafeArea'
import { useTranslation } from 'react-i18next'

import use{Feature}Screen from './{feature}.hook'

export default function {Feature}Screen() {
  const { t } = useTranslation()

  const {
    field,
    setField,
    isSubmitting,
    handle{Action},
    is{Field}Valid,
  } = use{Feature}Screen()

  return (
    <WrapperSafeArea>
      <View className="flex-1 px-6">

        <Text variant="titleLg" className="text-white">
          {t('{domain}.{feature}.title')}
        </Text>

        <Text variant="bodyMd" className="mt-2 text-white">
          {t('{domain}.{feature}.subtitle')}
        </Text>

        {/* Main content */}

        <View className="mt-8 mb-6">
          <Button
            title={isSubmitting ? t('{domain}.{feature}.loading') : t('{domain}.{feature}.submit')}
            onPress={handle{Action}}
            disabled={!is{Field}Valid(field) || isSubmitting}
          />
        </View>

      </View>
    </WrapperSafeArea>
  )
}
```

---

## 📌 Real Example — `login.screen.tsx`

```tsx
import React from 'react'
import { Dimensions, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import Button from '@/src/components/buttons/Button'
import LanguageButton from '@/src/components/buttons/LanguageButton'
import CheckBox from '@/src/components/checkbox/CheckBox'
import TextInput from '@/src/components/textInput/TextInput'
import TopWave from '@/src/components/topWave/TopWave'
import Text from '@/src/components/typography/Text'
import WrapperSafeArea from '@/src/components/wrappers/WrapperSafeArea'
import { LogoIcons } from '@ui/assets/icons'
import { LoginBoxCheckedIcon, LoginBoxUncheckedIcon } from '@ui/assets/icons/check-box'
import { ContinenteLogo } from '@ui/assets/icons/common'
import { useTranslation } from 'react-i18next'
import { withUniwind } from 'uniwind'

import useLoginScreen from './login.hook'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const BASE_WIDTH = 375
const IMAGE_SIZE = 160
const scale = SCREEN_WIDTH / BASE_WIDTH
const size = IMAGE_SIZE * scale

const KeyboardAwareScrollViewImp = withUniwind(KeyboardAwareScrollView)

export default function LoginScreen() {
  const { t } = useTranslation()

  const { email, setEmail, rememberMe, toggleRemember, isSubmitting, handleLogin, isEmailValid } =
    useLoginScreen()

  return (
    <WrapperSafeArea classNameSafeArea="bg-black" classNameSubWrapper="p-0">
      <View className="h-50 w-full items-center justify-start bg-black">
        <View className="w-full flex-row items-center justify-between px-6">
          <View className="w-8" />
          <ContinenteLogo width={160} height={40} className="text-white" />
          <LanguageButton />
        </View>
        <View className="absolute -bottom-10 z-10">
          <LogoIcons.LoginImage width={size} height={size} />
        </View>
      </View>

      <TopWave height={60} />

      <KeyboardAwareScrollViewImp
        className="bg-primary-hover w-full flex-1 px-6"
        contentContainerClassName="flex-grow justify-between"
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <View className="w-full gap-2">
          <Text variant="titleLg" className="text-white">
            {t('auth.login.title')}
          </Text>

          <Text variant="bodyMd" className="mt-2 text-white">
            {t('auth.login.subtitle')}
          </Text>

          <TextInput
            placeholder={t('auth.login.email_placeholder')}
            keyboardType="email-address"
            label={t('auth.login.email_label')}
            containerClassName="mt-4"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            backgroundColor="transparent"
            focusBackgroundColor="#08361E"
            placeholderColor="#FFFFFF"
            inputClassName="text-white"
            required
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <View className="mt-4 flex-row items-center">
            <CheckBox
              checked={rememberMe}
              size={16}
              onPress={toggleRemember}
              checkedIcon={LoginBoxCheckedIcon}
              uncheckedIcon={LoginBoxUncheckedIcon}
            />
            <Text variant="bodySm" className="ml-4 text-white">
              {t('auth.login.remember_me')}
            </Text>
          </View>
        </View>

        <View className="mt-8 mb-6">
          <Button
            title={isSubmitting ? t('auth.login.loading') : t('auth.login.submit')}
            onPress={handleLogin}
            disabled={!isEmailValid(email) || isSubmitting}
          />
        </View>
      </KeyboardAwareScrollViewImp>
    </WrapperSafeArea>
  )
}
```

---

## 🧪 Screen Test Template

```tsx
// __tests__/{feature}.screen.test.tsx
import React from 'react'
import renderer, { act } from 'react-test-renderer'

import {Feature}Screen from '../{feature}.screen'

// --------------------
// Mocks
// --------------------

const mockHook = {
  field: '',
  setField: jest.fn(),
  isSubmitting: false,
  errorMessage: null,
  handle{Action}: jest.fn(),
  is{Field}Valid: jest.fn().mockReturnValue(true),
}

jest.mock('../{feature}.hook', () => ({
  __esModule: true,
  default: () => mockHook,
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

// --------------------
// Tests
// --------------------

describe('{Feature}Screen', () => {
  it('renders without crashing', () => {
    let tree: ReturnType<typeof renderer.create> | undefined

    act(() => {
      tree = renderer.create(<{Feature}Screen />)
    })

    expect(tree?.toJSON()).toBeTruthy()
  })
})
```

---

## ✅ Definition of Done

- [ ] Screen is named `{Feature}Screen` and exported as default
- [ ] Only the hook is called — no direct `useState`, `useQuery`, etc.
- [ ] `WrapperSafeArea` wraps the root
- [ ] All text uses `<Text variant="...">` (not React Native Text)
- [ ] All styling uses Tailwind classes (no inline styles except dynamic runtime values)
- [ ] i18n keys are used for all visible text
- [ ] Button disabled state is driven by hook return values
