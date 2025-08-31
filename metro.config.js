/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
