// Learn more https://docs.expo.io/guides/customizing-metro
const {
  withStorybook,
} = require('@storybook/react-native/withStorybook');

const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname, {
  includeWebReplay: false,
  enableSourceContextInDevelopment: false,
});

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro/svgTransformer.js'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

module.exports = withStorybook(config, {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
  liteMode: true,
});
