// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Optimize asset and source extensions
config.resolver.assetExts.push('glb', 'gltf', 'png', 'jpg', 'jpeg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// 2. Exclude non-app files and test files from Metro bundling
config.resolver.blockList = [
  /tests\/.*/,
  /scripts\/.*/,
  /.*\.test\.(ts|tsx|js)$/,
];

// 3. Fast resolution for heavy packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

module.exports = config;
