/**
 * NativeWind (EPIC-01.10). The theme — colours, spacing, radii, type — is the design-system preset
 * in `@waytale/tailwind-config`, generated from its `tokens.json`; don't extend it here, change
 * the tokens.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset'), require('@waytale/tailwind-config')],
};
