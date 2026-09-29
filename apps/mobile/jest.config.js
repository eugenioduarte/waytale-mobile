const path = require('node:path');

const base = require('@waytale/jest-config');

module.exports = {
  ...base,
  // `pnpm test:cov` fails below this (EPIC-01.8 gate, run in CI). Aggregated over the folder.
  coverageThreshold: {
    './src/features/': { statements: 60, branches: 60, functions: 60, lines: 60 },
  },
  moduleNameMapper: {
    ...base.moduleNameMapper,
    // Test helpers (render, factories, Mockoon) — tests only, so not in Metro/Babel.
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    // jest-expo resolves axios's browser build, whose adapter is the environment's `fetch`
    // polyfill. Tests talk to the real Mockoon over the network (EPIC-01.11), so use its Node
    // build (the `http` adapter); in the app, React Native's XHR carries the same requests.
    '^axios$': path.join(
      path.dirname(require.resolve('axios/package.json')),
      'dist/node/axios.cjs',
    ),
  },
  // ESM-only code is transformed too:
  // - Storybook 10 — stories run as portable stories (src/storybook/__tests__/stories.test.tsx);
  // - `standard-navigation` (expo-router) — for `renderApp`, which renders the real routes.
  transformIgnorePatterns: [
    base.transformIgnorePatterns[0].replace(
      '(?!(',
      '(?!(storybook|@storybook/.*|standard-navigation|',
    ),
  ],
};
