import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mockUseQuery = jest.fn();
const mockClaimDialog = jest.fn((_props: Record<string, unknown>) => null);
const mockRefetchClaim = jest.fn().mockResolvedValue({});
const mockRefetchConversation = jest.fn().mockResolvedValue({});
let mockSession = { authenticated: true, account: { id: "viewer" } };
jest.mock("@apollo/client/react", () => ({ useQuery: mockUseQuery }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("next/link", () => ({ __esModule: true, default: "a" }));
jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: mockSession }) }));
jest.mock("../../src/features/needs/NeedClaimDialog", () => ({ NeedClaimDialog: mockClaimDialog }));
jest.mock("../../src/features/needs/needClaims.queries", () => ({ VIEWER_NEED_CLAIM_QUERY: "claim" }));
jest.mock("../../src/features/chat/chat.queries", () => ({ CLAIM_CONVERSATION_LOOKUP_QUERY: "conversation" }));
jest.mock("../../src/features/chat/StartConversationDialog", () => ({ StartConversationButton: () => null }));
jest.mock("../../src/components/IntensityPicker", () => ({ IntensityDisplay: () => null }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));
jest.mock("../../src/features/ui/AvatarIconButton", () => ({ AvatarIconButton: () => null }));
jest.mock("../../src/features/shared/serverGraphql", () => ({}));
jest.mock("@vis.gl/react-google-maps", () => ({ APIProvider: () => null, Map: () => null, Marker: () => null }));

const need = { id: "need", creatorAccountId: "owner", title: "Need", imageUrls: [],
  location: "", latitude: null, longitude: null, createdAt: "2026-10-01", expiresAt: null, isActive: true };
const existingClaim = { id: "claim", message: "I can help", status: "OPEN" };
function render(overrides = {}) {
  const Page = require("../../src/pages/needs/[needId]").default;
  return renderToStaticMarkup(createElement(Page, { needId: "need", initialNeed: { ...need, ...overrides } }));
}

describe("need detail volunteering action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { authenticated: true, account: { id: "viewer" } };
    mockUseQuery.mockImplementation((query: string) => query === "claim"
      ? { data: { needClaimByNeedIdAndClaimerAccountId: existingClaim }, loading: false, refetch: mockRefetchClaim }
      : { data: {}, loading: false, refetch: mockRefetchConversation });
  });

  it("loads only the viewer's claim and supplies it to the icon dialog", () => {
    render();
    expect(mockUseQuery).toHaveBeenCalledWith("claim", expect.objectContaining({ skip: false,
      variables: { needId: "need", claimerAccountId: "viewer" } }));
    expect(mockClaimDialog.mock.calls[0]?.[0]).toMatchObject({ iconOnly: true, needId: "need", existingClaim, disabled: false });
    const props = mockClaimDialog.mock.calls[0]?.[0] as unknown as { onClaimed: () => void };
    props.onClaimed();
    expect(mockRefetchClaim).toHaveBeenCalled();
    expect(mockRefetchConversation).toHaveBeenCalled();
  });

  it.each([false, true])("hides volunteering and skips lookup for signed-out/owner viewers (%s)", owner => {
    mockSession = owner ? { authenticated: true, account: { id: "owner" } } : { authenticated: false, account: { id: "viewer" } };
    render();
    expect(mockUseQuery).toHaveBeenCalledWith("claim", expect.objectContaining({ skip: true }));
    expect(mockClaimDialog).not.toHaveBeenCalled();
  });

  it.each([{ isActive: false }, { expiresAt: "2000-01-01" }])("disables volunteering for unavailable needs %j", overrides => {
    render(overrides);
    expect(mockClaimDialog.mock.calls[0]?.[0]).toMatchObject({ disabled: true });
  });

  it.each([{ loading: true }, { error: new Error("Offline") }])("does not submit before the claim lookup is ready %j", result => {
    mockUseQuery.mockImplementation(() => ({ data: {}, ...result }));
    render();
    expect(mockClaimDialog.mock.calls[0]?.[0]).toMatchObject({ disabled: true });
  });
});