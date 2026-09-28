import { readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it, jest } from '@jest/globals';
import { composeStories, setProjectAnnotations } from '@storybook/react';
import { render } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import * as syncStatusStories from '@/components/sync-status.stories';
import copy from '@/locales/pt.json';

import preview from '../../../.rnstorybook/preview';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// composeStories loads `storybook/test`, whose user-event registers an `afterEach` that resets a
// clipboard stub on `window.navigator`. React Native's Jest environment aliases `window` to the
// global object, which only has `navigator` from Node 21 on; older Node gets an empty one.
(globalThis as { navigator?: object }).navigator ??= {};

// Global decorators (tokens, safe area, store mocks) exactly as Storybook applies them.
setProjectAnnotations(preview);

type StoriesModule = Parameters<typeof composeStories>[0];

/** A stories module as renderable components, one per exported story. */
function storiesOf(module: unknown): Record<string, ComponentType> {
  return composeStories(module as StoriesModule) as unknown as Record<string, ComponentType>;
}

/** Same globs as `.rnstorybook/main.ts` and `.storybook/main.ts`. */
const STORY_ROOTS = [
  path.resolve(__dirname, '../..'),
  path.resolve(__dirname, '../../../../../packages/ui/src'),
];

function findStoryFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : findStoryFiles(full);
    return /\.stories\.(ts|tsx|js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const storyFiles = STORY_ROOTS.flatMap(findStoryFiles);

it('finds the stories', () => {
  expect(storyFiles.length).toBeGreaterThan(0);
});

describe('store mocks (parameters.stores)', () => {
  it('each SyncStatusLine story shows its own state, with no leak between stories', () => {
    const stories = storiesOf(syncStatusStories);
    for (const [story, message] of [
      ['Offline', copy.sync.offline],
      ['Pending', copy.sync.pending],
      ['Synced', copy.sync.synced],
      ['Failed', copy.sync.error],
    ] as const) {
      const Story = stories[story]!;
      const { getByText, unmount } = render(<Story />);
      expect(getByText(message)).toBeTruthy();
      unmount();
    }
  });
});

// Every story renders with the global decorators — a broken story fails CI here, before its
// preview is published.
describe.each(storyFiles.map((file) => [path.relative(process.cwd(), file), file]))(
  '%s',
  (_name, file) => {
    // Found at runtime, so a new story is covered without touching this test.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const stories = storiesOf(require(file));
    it.each(Object.entries(stories))('%s renders', (_story, Story) => {
      const { toJSON } = render(<Story />);
      expect(toJSON()).not.toBeNull();
    });
  },
);
