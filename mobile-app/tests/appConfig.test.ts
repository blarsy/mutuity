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