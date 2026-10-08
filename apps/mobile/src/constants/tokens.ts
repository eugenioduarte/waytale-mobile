import tokens from '@waytale/tailwind-config/tokens.json';

/**
 * Design-system token values (EPIC-02), from the same `tokens.json` the NativeWind theme is built
 * from. Style with classes (`bg-surface`, `p-4`, `text-body`); reach for these only where a prop
 * takes a raw value — navigation options, `tintColor`, animations. EPIC-02.1 turns this into the
 * typed token package with `useTheme()`.
 */
export const { color, space, radius, type, motion } = tokens;
