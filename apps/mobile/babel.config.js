/**
 * Expo's preset plus NativeWind (EPIC-01.10): `className` on React Native components compiles to
 * styles. Also used by Jest (jest-expo) and the web Storybook.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
