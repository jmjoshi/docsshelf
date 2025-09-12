#!/usr/bin/env node

// Post-install script to fix React Native Paper vector icons for web
const fs = require('fs');
const path = require('path');

const vectorIconsDir = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-vector-icons'
);
const materialIconsDir = path.join(vectorIconsDir, 'material-design-icons');

// Create directories if they don't exist
if (!fs.existsSync(vectorIconsDir)) {
  fs.mkdirSync(vectorIconsDir, { recursive: true });
}

if (!fs.existsSync(materialIconsDir)) {
  fs.mkdirSync(materialIconsDir, { recursive: true });
}

// Create the redirect module
const redirectCode = `// Web compatibility redirect to Expo vector icons
const MaterialCommunityIcons = require('@expo/vector-icons/MaterialCommunityIcons');
module.exports = MaterialCommunityIcons;
module.exports.default = MaterialCommunityIcons.default || MaterialCommunityIcons;
`;

const packageJson = {
  name: '@react-native-vector-icons/material-design-icons',
  version: '1.0.0',
  main: 'index.js',
  description: 'Web compatibility redirect to Expo vector icons',
};

// Write the files
fs.writeFileSync(path.join(materialIconsDir, 'index.js'), redirectCode);
fs.writeFileSync(
  path.join(materialIconsDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('✅ Fixed React Native Paper vector icons for web compatibility');
