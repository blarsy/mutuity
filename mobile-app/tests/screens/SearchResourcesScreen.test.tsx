import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { SearchResourcesScreen, type SearchResourceItem } from "../../src/screens/resources/SearchResourcesScreen";
import { fetchSearchResources } from "../../src/services/graphql/resources";

jest.mock("react-i18next", () => {
  const t = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key;
  return { useTranslation: () => ({ t }) };
});

jest.mock("../../src/services/graphql/resources", () => ({
  fetchSearchResources: jest.fn(),
  fetchResourceCategories: jest.fn()
}));
jest.mock("../../src/services/graphql/campaigns", () => ({ fetchLinkableCampaigns: jest.fn() }));
jest.mock("../../src/components/campaignExplainer/CampaignExplainerButton", () => ({ CampaignExplainerButton: () => null }));
jest.mock("../../src/components/listings/SearchListingCards", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { ResourceSearchCard: ({ listing }: { listing: SearchResourceItem }) => React.createElement(Text, null, listing.title) };
});
jest.mock("../../src/components/primitives", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text, View, TextInput } = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    ScreenContainer: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    AppSegmentedButtons: () => null,
    FormTextInput: (props: object) => React.createElement(TextInput, props),
    PickerDialog: ({ visible, title, onConfirm }: { visible: boolean; title: string; onConfirm: (values: string[]) => void }) =>
      visible ? React.createElement(Pressable, { onPress: () => onConfirm([title === "Categories" ? "Food" : "campaign-1"]) }, React.createElement(Text, null, `Select ${title}`)) : null,
    ProximityLocationEditor: ({ onChange }: { onChange: (value: object | null) => void }) =>
      React.createElement(View, null,
        React.createElement(Pressable, { onPress: () => onChange({ label: "Paris", latitude: 48.85, longitude: 2.35 }) }, React.createElement(Text, null, "Set Paris")),
        React.createElement(Pressable, { onPress: () => onChange({ label: "Unknown" }) }, React.createElement(Text, null, "Set unknown")),
        React.createElement(Pressable, { onPress: () => onChange(null) }, React.createElement(Text, null, "Clear location")))
  };
});

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

const item = (id: string, overrides: Partial<SearchResourceItem> = {}): SearchResourceItem => ({
  id, title: id, description: "", createdAt: null, creatorAccountId: null, creatorDisplayName: null,
  category: "Food", distanceKm: 2, type: "product", canBeTakenAway: false, canBeDelivered: false,
  canBeExchanged: false, canBeGifted: false, located: true, campaignIds: ["campaign-1"], imageUrls: [],
  ...overrides
});
const mockFetch = jest.mocked(fetchSearchResources);
const renderScreen = () => render(<PaperProvider><SearchResourcesScreen campaignOptions={[]} categoryOptions={[]} /></PaperProvider>);
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const debounce = async () => { await act(async () => { jest.advanceTimersByTime(500); }); };

describe("SearchResourcesScreen remote search", () => {
  beforeEach(() => { jest.useFakeTimers(); mockFetch.mockReset(); });
  afterEach(() => { jest.useRealTimers(); });

  it("filters categories, campaigns and unlocated resources without remote requests", async () => {
    mockFetch.mockResolvedValue([
      item("Food result"),
      item("Other result", { category: "Other" }),
      item("No campaign", { campaignIds: [] }),
      item("Unlocated", { located: false })
    ]);
    const screen = renderScreen();
    await flush();
    expect(screen.getByText("Other result")).toBeTruthy();
    fireEvent.press(screen.getByText("Categories"));
    fireEvent.press(screen.getByText("Select Categories"));
    expect(screen.queryByText("Other result")).toBeNull();
    fireEvent.press(screen.getByText("Campaigns"));
    fireEvent.press(screen.getByText("Select Campaigns"));
    expect(screen.queryByText("No campaign")).toBeNull();
    expect(screen.getByText("Unlocated")).toBeTruthy();
    fireEvent.press(screen.getByText("Proximity"));
    fireEvent.press(screen.getByText("Exclude unlocated resources"));
    expect(screen.queryByText("Unlocated")).toBeNull();
    await debounce();
    expect(screen.getByText("Food result")).toBeTruthy();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps results on refresh, ignores stale responses during debounce and out of order, and recovers from refresh errors", async () => {
    const first = deferred<SearchResourceItem[]>();
    const second = deferred<SearchResourceItem[]>();
    const third = deferred<SearchResourceItem[]>();
    mockFetch.mockResolvedValueOnce([item("original")]).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
    const screen = renderScreen();
    await flush();
    fireEvent.press(screen.getByLabelText("Retry"));
    expect(screen.getByText("original")).toBeTruthy();
    expect(screen.getByText("Loading...")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("Search resources"), "new");
    await act(async () => { first.resolve([item("obsolete")]); await first.promise; });
    expect(screen.getByText("original")).toBeTruthy();
    expect(screen.queryByText("obsolete")).toBeNull();
    await debounce();
    fireEvent.press(screen.getByLabelText("Retry"));
    await act(async () => { third.resolve([item("newest")]); await third.promise; });
    await act(async () => { second.resolve([item("new old")]); await second.promise; });
    expect(screen.getByText("newest")).toBeTruthy();
    expect(screen.queryByText("new old")).toBeNull();
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    fireEvent.press(screen.getByLabelText("Retry"));
    await flush();
    expect(screen.getByText("newest")).toBeTruthy();
    expect(screen.getByText("We could not load resources.")).toBeTruthy();
  });

  it("applies client filters to an in-flight response without invalidating it", async () => {
    const pending = deferred<SearchResourceItem[]>();
    mockFetch.mockReturnValueOnce(pending.promise);
    const screen = renderScreen();
    fireEvent.press(screen.getByText("Categories"));
    fireEvent.press(screen.getByText("Select Categories"));
    await debounce();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve([item("Food result"), item("Other result", { category: "Other" })]); await pending.promise; });
    expect(screen.getByText("Food result")).toBeTruthy();
    expect(screen.queryByText("Other result")).toBeNull();
  });

  it("debounces server-side text and option changes into one request", async () => {
    mockFetch.mockResolvedValue([]);
    const screen = renderScreen();
    await flush();
    fireEvent.changeText(screen.getByPlaceholderText("Search resources"), "bike");
    fireEvent.press(screen.getByText("Options"));
    fireEvent.press(screen.getByLabelText("Service"));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await debounce();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1]?.[0]).toMatchObject({ searchTerm: "bike", natureOptions: { isService: true } });
  });

  it("retains server matches on creator or category text", async () => {
    mockFetch.mockResolvedValueOnce([]).mockResolvedValueOnce([item("A different title")]);
    const screen = renderScreen();
    await flush();
    fireEvent.changeText(screen.getByPlaceholderText("Search resources"), "creator name");
    await debounce();
    await flush();
    expect(screen.getByText("A different title")).toBeTruthy();
  });

  it("passes default and selected coordinates and waits for unresolved locations", async () => {
    mockFetch.mockResolvedValue([]);
    const screen = renderScreen();
    await flush();
    expect(mockFetch.mock.calls[0]?.[0]).toMatchObject({ hasReferenceLocation: true, referenceLocation: { latitude: 50.6072, longitude: 3.3889 }, distanceKm: 10 });
    fireEvent.press(screen.getByText("Proximity"));
    fireEvent.press(screen.getByText("Set Paris"));
    await debounce();
    expect(mockFetch.mock.calls[1]?.[0]).toMatchObject({ hasReferenceLocation: true, referenceLocation: { latitude: 48.85, longitude: 2.35 } });
    fireEvent.press(screen.getByText("Set unknown"));
    expect(screen.getByText("Choose a location with coordinates to filter by distance.")).toBeTruthy();
    await debounce();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByText("Clear location"));
    await debounce();
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[2]?.[0]).toMatchObject({ hasReferenceLocation: false, referenceLocation: null });
  });
});
