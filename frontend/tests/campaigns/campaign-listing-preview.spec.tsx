import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";
import { Dialog, IconButton } from "@mui/material";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { CampaignListingPreviewDialog } from "../../src/features/campaigns/CampaignListingPreviewDialog";

jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@mui/material", () => ({ ...jest.requireActual("@mui/material"), Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: ({ html }: { html: string }) => <div>{html}</div> }));
jest.mock("../../src/components/IntensityPicker", () => ({ IntensityDisplay: ({ intensity, tokenAmount }: { intensity: string; tokenAmount: number }) => <div>{intensity}: {tokenAmount}</div> }));

const listing = {
  id: "listing-1", title: "Garden help", description: "Public description", location: "Brussels", latitude: null, longitude: null,
  intensity: "SHARING", imageUrls: ["https://example.com/image.jpg"], expiresAt: null, createdAt: "2026-01-01", isActive: true,
  accountByCreatorAccountId: { displayName: "Alice", avatarUrl: null },
  defaultTokenAmount: 120, proposedTopesAmount: 125, isProduct: true, canBeGiven: true, canBeExchanged: true,
  competenceRequired: true, requiredCompetenceText: "Gardening", toolingRequired: true, requiredToolingText: "Spade", requiredPeopleCount: 2
};

beforeEach(() => jest.clearAllMocks());

it.each(["resource", "need"] as const)("shows public %s information only and selects the correct query branch", kind => {
  jest.mocked(useQuery).mockReturnValue({ data: { [`${kind}ById`]: listing }, loading: false } as unknown as ReturnType<typeof useQuery>);
  const html = renderToStaticMarkup(<CampaignListingPreviewDialog listing={{ kind, id: listing.id }} onClose={jest.fn()} />);
  expect(html).toContain("Garden help");
  expect(html).toContain("Alice");
  expect(html).toContain("Public description");
  expect(html).toContain("Brussels");
  expect(html).toContain("https://example.com/image.jpg");
  expect(html).not.toContain("submitResourceBid");
  expect(html).not.toContain("claimNeed");
  if (kind === "need") {
    expect(html).toContain("Gardening");
    expect(html).toContain("Spade");
  }
  expect(jest.mocked(useQuery).mock.calls[0][1]).toMatchObject({
    skip: false, variables: { id: listing.id, resource: kind === "resource", need: kind === "need" }, fetchPolicy: "network-only"
  });
});

it.each([
  [{ loading: true }, "role=\"status\""],
  [{ loading: false, data: { needById: null } }, "moderationListings.unavailable"],
  [{ loading: false, error: new Error("Unavailable") }, "Something went wrong. Please try again."]
])("handles loading, missing listings, and errors without displaying old content", (result, expected) => {
  jest.mocked(useQuery).mockReturnValue(result as unknown as ReturnType<typeof useQuery>);
  const html = renderToStaticMarkup(<CampaignListingPreviewDialog listing={{ kind: "need", id: listing.id }} onClose={jest.fn()} />);
  expect(html).toContain(expected);
  expect(html).not.toContain("Public description");
});

it("skips requests while closed and wires both escape/backdrop and close-button dismissal", () => {
  jest.mocked(useQuery).mockReturnValue({ loading: false } as ReturnType<typeof useQuery>);
  const onClose = jest.fn();
  const tree = CampaignListingPreviewDialog({ listing: null, onClose });
  expect(tree.type).toBe(Dialog);
  expect(tree.props.open).toBe(false);
  expect(jest.mocked(useQuery).mock.calls[0][1]).toMatchObject({ skip: true });
  function find(tree: ReactNode): ReactElement<Record<string, unknown>>[] {
    const result: ReactElement<Record<string, unknown>>[] = [];
    Children.forEach(tree, child => { if (isValidElement<Record<string, unknown>>(child)) result.push(child, ...find(child.props.children as ReactNode)); });
    return result;
  }
  const button = find(tree).find(element => element.type === IconButton)!;
  expect(button.props.onClick).toBe(onClose);
  expect(tree.props.onClose).toBe(onClose);
});
