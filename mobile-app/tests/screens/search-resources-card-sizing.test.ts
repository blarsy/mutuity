import { getFoundResourceCardMaxWidth } from "../../src/screens/resources/SearchResourcesScreen";

describe("found resource card sizing", () => {
  it.each([
    [320, 200],
    [599, 200],
    [600, 300],
    [899, 300],
    [900, 400],
    [1440, 400]
  ])("caps a %i dp screen at %i dp", (screenWidth, expectedMaxWidth) => {
    expect(getFoundResourceCardMaxWidth(screenWidth)).toBe(expectedMaxWidth);
  });
});