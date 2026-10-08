import type { StorybookConfig } from '@storybook/react-native';

/**
 * On-device Storybook (01.7). Stories live next to their components, in the app and in the
 * shared design system; the web build (`../.storybook`) reads the same globs.
 */
const main: StorybookConfig = {
  stories: [
    '../src/**/*.stories.?(ts|tsx|js|jsx)',
    '../../../packages/ui/src/**/*.stories.?(ts|tsx|js|jsx)',
  ],
  deviceAddons: ['@storybook/addon-ondevice-controls', '@storybook/addon-ondevice-actions'],
};

export default main;
