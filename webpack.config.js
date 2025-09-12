const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Explicitly set mode to suppress warning
  config.mode = 'development';

  // Fix vector icons resolution for React Native Paper
  config.resolve.alias = {
    ...config.resolve.alias,
    '@react-native-vector-icons/material-design-icons':
      '@expo/vector-icons/MaterialCommunityIcons',
    'react-native-vector-icons/MaterialCommunityIcons':
      '@expo/vector-icons/MaterialCommunityIcons',
    'react-native-vector-icons/MaterialIcons':
      '@expo/vector-icons/MaterialIcons',
    'react-native-vector-icons/Ionicons': '@expo/vector-icons/Ionicons',
    'react-native-vector-icons/FontAwesome': '@expo/vector-icons/FontAwesome',

    // Bypass problematic React Native files with Flow types
    'react-native': 'react-native-web',
    '@react-native/assets-registry/registry': false,
  };

  // Fix Node.js polyfills for web including Buffer
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util'),
    crypto: false,
    fs: false,
    path: false,
    os: false,
    process: require.resolve('process/browser'),
  };

  // Provide global polyfills including Buffer
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    })
  );

  return config;
};
