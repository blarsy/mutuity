import { renderToStaticMarkup } from "react-dom/server";
import { LocationPicker } from "../../src/components/LocationPicker";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: () => null,
  Marker: () => null,
  useMap: () => null,
  useMapsLibrary: () => null
}));

describe("location picker remove action", () => {
  it.each([
    { address: "Brussels", latitude: 50, longitude: 4 },
    { address: "Address only", latitude: "" as const, longitude: "" as const },
    { address: "", latitude: 0, longitude: "" as const }
  ])("shows a remove button for a location (%o)", value => {
    const html = renderToStaticMarkup(<LocationPicker value={value} onChange={jest.fn()} onClear={jest.fn()} />);
    expect(html).toContain("locationPicker.remove");
    expect(html).toContain('type="button"');
  });

  it("hides remove for an empty location or a consumer without onClear", () => {
    const empty = { address: "", latitude: "" as const, longitude: "" as const };
    expect(renderToStaticMarkup(<LocationPicker value={empty} onChange={jest.fn()} onClear={jest.fn()} />)).not.toContain("locationPicker.remove");
    expect(renderToStaticMarkup(<LocationPicker value={{ address: "Brussels", latitude: 50, longitude: 4 }} onChange={jest.fn()} />)).not.toContain("locationPicker.remove");
  });
});