describe("Sentry Metro composition", () => {
  const originalStorybook = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED;

  afterEach(() => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = originalStorybook;
    jest.resetModules();
  });

  it.each(["true", "false"])("preserves the SVG transformer and Storybook wrapper (enabled=%s)", enabled => {
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = enabled;
    const getSentryExpoConfig = jest.fn(() => ({
      transformer: { sentryTransform: true },
      serializer: { customSerializer: "sentry-debug-id-serializer" },
      resolver: { assetExts: ["png", "svg"], sourceExts: ["ts", "tsx"] }
    }));
    const withStorybook = jest.fn((config, options) => ({ ...config, storybook: options }));
    jest.isolateModules(() => {
      jest.doMock("@sentry/react-native/metro", () => ({ getSentryExpoConfig }));
      jest.doMock("@storybook/react-native/withStorybook", () => ({ withStorybook }));
      const config = require("../metro.config.js");
      expect(getSentryExpoConfig).toHaveBeenCalledWith(expect.any(String), {
        includeWebReplay: false, enableSourceContextInDevelopment: false
      });
      expect(config.transformer.sentryTransform).toBe(true);
      expect(config.transformer.babelTransformerPath).toMatch(/metro\/svgTransformer\.js$/);
      expect(config.resolver.assetExts).toEqual(["png"]);
      expect(config.resolver.sourceExts).toEqual(["ts", "tsx", "svg"]);
      expect(config.serializer.customSerializer).toBe("sentry-debug-id-serializer");
      expect(withStorybook).toHaveBeenCalledWith(expect.anything(), { enabled: enabled === "true", liteMode: true });
    });
  });
});