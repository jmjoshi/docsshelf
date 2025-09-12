// Polyfill for @react-native-vector-icons/material-design-icons
try {
  const MaterialCommunityIcons = require('@expo/vector-icons/MaterialCommunityIcons');
  module.exports = MaterialCommunityIcons;
  module.exports.default =
    MaterialCommunityIcons.default || MaterialCommunityIcons;
} catch {
  // Fallback to a basic icon component
  module.exports = function FallbackIcon() {
    return null;
  };
  module.exports.default = module.exports;
}
