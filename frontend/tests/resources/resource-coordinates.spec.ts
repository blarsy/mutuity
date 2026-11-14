import {
  createResourceInitialValues,
  normalizeOptionalResourceCoordinate
} from "../../src/features/resources/createResource.validation";

describe("optional resource coordinates", () => {
  it("omits blank form coordinates from the GraphQL request instead of sending empty strings", () => {
    const variables = {
      latitude: normalizeOptionalResourceCoordinate(createResourceInitialValues.latitude),
      longitude: normalizeOptionalResourceCoordinate(createResourceInitialValues.longitude)
    };

    expect(variables.latitude).toBeUndefined();
    expect(variables.longitude).toBeUndefined();
    expect(JSON.parse(JSON.stringify(variables))).toEqual({});
  });

  it.each(["", "   ", null, undefined, "invalid", NaN, Infinity, -Infinity])(
    "normalizes absent or invalid coordinate %s to undefined",
    value => {
      expect(normalizeOptionalResourceCoordinate(value)).toBeUndefined();
    }
  );

  it.each([
    [0, 0],
    ["0", 0],
    [50.605, 50.605],
    ["50.605", 50.605],
    [-3.4, -3.4],
    ["-3.4", -3.4]
  ])("preserves numeric coordinate %s as %s", (value, expected) => {
    expect(normalizeOptionalResourceCoordinate(value)).toBe(expected);
  });
});