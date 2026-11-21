import { getDeviceLanguageFromLocales } from "../../src/i18n";

describe("device language selection", () => {
  it.each(["fr", "fr-CA", "FR-be"])('selects French for a French locale (%s)', (languageCode) => {
    expect(getDeviceLanguageFromLocales([{ languageCode }])).toBe("fr");
  });

  it("falls back to the locale tag when the language code is unavailable", () => {
    expect(getDeviceLanguageFromLocales([{ languageCode: null, languageTag: "fr-CA" }])).toBe("fr");
  });

  it.each(["en", "en-GB", "de", undefined])("selects English for non-French or missing locale (%s)", (languageCode) => {
    expect(getDeviceLanguageFromLocales(languageCode ? [{ languageCode }] : [])).toBe("en");
  });
});
