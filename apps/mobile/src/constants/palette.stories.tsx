import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from './palette';

/** The colour tokens in use until EPIC-02 brings the full design system. */
function PaletteSwatches() {
  return (
    <View style={styles.grid}>
      {Object.entries(Palette).map(([name, value]) => (
        <View key={name} style={styles.swatch}>
          <View style={[styles.chip, { backgroundColor: value }]} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const meta = {
  title: 'Tokens/Palette',
  component: PaletteSwatches,
} satisfies Meta<typeof PaletteSwatches>;

export default meta;

export const Colours: StoryObj<typeof meta> = {};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  swatch: { width: 140, gap: 6 },
  chip: { height: 64, borderRadius: 12, borderWidth: 1, borderColor: Palette.border },
  name: { fontSize: 14, fontWeight: '600', color: Palette.text },
  value: { fontSize: 12, color: Palette.secondary },
});
