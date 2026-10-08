// Tailwind classes for NativeWind `className` (01.10), as the app's root layout does.
import '../src/global.css';

import type { Preview } from '@storybook/react-native-web-vite';

import { decorators } from '../src/storybook/decorators';

const preview: Preview = {
  decorators,
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
