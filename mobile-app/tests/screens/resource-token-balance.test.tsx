import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { ResourceDetailScreen } from "../../src/screens/resources/ResourceDetailScreen";
import type { ResourceDetailItem } from "../../src/services/graphql/resources";
import { useTokenBalance } from "../../src/services/realtime/useTokenBalance";
import { submitResourceBid } from "../../src/services/graphql/bids";

const mockTranslate = (key: string, options?: Record<string, unknown>): string =>
  String(options?.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? ""));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: mockTranslate, i18n: { language: "en" } }) }));
jest.mock("../../src/assets/img/CHAT.svg", () => () => null);
jest.mock("../../src/components/TokenAmount", () => ({ TokenAmount: () => null }));
jest.mock("../../src/services/realtime/useTokenBalance", () => ({ useTokenBalance: jest.fn() }));
jest.mock("../../src/services/graphql/resources", () => ({ fetchResourceById: jest.fn() }));
jest.mock("../../src/services/graphql/bids", () => ({ submitResourceBid: jest.fn() }));

const resource: ResourceDetailItem = {
  id: "resource", title: "Tools", description: "Garden tools", creatorAccountId: "owner", creatorDisplayName: "Nora",
  creatorAvatarUrl: null, createdAt: "2026-10-10T12:00:00Z", expiresAt: null, isActive: true, isProduct: true,
  isService: false, canBeTakenAway: true, canBeDelivered: false, canBeExchanged: true, canBeGifted: false,
  locationLabel: "", latitude: null, longitude: null, defaultTokenAmount: 12, categoryLabels: [], imageUrls: []
};
const wrapper = ({ children }: { children: React.ReactNode }) => <PaperProvider>{children}</PaperProvider>;
const props = { resourceId: resource.id, resource, currentAccountId: "bidder" };

beforeEach(() => {
  jest.resetAllMocks();
  (useTokenBalance as jest.Mock).mockReturnValue({ balance: 20, loading: false, error: null, refresh: jest.fn() });
  (submitResourceBid as jest.Mock).mockResolvedValue(undefined);
});

it("subscribes only while the bid dialog is open and validates the latest hook balance", async () => {
  const screen = render(<ResourceDetailScreen {...props} />, { wrapper });
  expect(useTokenBalance).toHaveBeenLastCalledWith("bidder", false);
  fireEvent.press(screen.getByLabelText("Send bid"));
  await screen.findByTestId("bid-token-balance");
  expect(useTokenBalance).toHaveBeenLastCalledWith("bidder", true);
  expect(screen.getByTestId("bid-token-balance")).toHaveTextContent("Available balance: 20");
  (useTokenBalance as jest.Mock).mockReturnValue({ balance: 5, loading: false, error: null, refresh: jest.fn() });
  screen.rerender(<ResourceDetailScreen {...props} />);
  expect(screen.getByTestId("bid-token-balance")).toHaveTextContent("Available balance: 5");
  fireEvent.press(screen.getByText("Send bid"));
  expect(screen.getByText("You cannot send more than your balance (5).")).toBeTruthy();
  expect(submitResourceBid).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Cancel"));
  await waitFor(() => expect(useTokenBalance).toHaveBeenLastCalledWith("bidder", false));
});

it("displays unknown/error as a dash rather than zero and defers balance enforcement to the server", async () => {
  (useTokenBalance as jest.Mock).mockReturnValue({ balance: null, loading: false, error: new Error("offline"), refresh: jest.fn() });
  const screen = render(<ResourceDetailScreen {...props} />, { wrapper });
  fireEvent.press(screen.getByLabelText("Send bid"));
  await screen.findByTestId("bid-token-balance");
  expect(screen.getByTestId("bid-token-balance")).toHaveTextContent("Available balance: —");
  expect(screen.getByText("We could not load contribution details.")).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText("Send bid")); });
  expect(submitResourceBid).toHaveBeenCalledWith({ resourceId: "resource", proposedTokenAmount: 12, validHours: 12, message: null });
  expect(useTokenBalance).toHaveBeenLastCalledWith("bidder", false);
});

it("keeps injected stories isolated and does not subscribe without an account", async () => {
  const screen = render(<ResourceDetailScreen {...props} tokenBalance={0} />, { wrapper });
  fireEvent.press(screen.getByLabelText("Send bid"));
  await screen.findByTestId("bid-token-balance");
  expect(screen.getByTestId("bid-token-balance")).toHaveTextContent("Available balance: 0");
  expect(useTokenBalance).toHaveBeenLastCalledWith("bidder", false);
  screen.rerender(<ResourceDetailScreen {...props} currentAccountId={null} tokenBalance={null} />);
  expect(useTokenBalance).toHaveBeenLastCalledWith(null, false);
});