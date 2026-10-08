import type { Meta, StoryObj } from '@storybook/react-native';

import type { StoreMocks } from '@/storybook/decorators';

import { LanguagePicker } from './language-picker';

const meta = {
  title: 'Preferences/LanguagePicker',
  component: LanguagePicker,
} satisfies Meta<typeof LanguagePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

// The choice comes from the preferences store (see `withStoreMocks` in src/storybook/decorators.tsx);
// the copy follows it, as in the app.
const withLanguage = (language: NonNullable<StoreMocks['preferences']>['language']) => ({
  stores: { preferences: { language } } satisfies StoreMocks,
});

export const DeviceLanguage: Story = { parameters: withLanguage('system') };
export const Portuguese: Story = { parameters: withLanguage('pt') };
export const English: Story = { parameters: withLanguage('en') };
export const Spanish: Story = { parameters: withLanguage('es') };
