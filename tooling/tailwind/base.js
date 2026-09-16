/**
 * Shared NativeWind/Tailwind config. Only `navy`/`off-white`/`card-border` have a
 * confirmed hex in `description.md`; `accent` (the single orange accent) has no
 * confirmed hex yet — EPIC-02 (design system) must set the real value before this
 * token is used in any screen.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: "#14203d",
        // TODO(EPIC-02): replace with the confirmed accent orange, no value exists yet.
        accent: "#000000",
        "off-white": "#faf8f3",
        "card-border": "#eee9df",
      },
    },
  },
};
