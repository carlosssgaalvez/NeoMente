/** @type {import('jest').Config} */
module.exports = {
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-modules-core|expo-sqlite|expo-secure-store|expo-constants|expo-file-system|@react-native|react-native|@react-navigation|@react-native-community)/)',
  ],
};
