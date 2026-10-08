import path from 'node:path';

import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tailwindcss from 'tailwindcss';
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
    // NativeWind (01.10): `className` goes through its JSX runtime, as in babel.config.js.
    options: { pluginReactOptions: { jsxImportSource: 'nativewind' } },
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
      // Metro compiles src/global.css through NativeWind; on the web it is plain Tailwind CSS.
      // Inline here rather than a postcss.config.js, which Expo's web bundler would also pick up.
      css: {
        postcss: {
          plugins: [
            tailwindcss({ config: path.resolve(import.meta.dirname, '../tailwind.config.js') }),
          ],
        },
      },
    }),
};

export default config;
