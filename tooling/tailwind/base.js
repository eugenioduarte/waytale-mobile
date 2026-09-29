const tokens = require("./tokens.json");

/**
 * Shared NativeWind/Tailwind preset, built from the design-system tokens in `tokens.json`
 * (values from EPIC-02, `Waytale Design System`). `tokens.json` is the single source: this preset
 * turns it into classes, and app code imports it for the few props that take a raw value
 * (navigation options, `tintColor`, …). EPIC-02.1 wraps it in typed tokens + `useTheme()`.
 *
 * Colours, spacing, radii and font sizes REPLACE Tailwind's defaults: only token values exist as
 * classes (`bg-surface`, `p-4`, `rounded-md`, `text-body`), so an off-system value (`bg-red-500`,
 * `p-13`) is not a class at all. Arbitrary values (`p-[13px]`) still compile — the EPIC-02.1 lint
 * rule is what forbids literals in features.
 */

const px = (value) => `${value}px`;

/** `inkMuted` → `ink-muted`, so classes read `text-ink-muted`. */
const kebab = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * `{ size: 26, lh: 1.25, ls: -0.015, weight: '600' }` → Tailwind's `[fontSize, { lineHeight,
 * letterSpacing, fontWeight }]`. React Native wants absolute line heights and letter spacing, so
 * the design's multipliers (`lh` × size, `ls` in em) are resolved to px here.
 */
function fontSize({ size, weight, lh, ls }) {
  const options = { fontWeight: weight };
  if (lh !== undefined)
    options.lineHeight = px(Math.round(size * lh * 100) / 100);
  if (ls !== undefined)
    options.letterSpacing = px(Math.round(size * ls * 100) / 100);
  return [px(size), options];
}

const colors = Object.fromEntries(
  Object.entries(tokens.color).map(([name, value]) => [kebab(name), value]),
);

const spacing = Object.fromEntries(
  Object.entries(tokens.space).map(([step, value]) => [step, px(value)]),
);

const { easing, ...durations } = tokens.motion;

module.exports = {
  theme: {
    colors: { transparent: "transparent", current: "currentColor", ...colors },
    spacing: { 0: "0px", px: "1px", ...spacing },
    borderRadius: {
      none: "0px",
      ...Object.fromEntries(
        Object.entries(tokens.radius).map(([name, value]) => [name, px(value)]),
      ),
      // Circles (avatars, dots): larger than any element, like `pill`.
      full: "9999px",
    },
    fontSize: Object.fromEntries(
      Object.entries(tokens.type).map(([name, style]) => [
        name,
        fontSize(style),
      ]),
    ),
    extend: {
      transitionDuration: Object.fromEntries(
        Object.entries(durations).map(([name, ms]) => [name, `${ms}ms`]),
      ),
      transitionTimingFunction: { DEFAULT: easing },
    },
  },
};
