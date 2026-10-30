import Constants from "expo-constants";
import { getAppSettings } from "../src/config/appSettings";

describe("bundled integration settings", () => {
  const extra = Constants.expoConfig!.extra!;
  const originalSettings = extra.appSettings;

  afterEach(() => {
    extra.appSettings = originalSettings;
  });

  it("reads and trims Cloudinary settings from the Expo manifest", () => {
    extra.appSettings = {
      ...originalSettings,
      cloudinary: { cloud: " json-cloud ", uploadPreset: " json-preset " }
    };
    expect(getAppSettings().cloudinary).toEqual({ cloud: "json-cloud", uploadPreset: "json-preset" });
  });

  it("allows explicitly unconfigured integrations", () => {
    extra.appSettings = { ...originalSettings, cloudinary: { cloud: "", uploadPreset: "" } };
    expect(getAppSettings().cloudinary).toEqual({ cloud: "", uploadPreset: "" });
  });

  it.each([undefined, null, {}, { cloud: "cloud", uploadPreset: 42 }])("rejects malformed Cloudinary settings: %p", cloudinary => {
    extra.appSettings = { ...originalSettings, cloudinary };
    expect(() => getAppSettings()).toThrow("cloudinary.cloud and cloudinary.uploadPreset must be strings");
  });
});