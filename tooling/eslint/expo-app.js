const expoConfig = require("eslint-config-expo/flat");

const base = require("./base");
const waytale = require("./plugin");

/**
 * Zustand stores (`src/stores/*.store.ts`) are consumed through granular selector hooks. Calling a
 * store hook with no selector subscribes to the whole store and re-renders on every change.
 */
const zustandSelectorConfig = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "CallExpression[callee.name=/^use\\w+Store$/][arguments.length=0]",
        message:
          "Don't consume a whole Zustand store; use a selector hook (e.g. useIsAuthenticated()) or pass a selector.",
      },
    ],
  },
};

/**
 * Interactive elements need a `testID` (EPIC-01.8): Maestro and Testing Library select by it.
 * `Action` (`src/components/screen.tsx`) is the app's button; list new wrappers here too.
 */
const testIdConfig = {
  files: ["**/*.{jsx,tsx}"],
  ignores: ["**/__tests__/**", "**/*.test.{jsx,tsx}"],
  plugins: { waytale },
  rules: {
    "waytale/require-testid": ["error", { components: ["Action"] }],
  },
};

/** Generated output: the Storybook web build, the on-device stories index (01.7) and coverage (01.8). */
const generatedIgnores = {
  ignores: [
    "storybook-static/**",
    ".rnstorybook/storybook.requires.ts",
    "coverage/**",
  ],
};

/** Extends the Expo flat config with the monorepo's shared rules. Use from `apps/mobile/eslint.config.js`. */
module.exports = [
  generatedIgnores,
  ...expoConfig,
  ...base,
  zustandSelectorConfig,
  testIdConfig,
];
