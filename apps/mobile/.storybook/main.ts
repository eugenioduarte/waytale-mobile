import path from 'node:path';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import { mergeConfig } from 'vite';

/**
 * Web build of the same stories as the on-device Storybook (`../.rnstorybook`), through
 * react-native-web. `pnpm storybook:web` runs it locally; CI publishes a preview per PR
 * (.github/workflows/storybook-preview.yml).
 */
const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/ui/src/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  core: { disableTelemetry: true },
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {},
  },
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      // Same aliases as tsconfig.json / Metro.
      resolve: {
        alias: {
          '@/assets': path.resolve(import.meta.dirname, '../assets'),
          '@': path.resolve(import.meta.dirname, '../src'),
          '@waytale/ui': path.resolve(import.meta.dirname, '../../../packages/ui/src/index.ts'),
        },
      },
    }),
};

export default config;
