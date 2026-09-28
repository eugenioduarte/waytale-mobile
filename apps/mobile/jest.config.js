const base = require('@waytale/jest-config');

module.exports = {
  ...base,
  // Storybook 10 ships ESM only; transform it too, so stories run as portable stories in Jest
  // (src/storybook/__tests__/stories.test.tsx).
  transformIgnorePatterns: [
    base.transformIgnorePatterns[0].replace('(?!(', '(?!(storybook|@storybook/.*|'),
  ],
};
