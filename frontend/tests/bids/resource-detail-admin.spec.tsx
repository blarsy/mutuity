import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseQuery = jest.fn();
let mockSession = { authenticated: true, role: "admin", account: { id: "me" } };
let mockResource: Record<string, unknown> | null;
const mockBid = { id: "my-bid", bidderAccountId: "me", status: "OPEN", createdAt: "2026-10-04" };
const mockRefetch = jest.fn();
const mockRefetchBids = jest.fn();
jest.mock("@apollo/client/react", () => ({ useQuery: mockUseQuery }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("next/link", () => ({ __esModule: true, default: "a" }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: mockSession, status: "ready" }) }));
jest.mock("../../src/features/resources/resources.queries", () => ({
  RESOURCE_DETAIL_QUERY: "detail", RESOURCE_BIDS_FOR_RESOURCE_QUERY: "bids", RESOURCE_CATEGORY_OPTIONS_QUERY: "categories"
}));
jest.mock("../../src/features/chat/chat.queries", () => ({ RESOURCE_CONVERSATION_LOOKUP_QUERY: "conversation" }));
jest.mock("../../src/features/chat/StartConversationDialog", () => ({ StartConversationButton: () => null }));
jest.mock("../../src/features/resources/ResourceBidDialog", () => ({ ResourceBidDialog: () => null }));
jest.mock("../../src/features/ui/AvatarIconButton", () => ({ AvatarIconButton: () => null }));
jest.mock("../../src/components/IntensityPicker", () => ({ IntensityDisplay: () => null }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));
jest.mock("@vis.gl/react-google-maps", () => ({ APIProvider: () => null, Map: () => null, Marker: () => null }));

describe("resource detail ordinary-user access", () => {
  beforeEach(() => {
    mockSession = { authenticated: true, role: "admin", account: { id: "me" } };
    mockResource = { id: "resource", creatorAccountId: "other", title: "Resource", isActive: true,
      imageUrls: [], categoryLabels: [], createdAt: "2026-10-04", expiresAt: null };
    mockUseQuery.mockClear();
    mockUseQuery.mockImplementation((query: string) => {
      if (query === "detail") return { data: { resourceById: mockResource }, refetch: mockRefetch };
      if (query === "bids") return { data: { resourceBidsByResourceId: { nodes: [mockBid] } }, refetch: mockRefetchBids };
      return { data: {} };
    });
  });
  it.each(["admin", "identified_account"])("queries participant-scoped bids and displays the existing bid for %s", role => {
    mockSession.role = role;
    const { ResourceDetailPage } = require("../../src/features/resources/ResourceDetailPage");
    const html = renderToStaticMarkup(createElement(ResourceDetailPage, { resourceId: "resource" }));
    expect(mockUseQuery).toHaveBeenCalledWith("bids", expect.objectContaining({ skip: false }));
    expect(html).toContain("detail.existingBidHint");
    expect(html).toContain("/bids?bidId=my-bid");
  });
  it("skips bids when signed out", () => {
    mockSession.authenticated = false;
    const { ResourceDetailPage } = require("../../src/features/resources/ResourceDetailPage");
    renderToStaticMarkup(createElement(ResourceDetailPage, { resourceId: "resource" }));
    expect(mockUseQuery).toHaveBeenCalledWith("bids", expect.objectContaining({ skip: true }));
  });
  it("skips bids until the resource is available", () => {
    mockResource = null;
    const { ResourceDetailPage } = require("../../src/features/resources/ResourceDetailPage");
    renderToStaticMarkup(createElement(ResourceDetailPage, { resourceId: "resource" }));
    expect(mockUseQuery).toHaveBeenCalledWith("bids", expect.objectContaining({ skip: true }));
  });
});