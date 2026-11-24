import { buttonStyles, getButtonFlavor } from "../../src/theme/buttonStyles";

describe("mobile button flavor styles", () => {
  it("defines color, radius, and border settings for every flavor", () => {
    for (const style of Object.values(buttonStyles)) {
      expect(style.roundness).toBe(8);
      expect(style.fontColor).toEqual(expect.any(String));
      expect(style.backgroundColor).toEqual(expect.any(String));
      expect(style.borderColor).toEqual(expect.any(String));
      expect(style.borderWidth).toEqual(expect.any(Number));
    }
  });

  it.each([
    ["contained", "primary"],
    ["outlined", "secondary"],
    ["text", "quiet"],
    ["elevated", "elevated"],
    ["contained-tonal", "tonal"],
    [undefined, "quiet"]
  ] as const)("maps Paper mode %s to the %s flavor", (mode, flavor) => {
    expect(getButtonFlavor(mode)).toBe(flavor);
  });
});
