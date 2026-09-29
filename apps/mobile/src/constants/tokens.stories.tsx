import type { Meta, StoryObj } from '@storybook/react-native';
import { Text, View } from 'react-native';

import { color, type } from './tokens';

/**
 * Class per type-scale step. Written out in full: Tailwind only generates classes it finds as
 * literal strings, so `text-${name}` would not exist.
 */
const TYPE_CLASSES: Record<keyof typeof type, string> = {
  display: 'text-display',
  title: 'text-title',
  section: 'text-section',
  body: 'text-body',
  label: 'text-label',
  caption: 'text-caption',
  mono: 'text-mono',
};

/** The design-system colours (EPIC-02), as the NativeWind theme exposes them. */
function Colours() {
  return (
    <View className="flex-row flex-wrap gap-4">
      {Object.entries(color).map(([name, value]) => (
        <View key={name} className="w-32 gap-1">
          {/* Swatch colour is the data shown, so it comes from the token value itself. */}
          <View
            className="h-9 rounded-md border border-border"
            style={{ backgroundColor: value }}
          />
          <Text className="text-label text-ink">{name}</Text>
          <Text className="text-caption text-ink-muted">{value}</Text>
        </View>
      ))}
    </View>
  );
}

/** The type scale: one line per `text-<step>` class. */
function Type() {
  return (
    <View className="gap-4">
      {Object.entries(TYPE_CLASSES).map(([name, className]) => (
        <Text key={name} className={`text-ink ${className}`}>
          {className}
        </Text>
      ))}
    </View>
  );
}

const meta = {
  title: 'Tokens',
  component: Colours,
} satisfies Meta<typeof Colours>;

export default meta;

export const Colors: StoryObj<typeof meta> = {};
export const Typography: StoryObj<typeof meta> = { render: () => <Type /> };
