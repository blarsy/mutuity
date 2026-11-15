import { renderToStaticMarkup } from "react-dom/server";

import { DateTimePickerField } from "../../src/components/DateTimePickerField";
import { INVALID_DATE_TIME, isValidDateTimeLocalValue, toDateTimeLocalValue } from "../../src/components/dateTime";
import { createResourceValidationSchema } from "../../src/features/resources/createResource.validation";
import { createNeedValidationSchema } from "../../src/features/needs/createNeed.validation";
import { createCampaignValidationSchema } from "../../src/features/campaigns/createCampaign.validation";

let mockLanguage = "en";
jest.mock("react-i18next", () => ({ useTranslation: () => ({ i18n: { language: mockLanguage } }) }));

describe("shared web date/time field", () => {
  it.each(["en", "fr"])("renders the typing mask and calendar button in %s", language => {
    mockLanguage = language;
    const html = renderToStaticMarkup(<DateTimePickerField name="expiresAt" label="Expires" value="" onChange={() => {}} />);
    expect(html).toContain("--/--/---- --:--");
    expect(html).toContain('name="expiresAt"');
    expect(html).toContain('type="text"');
    expect(html).toContain(language === "fr" ? "Choisir la date" : "Choose date");
  });

  it("displays day/month/year and preserves the 24-hour time", () => {
    const html = renderToStaticMarkup(<DateTimePickerField label="Date" value="2028-02-29T16:45" onChange={() => {}} />);
    expect(html).toContain("29/02/2028 16:45");
  });

  it("formats stored instants in local time rather than slicing UTC", () => {
    const stored = "2028-07-14T23:45:00Z";
    const local = new Date(stored);
    const pad = (part: number) => String(part).padStart(2, "0");
    expect(toDateTimeLocalValue(stored)).toBe(`${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`);
    expect(new Date(toDateTimeLocalValue(stored)).getTime()).toBe(local.getTime());
  });

  it.each([null, undefined, "", "bad date"])("handles missing or invalid saved dates: %s", value => {
    expect(toDateTimeLocalValue(value)).toBe("");
  });

  it.each([INVALID_DATE_TIME, "2027-02-29T12:00", "2028-04-31T12:00", "2028-01-01T25:00", "29/02/2028", "2028-01-01T12:"])("rejects incomplete/impossible form dates: %s", value => {
    expect(isValidDateTimeLocalValue(value)).toBe(false);
  });

  it("accepts a complete leap-day value", () => {
    expect(isValidDateTimeLocalValue("2028-02-29T16:45")).toBe(true);
  });
});

describe("typed date validation in every form", () => {
  it.each([
    ["resource", createResourceValidationSchema, "expiresAt"],
    ["need", createNeedValidationSchema, "expiresAt"],
    ["campaign start", createCampaignValidationSchema, "startAt"],
    ["campaign airdrop", createCampaignValidationSchema, "airdropAt"],
    ["campaign end", createCampaignValidationSchema, "endAt"]
  ] as const)("rejects incomplete and impossible %s dates at field level", async (_name, schema, field) => {
    for (const value of [INVALID_DATE_TIME, "2028-02-30T12:00"]) {
      await expect(schema.validateAt(field, { [field]: value })).rejects.toThrow("Enter a valid date and time");
    }
    await expect(schema.validateAt(field, { [field]: "2028-02-29T12:00" })).resolves.toBe("2028-02-29T12:00");
  });

  it("keeps need and resource expiration optional", async () => {
    for (const schema of [createNeedValidationSchema, createResourceValidationSchema]) {
      await expect(schema.validateAt("expiresAt", { expiresAt: "" })).resolves.toBe("");
    }
  });
});