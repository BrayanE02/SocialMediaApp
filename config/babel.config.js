module.exports = function (api) {
  api.cache(true); // Caches the configuration for faster builds
  return {
    presets: ["babel-preset-expo"], // Expo-specific rules
    plugins: [
      "react-native-reanimated/plugin", // Animation optimizations
    ],
  };
};
