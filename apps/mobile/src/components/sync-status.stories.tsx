import type { Meta, StoryObj } from '@storybook/react-native';

import type { StoreMocks } from '@/storybook/decorators';

import { SyncStatusLine } from './sync-status';

const meta = {
  title: 'App/SyncStatusLine',
  component: SyncStatusLine,
} satisfies Meta<typeof SyncStatusLine>;

export default meta;

type Story = StoryObj<typeof meta>;

// Each state comes from the sync store (see `withStoreMocks` in src/storybook/decorators.tsx).
const withSync = (sync: StoreMocks['sync']) => ({ stores: { sync } satisfies StoreMocks });

export const Synced: Story = { parameters: withSync({}) };
export const Syncing: Story = { parameters: withSync({ isSyncing: true }) };
export const Pending: Story = { parameters: withSync({ pendingCount: 3 }) };
export const Offline: Story = { parameters: withSync({ isOnline: false, pendingCount: 2 }) };
export const Failed: Story = {
  parameters: withSync({ failedCount: 1, lastError: '23503: violates foreign key constraint' }),
};
