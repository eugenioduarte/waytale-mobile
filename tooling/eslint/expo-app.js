const expoConfig = require("eslint-config-expo/flat");

const base = require("./base");
const waytale = require("./plugin");

/**
 * Zustand stores (`src/stores/*.store.ts`) are consumed through granular selector hooks. Calling a
 * store hook with no selector subscribes to the whole store and re-renders on every change.
 */
const zustandSelector = {
  selector: "CallExpression[callee.name=/^use\\w+Store$/][arguments.length=0]",
  message:
    "Don't consume a whole Zustand store; use a selector hook (e.g. useIsAuthenticated()) or pass a selector.",
};

/**
 * Dates go through `src/lib/date.ts` (EPIC-01.11): one clock, one wire format, one place that
 * formats per language.
 */
const DATE_MESSAGE =
  "Use src/lib/date.ts (nowIso, parseIso, formatDate, …) instead of Date/Intl directly.";
const dateSelectors = [
  { selector: "NewExpression[callee.name='Date']", message: DATE_MESSAGE },
  { selector: "MemberExpression[object.name='Date']", message: DATE_MESSAGE },
  { selector: "MemberExpression[object.name='Intl']", message: DATE_MESSAGE },
  {
    selector:
      "CallExpression[callee.property.name=/^toLocale(Date|Time)?String$/]",
    message: DATE_MESSAGE,
  },
];

// `no-restricted-syntax` is one rule: a later config replaces its whole list, so the Zustand
// selector is repeated where the date ban is lifted.
const restrictedSyntaxConfig = {
  files: ["**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-restricted-syntax": ["error", zustandSelector, ...dateSelectors],
  },
};

/**
 * Network goes through `src/lib/http.ts` (Axios) or supabase-js (EPIC-01.11) — never `fetch` or
 * a second Axios instance in features.
 */
const networkConfig = {
  files: ["src/**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-restricted-globals": [
      "error",
      { name: "fetch", message: "Use getHttp() from src/lib/http.ts." },
      {
        name: "XMLHttpRequest",
        message: "Use getHttp() from src/lib/http.ts.",
      },
    ],
    "no-restricted-imports": [
      "error",
      { name: "axios", message: "Use getHttp() from src/lib/http.ts." },
    ],
  },
};

/** Where the bans don't apply: the modules that own them, tests and tooling scripts. */
const dateOwnerConfig = {
  files: [
    "src/lib/date.ts",
    "**/__tests__/**",
    "**/*.test.{js,jsx,ts,tsx}",
    "tests/**",
    "scripts/**",
    "*.config.{js,ts}",
  ],
  rules: { "no-restricted-syntax": ["error", zustandSelector] },
};
const networkOwnerConfig = {
  files: ["src/lib/http.ts", "**/__tests__/**", "**/*.test.{js,jsx,ts,tsx}"],
  rules: { "no-restricted-globals": "off", "no-restricted-imports": "off" },
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

/**
 * User-facing copy comes from i18n (EPIC-01.9), see `src/i18n/`. Tests and stories pass fixture
 * copy as props, so they are out of scope.
 */
const i18nConfig = {
  files: ["**/*.{jsx,tsx}"],
  ignores: [
    "**/__tests__/**",
    "**/*.test.{jsx,tsx}",
    "**/*.stories.{jsx,tsx}",
    "src/storybook/**",
    ".rnstorybook/**",
  ],
  plugins: { waytale },
  rules: {
    "waytale/no-literal-ui-string": "error",
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
  restrictedSyntaxConfig,
  dateOwnerConfig,
  networkConfig,
  networkOwnerConfig,
  testIdConfig,
  i18nConfig,
];
