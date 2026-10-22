// The Expo entry point resolves Expo's Babel transformer even when npm installs
// @expo/metro-config inside expo/node_modules rather than at the app root.
// It handles both SVG assets and ordinary JavaScript/TypeScript modules.
module.exports = require('react-native-svg-transformer/expo');
