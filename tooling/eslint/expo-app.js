const expoConfig = require("eslint-config-expo/flat");

const base = require("./base");

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

/** Extends the Expo flat config with the monorepo's shared rules. Use from `apps/mobile/eslint.config.js`. */
module.exports = [...expoConfig, ...base, zustandSelectorConfig];
