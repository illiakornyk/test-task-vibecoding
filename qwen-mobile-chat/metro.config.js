const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add custom asset extensions for local heavy models
config.resolver.assetExts.push('gguf', 'bin');

module.exports = config;
