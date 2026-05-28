import fs from "fs";
import path from "path";

type LegalLocale = {
  privacy: {
    intro: string;
    sections: {
      dataCollectBody: string;
    };
  };
  terms: {
    sections: {
      purposeBody: string;
      tokenNatureBody: string;
      transparencyBody: string;
    };
  };
};

function loadLegalLocale(language: "en" | "fr"): LegalLocale {
  const filePath = path.resolve(__dirname, `../../src/locales/${language}/legal.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as LegalLocale;
}

describe("legal copy localization", () => {
  it("provides both english and french legal locale files", () => {
    expect(loadLegalLocale("en")).toBeDefined();
    expect(loadLegalLocale("fr")).toBeDefined();
  });

  it("keeps product name interpolation placeholders in english legal copy", () => {
    const en = loadLegalLocale("en");

    expect(en.privacy.intro).toContain("{{productName}}");
    expect(en.privacy.sections.dataCollectBody).toContain("{{productName}}");
    expect(en.terms.sections.purposeBody).toContain("{{productName}}");
    expect(en.terms.sections.tokenNatureBody).toContain("{{productName}}");
    expect(en.terms.sections.transparencyBody).toContain("{{productName}}");
  });

  it("keeps product name interpolation placeholders in french legal copy", () => {
    const fr = loadLegalLocale("fr");

    expect(fr.privacy.intro).toContain("{{productName}}");
    expect(fr.privacy.sections.dataCollectBody).toContain("{{productName}}");
    expect(fr.terms.sections.purposeBody).toContain("{{productName}}");
    expect(fr.terms.sections.tokenNatureBody).toContain("{{productName}}");
    expect(fr.terms.sections.transparencyBody).toContain("{{productName}}");
  });
});
