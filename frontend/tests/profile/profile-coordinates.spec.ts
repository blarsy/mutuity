import { normalizeCoordinate } from "../../src/features/profile/profileCoordinates";

describe("normalizeCoordinate", () => {
  it("normalizes GraphQL BigFloat strings to numbers", () => {
    expect(normalizeCoordinate("50.6072", 1)).toBe(50.6072);
    expect(normalizeCoordinate("3.3889", 1)).toBe(3.3889);
  });

  it("preserves numeric coordinates including zero", () => {
    expect(normalizeCoordinate(0, 1)).toBe(0);
    expect(normalizeCoordinate(-73.9857, 1)).toBe(-73.9857);
  });

  it("uses the fallback for missing or invalid coordinates", () => {
    expect(normalizeCoordinate(null, 50.6072)).toBe(50.6072);
    expect(normalizeCoordinate("not-a-coordinate", 3.3889)).toBe(3.3889);
  });
});