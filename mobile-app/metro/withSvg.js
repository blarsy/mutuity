const { getDefaultConfig } = require('expo/metro-config');

module.exports = function withSvg(config) {
  const defaultConfig = getDefaultConfig(__dirname);
  const sourceExts = Array.from(new Set([...(config?.resolver?.sourceExts || defaultConfig.resolver.sourceExts), 'svg']));

  return {
    ...config,
    resolver: {
      ...config.resolver,
      sourceExts,
      assetExts: (config?.resolver?.assetExts || defaultConfig.resolver.assetExts).filter((ext) => ext !== 'svg'),
    },
  };
};
