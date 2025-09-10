const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add polyfills for web platform
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Ensure polyfills are loaded first for web
if (config.serializer) {
  const originalGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule;
  config.serializer.getModulesRunBeforeMainModule = (entryFilePath) => {
    const modules = originalGetModulesRunBeforeMainModule ? originalGetModulesRunBeforeMainModule(entryFilePath) : [];
    return [
      require.resolve(path.resolve(__dirname, 'polyfills.js')),
      ...modules
    ];
  };
} else {
  config.serializer = {
    getModulesRunBeforeMainModule: (entryFilePath) => {
      return [require.resolve(path.resolve(__dirname, 'polyfills.js'))];
    }
  };
}

// Add Flipper support for debugging in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const { withFlipper } = require('react-native-flipper');
    module.exports = withFlipper(config, {
      ios: {
        scheme: 'DocsShelf',
      },
      android: {
        scheme: 'DocsShelf',
      },
    });
  } catch {
    // Flipper not available, use default config
    module.exports = config;
  }
} else {
  module.exports = config;
}
