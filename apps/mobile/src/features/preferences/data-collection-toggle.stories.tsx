import type { Meta, StoryObj } from '@storybook/react-native';

import type { StoreMocks } from '@/storybook/decorators';

import { DataCollectionToggle } from './data-collection-toggle';

const meta = {
  title: 'Preferences/DataCollectionToggle',
  component: DataCollectionToggle,
} satisfies Meta<typeof DataCollectionToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

const withConsent = (dataCollection: boolean) => ({
  stores: { preferences: { dataCollection } } satisfies StoreMocks,
});

export const Off: Story = { parameters: withConsent(false) };
export const On: Story = { parameters: withConsent(true) };
