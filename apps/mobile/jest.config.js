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
    // Test helpers (render, factories, MSW) — tests only, so not in Metro/Babel.
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    // `msw/node` maps the `react-native` export condition (which jest-expo resolves with) to
    // null; tests run in Node, so point at its Node build.
    '^msw/node$': path.join(path.dirname(require.resolve('msw/package.json')), 'lib/node/index.js'),
  },
  // ESM-only code is transformed too:
  // - Storybook 10 — stories run as portable stories (src/storybook/__tests__/stories.test.tsx);
  // - `standard-navigation` (expo-router) — for `renderApp`, which renders the real routes;
  // - MSW's dependencies — `until-async` is `"type": "module"`, others ship only `.mjs`, which the
  //   preset's transform doesn't match (this extra entry is merged with the preset's).
  transform: { '\\.mjs$': ['babel-jest', { presets: ['babel-preset-expo'] }] },
  transformIgnorePatterns: [
    `${base.transformIgnorePatterns[0].replace('(?!(', '(?!(storybook|@storybook/.*|standard-navigation|until-async|')}(?!.*\\.mjs$)`,
  ],
};
