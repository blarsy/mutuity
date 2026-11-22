import { renderToStaticMarkup } from "react-dom/server";
import { LocationPicker } from "../../src/components/LocationPicker";

jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Map: ({ children }: { children: React.ReactNode }) => <div data-testid="location-map">{children}</div>,
  Marker: ({ position }: { position: { lat: number; lng: number } }) => <span data-testid="location-marker">{position.lat},{position.lng}</span>,
  useMap: () => null,
  useMapsLibrary: () => null
}));

describe("location picker map", () => {
  it("renders the map and marker for valid numeric coordinates", () => {
    const html = renderToStaticMarkup(<LocationPicker value={{ address: "Pipaix", latitude: 50.5838, longitude: 3.578596 }} onChange={jest.fn()} />);
    expect(html).toContain('data-testid="location-map"');
    expect(html).toContain("50.5838,3.578596");
  });

  it("does not render a map without both coordinates", () => {
    const html = renderToStaticMarkup(<LocationPicker value={{ address: "Pipaix", latitude: 50.5838, longitude: "" }} onChange={jest.fn()} />);
    expect(html).not.toContain('data-testid="location-map"');
  });
});