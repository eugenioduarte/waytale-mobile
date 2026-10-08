import { describe, expect, it } from '@jest/globals';
import { render, screen } from 'nativewind/test';
import { Text, View } from 'react-native';

import { color } from '@/constants/tokens';

// The design-system preset (as in tailwind.config.js), compiled for real by NativeWind's test
// renderer — what Metro does at build time. The renderer adds `nativewind/preset` itself and
// overrides `presets`, so ours goes in as the config: it only carries a `theme`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('@waytale/tailwind-config');

describe('NativeWind with the design-system tokens (01.10 acceptance)', () => {
  it('styles a screen with classes only: colour, spacing, radius and type from the tokens', async () => {
    await render(
      <View testID="screen" className="flex-1 gap-4 rounded-md bg-surface p-6">
        <Text testID="title" className="text-display text-ink">
          Title
        </Text>
        <Text testID="body" className="text-body text-ink-muted">
          Body
        </Text>
      </View>,
      { config },
    );

    expect(screen.getByTestId('screen').props.style).toMatchObject({
      flexGrow: 1,
      rowGap: 16,
      columnGap: 16,
      borderRadius: 14,
      backgroundColor: color.surface,
      padding: 24,
    });
    expect(screen.getByTestId('title').props.style).toMatchObject({
      color: color.ink,
      fontSize: 26,
      fontWeight: '600',
      lineHeight: 32.5,
    });
    // Fractional px come back as 32-bit floats: -0.015em × 26px.
    expect(screen.getByTestId('title').props.style.letterSpacing).toBeCloseTo(-0.39);
    expect(screen.getByTestId('body').props.style).toMatchObject({
      color: color.inkMuted,
      fontSize: 14.5,
    });
    // 1.65 × 14.5px.
    expect(screen.getByTestId('body').props.style.lineHeight).toBeCloseTo(23.92);
  });

  it('borders take the card border colour from the tokens', async () => {
    await render(<View testID="card" className="border border-border" />, { config });

    expect(screen.getByTestId('card').props.style).toMatchObject({
      borderWidth: 1,
      borderColor: color.border,
    });
  });

  it("Tailwind's default palette and scales don't exist: only tokens are classes", async () => {
    await render(<View testID="off-system" className="bg-red-500 p-11 text-xl" />, { config });

    expect(screen.getByTestId('off-system').props.style).toBeUndefined();
  });
});
