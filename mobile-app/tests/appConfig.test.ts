import fs from "node:fs";
import type { ConfigContext } from "expo/config";
import appConfig from "../app.config";

const context = {} as ConfigContext;

describe("build-time environment configuration", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it.each(["local", "test", "review", "prod"])("loads the complete %s JSON configuration", targetEnv => {
    process.env.TARGET_ENV = targetEnv;
    const config = appConfig(context);
    expect(config.extra?.appSettings).toMatchObject({
      targetEnv,
      cloudinary: { cloud: expect.any(String), uploadPreset: expect.any(String) }
    });
    expect(config.extra?.appSettings).not.toHaveProperty("googleMaps");
  });

  function mockSettings() {
    const settings = {
      targetEnv: "review",
      apiUrl: "https://review.example.com",
      graphQlApiUrl: "https://review.example.com/graphql",
      subscriptionsUrl: "wss://review.example.com/graphql",
      diagnostic: true,
      googleMaps: { androidApiKey: "android-json-key", iosApiKey: "ios-json-key" },
      cloudinary: { cloud: "json-cloud", uploadPreset: "json-preset" }
    };
    process.env.TARGET_ENV = "review";
    jest.spyOn(fs, "readFileSync").mockImplementation(() => JSON.stringify(settings));
    return settings;
  }

  it("uses JSON values, not legacy environment overrides", () => {
    mockSettings();
    process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY = "wrong-android";
    process.env.EXPO_IOS_GOOGLE_MAPS_API_KEY = "wrong-ios";
    process.env.EXPO_GOOGLE_MAPS_API_KEY = "wrong-fallback";
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD = "wrong-cloud";
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET = "wrong-preset";
    const config = appConfig(context);
    expect(config.android?.config?.googleMaps?.apiKey).toBe("android-json-key");
    expect(config.ios?.config?.googleMapsApiKey).toBe("ios-json-key");
    expect(config.ios?.infoPlist?.GMSApiKey).toBe("ios-json-key");
    expect(config.extra?.appSettings.cloudinary).toEqual({ cloud: "json-cloud", uploadPreset: "json-preset" });
    expect(config.extra?.appSettings).not.toHaveProperty("googleMaps");
  });

  it("rejects malformed integration settings", () => {
    const settings = mockSettings();
    Object.assign(settings.cloudinary, { uploadPreset: 42 });
    expect(() => appConfig(context)).toThrow("cloudinary.uploadPreset");
  });

  it("keeps monitoring opt-in and does not add native upload hooks without a DSN", () => {
    mockSettings();
    delete process.env.EXPO_PUBLIC_GLITCHTIP_DSN;
    const config = appConfig(context);
    expect(config.extra?.monitoring).toEqual({ dsn: "", storybook: false });
    expect(JSON.stringify(config.plugins)).not.toContain("@sentry/react-native");
  });

  it("exposes only public monitoring settings and directs native artifact uploads to GlitchTip", () => {
    mockSettings();
    process.env.EXPO_PUBLIC_GLITCHTIP_DSN = "https://public-key@errors.example.com/1";
    process.env.SENTRY_ORG = "mutuity";
    process.env.SENTRY_PROJECT = "mobile";
    process.env.SENTRY_AUTH_TOKEN = "private-build-token";
    process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = "true";
    const config = appConfig(context);
    expect(config.extra?.monitoring).toEqual({
      dsn: "https://public-key@errors.example.com/1", storybook: true
    });
    expect(config.plugins).toContainEqual(["@sentry/react-native/expo", {
      url: "https://errors.example.com/", organization: "mutuity", project: "mobile"
    }]);
    expect(JSON.stringify(config)).not.toContain("private-build-token");
  });

  it("rejects missing integration settings", () => {
    const settings = mockSettings();
    Reflect.deleteProperty(settings, "googleMaps");
    expect(() => appConfig(context)).toThrow("googleMaps.androidApiKey");
  });

  it("rejects a targetEnv that disagrees with the selected file", () => {
    const settings = mockSettings();
    settings.targetEnv = "prod";
    expect(() => appConfig(context)).toThrow("targetEnv must match review");
  });
});