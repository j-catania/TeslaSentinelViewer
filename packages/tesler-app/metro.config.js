// Metro config for a pnpm workspace monorepo.
// See https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo (so changes to tesler-core are picked up)
config.watchFolders = [workspaceRoot];

// Let Metro resolve packages hoisted to the workspace root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// pnpm links workspace packages (e.g. tesler-core) via symlinks
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
