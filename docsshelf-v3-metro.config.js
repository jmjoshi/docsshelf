const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// This is needed to resolve the wasm file for expo-sqlite on web
config.resolver.assetExts.push('wasm');

module.exports = config;
