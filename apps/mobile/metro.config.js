// Monorepo-aware Metro config. Needed so the bundler can resolve packages that
// live in ../../packages/* and share the root pnpm store instead of only
// looking inside apps/mobile/node_modules.
// https://docs.expo.dev/guides/monorepos/
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

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

module.exports = config;
