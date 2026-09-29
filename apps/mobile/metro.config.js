// Monorepo-aware Metro config. Needed so the bundler can resolve packages that
// live in ../../packages/* and share the root pnpm store instead of only
// looking inside apps/mobile/node_modules.
// https://docs.expo.dev/guides/monorepos/
const path = require('path');

const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
// expo-sqlite's web backend (wa-sqlite) ships a .wasm binary — Metro must treat it as an asset.
config.resolver.assetExts.push('wasm');

// On-device Storybook (01.7): generates .rnstorybook/storybook.requires.ts when enabled, and
// replaces Storybook with empty modules otherwise, so it never ships in a normal build.
const withStories = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
  configPath: path.resolve(projectRoot, '.rnstorybook'),
});

// NativeWind (01.10): compiles src/global.css with tailwind.config.js into the styles behind
// `className`. Outermost, so it sees the final resolver.
module.exports = withNativeWind(withStories, {
  input: path.resolve(projectRoot, 'src/global.css'),
  configPath: path.resolve(projectRoot, 'tailwind.config.js'),
});
