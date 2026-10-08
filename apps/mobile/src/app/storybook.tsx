import { Redirect } from 'expo-router';

import StorybookUIRoot from '../../.rnstorybook';

/**
 * On-device Storybook at `/storybook` (open `waytale://storybook`, or press it from the dev
 * menu's deep link). Only exists when the app runs with `EXPO_PUBLIC_STORYBOOK_ENABLED=true`
 * (`pnpm storybook`): otherwise Metro swaps `.rnstorybook` for an empty module and this route
 * sends the visitor home.
 */
export default function StorybookScreen() {
  if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== 'true' || !StorybookUIRoot) {
    return <Redirect href="/" />;
  }
  return <StorybookUIRoot />;
}
