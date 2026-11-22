import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SearchNeedsScreen } from "../../src/screens/needs/SearchNeedsScreen";
import { fetchSearchNeeds, type NeedItem } from "../../src/services/graphql/needs";
import { NeedIntensity } from "../../src/services/graphql/generated";
import "../../src/i18n";

jest.mock("../../src/services/graphql/needs", () => ({ fetchSearchNeeds: jest.fn() }));
jest.mock("../../src/services/graphql/campaigns", () => ({ fetchLinkableCampaigns: jest.fn().mockResolvedValue([]) }));
jest.mock("../../src/components/primitives/ProximityLocationEditor", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
  return { ProximityLocationEditor: ({ onChange }: { onChange: (value: unknown) => void }) => (
    <>
      <Pressable onPress={() => onChange({ label: "Other", latitude: 48, longitude: 2 })}><Text>Choose other</Text></Pressable>
      <Pressable onPress={() => onChange({ label: "Unknown" })}><Text>Choose unresolved</Text></Pressable>
      <Pressable onPress={() => onChange(null)}><Text>Clear location</Text></Pressable>
    </>
  ) };
});

const need = (id: string, extra: Partial<NeedItem> = {}): NeedItem => ({
  id, title: id, description: "", proposedTokenAmount: 10, intensity: NeedIntensity.Sharing,
  distanceKm: 1, located: true, createdAt: null, creatorAccountId: null,
  claimCount: 0, isClaimedByCurrentAccount: false, ...extra
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function screen(accountId: string | null = null) {
  return render(<SafeAreaProvider><PaperProvider><SearchNeedsScreen currentAccountId={accountId}
    campaignOptions={[{ id: "a", title: "A" }, { id: "b", title: "B" }]} /></PaperProvider></SafeAreaProvider>);
}

describe("remote needs search", () => {
  beforeEach(() => jest.mocked(fetchSearchNeeds).mockReset());

  it("keeps local filters local and recognizes every public campaign", async () => {
    jest.mocked(fetchSearchNeeds).mockResolvedValue([need("one", { campaignIds: ["a", "b"] }), need("two")]);
    const view = screen();
    await waitFor(() => expect(view.getByTestId("need-card-one")).toBeTruthy());
    expect(jest.mocked(fetchSearchNeeds).mock.calls[0]![0]).toMatchObject({
      referenceLocation: { latitude: 50.6072, longitude: 3.3889 }, distanceKm: 10
    });
    fireEvent.changeText(view.getByLabelText("Max Tope amount"), "20");
    fireEvent.press(view.getByTestId("need-intensity-chip-sharing"));
    fireEvent.press(view.getByLabelText("Hide claimed needs"));
    fireEvent.press(view.getByTestId("needs-campaign-filter-button"));
    fireEvent.press(view.getByText("B"));
    fireEvent.press(view.getByText("OK"));
    await waitFor(() => expect(view.queryByTestId("need-card-two")).toBeNull());
    expect(view.getByTestId("need-card-one")).toBeTruthy();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 600)); });
    expect(fetchSearchNeeds).toHaveBeenCalledTimes(1);
  });

  it("keeps results visible, rejects stale success/failure, and uses server search semantics", async () => {
    const older = deferred<NeedItem[]>();
    const newer = deferred<NeedItem[]>();
    jest.mocked(fetchSearchNeeds).mockResolvedValueOnce([need("initial")])
      .mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);
    const view = screen();
    await waitFor(() => expect(view.getByTestId("need-card-initial")).toBeTruthy());
    fireEvent.changeText(view.getByPlaceholderText("Search needs"), "first");
    await waitFor(() => expect(fetchSearchNeeds).toHaveBeenCalledTimes(2), { timeout: 2000 });
    expect(view.getByTestId("need-card-initial")).toBeTruthy();
    fireEvent.changeText(view.getByPlaceholderText("Search needs"), "creator name");
    await act(async () => { older.reject(new Error("old error")); });
    await waitFor(() => expect(fetchSearchNeeds).toHaveBeenCalledTimes(3), { timeout: 2000 });
    expect(view.getByTestId("need-card-initial")).toBeTruthy();
    await act(async () => { newer.resolve([need("different title")]); });
    expect(view.getByTestId("need-card-different title")).toBeTruthy();
    expect(view.queryByText("We could not load needs.")).toBeNull();
  });

  it("hides prior-account results immediately when accounts change", async () => {
    jest.mocked(fetchSearchNeeds).mockResolvedValueOnce([need("private claim state")])
      .mockReturnValueOnce(deferred<NeedItem[]>().promise);
    const view = screen("first");
    await waitFor(() => expect(view.getByTestId("need-card-private claim state")).toBeTruthy());
    view.rerender(<SafeAreaProvider><PaperProvider><SearchNeedsScreen currentAccountId="second"
      campaignOptions={[]} /></PaperProvider></SafeAreaProvider>);
    expect(view.queryByTestId("need-card-private claim state")).toBeNull();
  });

  it("debounces selected and cleared coordinates and ignores stale successes", async () => {
    const stale = deferred<NeedItem[]>();
    jest.mocked(fetchSearchNeeds).mockReturnValueOnce(stale.promise)
      .mockResolvedValueOnce([need("other")]).mockResolvedValueOnce([need("fallback")]);
    const view = screen();
    fireEvent.press(view.getByText("Proximity"));
    fireEvent.press(view.getByText("Choose other"));
    await act(async () => { stale.resolve([need("stale")]); });
    expect(view.queryByTestId("need-card-stale")).toBeNull();
    await waitFor(() => expect(view.getByTestId("need-card-other")).toBeTruthy(), { timeout: 2000 });
    expect(jest.mocked(fetchSearchNeeds).mock.calls[1]![0]).toMatchObject({
      referenceLocation: { latitude: 48, longitude: 2 }, distanceKm: 10
    });
    fireEvent.press(view.getByText("Clear location"));
    await waitFor(() => expect(view.getByTestId("need-card-fallback")).toBeTruthy(), { timeout: 2000 });
    expect(jest.mocked(fetchSearchNeeds).mock.calls[2]![0]).toMatchObject({ referenceLocation: null, distanceKm: null });
  });

  it("warns when the server's bounded result set may be incomplete", async () => {
    jest.mocked(fetchSearchNeeds).mockResolvedValue(Array.from({ length: 50 }, (_, index) => need(`need-${index}`)));
    const view = screen();
    await waitFor(() => expect(view.getByText(/Showing up to 50 results/)).toBeTruthy());
  });

  it("does not search a different location when an address cannot be resolved", async () => {
    jest.mocked(fetchSearchNeeds).mockResolvedValue([need("initial")]);
    const view = screen();
    await waitFor(() => expect(view.getByTestId("need-card-initial")).toBeTruthy());
    fireEvent.press(view.getByText("Proximity"));
    fireEvent.press(view.getByText("Choose unresolved"));
    expect(view.getByText("Unable to retrieve location details right now.")).toBeTruthy();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 600)); });
    expect(fetchSearchNeeds).toHaveBeenCalledTimes(1);
    expect(view.getByTestId("need-card-initial")).toBeTruthy();
  });
});