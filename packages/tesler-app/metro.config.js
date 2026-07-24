// Metro config for a pnpm workspace monorepo.
// See https://docs.expo.dev/guides/monorepos/
//
// SDK 57's getDefaultConfig() already auto-detects the pnpm workspace and
// sets watchFolders (workspace root node_modules + every sibling package,
// e.g. tesler-core) and resolver.nodeModulesPaths accordingly, and modern
// Metro follows pnpm's symlinks without needing `unstable_enableSymlinks`.
// Don't override these - doing so previously clobbered the auto-detected
// watchFolders and tripped expo-doctor's Metro config check.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
