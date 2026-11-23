import { formatSiteDateTime } from "../../src/features/shared/publicDateTime";

describe("formatSiteDateTime", () => {
  const instant = new Date(2026, 2, 4, 17, 8);

  it("uses the French day/month/year convention for dates", () => {
    expect(formatSiteDateTime(instant, "fr", "date")).toBe("04/03/2026");
  });

  it("uses the English locale for dates and localized datetime", () => {
    expect(formatSiteDateTime(instant, "en-US", "date")).toBe("03/04/2026");
    expect(formatSiteDateTime(instant, "fr-FR")).toMatch(/^04\/03\/2026/);
  });

  it("formats time-only values and leaves invalid input readable", () => {
    expect(formatSiteDateTime(instant, "fr", "time")).toMatch(/^17:08$/);
    expect(formatSiteDateTime("not-a-date", "fr")).toBe("not-a-date");
    expect(formatSiteDateTime(null, "fr")).toBe("");
  });
});