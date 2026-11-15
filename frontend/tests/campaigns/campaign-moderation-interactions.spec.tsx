import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import CampaignModerationPage from "../../src/pages/campaigns/[campaignId]/moderation";
import { CampaignModerationListingGroup } from "../../src/features/campaigns/CampaignModerationListingGroup";
import { CampaignListingPreviewDialog } from "../../src/features/campaigns/CampaignListingPreviewDialog";
import { CampaignListingRejectionDialog } from "../../src/features/campaigns/CampaignListingRejectionDialog";
import { NeedCard } from "../../src/features/ui/NeedCard";
import { ResourceCard } from "../../src/features/ui/ResourceCard";

// Shallow page harness: preserve its hook state between renders and inspect the real
// child props/callbacks without a browser or mounting unrelated editors/dialogs.
let mockStates: unknown[] = [];
let mockStateIndex = 0;
let mockNow = Date.parse("2026-11-14T12:00:00Z");
jest.mock("react", () => ({ ...jest.requireActual("react"),
  useMemo: (compute: () => unknown) => compute(),
  useState: (initial: unknown) => {
    const index = mockStateIndex++;
    if (!(index in mockStates)) mockStates[index] = typeof initial === "function" ? initial() : initial;
    return [mockStates[index], (next: unknown) => {
      mockStates[index] = typeof next === "function" ? next(mockStates[index]) : next;
    }];
  }
}));
jest.mock("next/router", () => ({ useRouter: () => ({ query: { campaignId: "campaign-1" }, push: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));
jest.mock("../../src/features/campaigns/campaignListingLifecycle", () => ({
  ...jest.requireActual("../../src/features/campaigns/campaignListingLifecycle"), useCampaignLifecycleNow: () => mockNow
}));
jest.mock("../../src/features/campaigns/CampaignListingPreviewDialog", () => ({ CampaignListingPreviewDialog: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));

type Element = ReactElement<Record<string, any>>;
function elements(tree: ReactNode): Element[] {
  const found: Element[] = [];
  Children.forEach(tree, child => {
    if (isValidElement<Record<string, any>>(child)) {
      found.push(child, ...elements(child.props.children));
    }
  });
  return found;
}
function renderPage() {
  mockStateIndex = 0;
  return elements(CampaignModerationPage());
}
function group(tree: Element[], kind: "need" | "resource") {
  return tree.find(element => element.type === CampaignModerationListingGroup
    && element.props.rejectedLabel === `moderationListings.rejected${kind === "need" ? "Needs" : "Resources"}`)!;
}
const creator = { id: "creator", displayName: "Neighbour", avatarUrl: "https://example.com/avatar.jpg" };
const card = { id: "listing", title: "Garden tools", description: "Public description", imageUrls: ["https://example.com/tools.jpg"],
  expiresAt: "2099-01-01", createdAt: "2026-11-01", accountByCreatorAccountId: creator,
  location: "Brussels", defaultTokenAmount: 50, proposedTopesAmount: 25, intensity: "SHARING" };
const pending = {
  campaignId: "campaign-1", needId: "need-1", resourceId: "resource-1", submissionId: "submission-1",
  submittedAt: "2026-11-13T10:00:00Z", createdAt: "2026-11-13T10:00:00Z", actedAt: null,
  status: "PENDING", isCurrent: true, rejectionNote: null,
  campaignByCampaignId: { id: "campaign-1", title: "Campaign", startAt: "2026-01-01", endAt: "2099-01-01" },
  needByNeedId: card, resourceByResourceId: card
};

describe("embedded campaign moderation page wiring", () => {
  let nodes: typeof pending[];
  let mutations: Record<string, jest.Mock>;
  let refetches: Record<string, jest.Mock>;
  beforeEach(() => {
    mockStates = [];
    mockNow = Date.parse("2026-11-14T12:00:00Z");
    nodes = [{ ...pending }];
    mutations = {};
    refetches = {};
    jest.mocked(useMutation).mockImplementation(document => {
      const definition = document.definitions.find(item => item.kind === "OperationDefinition");
      const name = definition?.kind === "OperationDefinition" ? definition.name!.value : "unknown";
      const mutation = mutations[name] ??= jest.fn().mockResolvedValue({});
      return [mutation, { loading: false }] as unknown as ReturnType<typeof useMutation>;
    });
    jest.mocked(useQuery).mockImplementation(document => {
      const definition = document.definitions.find(item => item.kind === "OperationDefinition");
      const name = definition?.kind === "OperationDefinition" ? definition.name!.value : "unknown";
      return { data: {
        campaignById: { id: "campaign-1", title: "Campaign", theme: "Theme", moderationStatus: "APPROVED",
          createdAt: "2026-01-01", startAt: "2026-01-01", airdropAt: "2026-11-01", endAt: "2099-01-01",
          rewardsMultiplier: 5, airdropAmount: 3500 },
        allCampaignNeeds: { nodes }, allCampaignResources: { nodes }
      }, loading: false, refetch: refetches[name] ??= jest.fn().mockResolvedValue({}) } as unknown as ReturnType<typeof useQuery>;
    });
  });

  it.each(["need", "resource"] as const)("includes unended rejected %ss while hiding noncurrent active, superseded and ended rows", kind => {
    nodes = [pending, { ...pending, submissionId: "rejected", status: "REJECTED", isCurrent: false },
      { ...pending, submissionId: "old", isCurrent: false },
      { ...pending, submissionId: "superseded", status: "SUPERSEDED" },
      { ...pending, submissionId: "ended", status: "REJECTED", campaignByCampaignId: { ...pending.campaignByCampaignId, endAt: "2020-01-01" } }];
    expect(group(renderPage(), kind).props.items.map((item: typeof pending) => item.submissionId)).toEqual(["submission-1", "rejected"]);
  });

  it.each(["need", "resource"] as const)("uses a standard %s card without in-card moderation actions and opens/closes its preview", kind => {
    const currentGroup = group(renderPage(), kind);
    const listingCard = currentGroup.props.renderCard(currentGroup.props.items[0]) as Element;
    expect(listingCard.type).toBe(kind === "need" ? NeedCard : ResourceCard);
    expect(listingCard.props).toMatchObject({ title: card.title, description: card.description,
      imageUrls: card.imageUrls, expiresAt: card.expiresAt, creatorName: creator.displayName,
      creatorImageUrl: creator.avatarUrl, tokenAmount: kind === "need" ? 25 : 50, cardMaxWidth: 480 });
    expect(listingCard.props.actions).toBeUndefined();
    listingCard.props.onClick();
    const preview = renderPage().find(element => element.type === CampaignListingPreviewDialog)!;
    expect(preview.props.listing).toEqual({ kind, id: `${kind}-1` });
    preview.props.onClose();
    expect(renderPage().find(element => element.type === CampaignListingPreviewDialog)!.props.listing).toBeNull();
  });

  it.each(["need", "resource"] as const)("moves a rejected %s optimistically, preserves it during refetch and rolls back failures", async kind => {
    const currentGroup = group(renderPage(), kind);
    const buttons = elements(currentGroup.props.renderActions(currentGroup.props.items[0]));
    buttons.find(element => element.props.children === (kind === "need" ? "triage.reject" : "resourceTriage.reject"))!.props.onClick();
    const rejection = renderPage().find(element => element.type === CampaignListingRejectionDialog)!;
    const name = kind === "need" ? "RejectCampaignNeed" : "RejectCampaignResource";
    let fail!: (error: Error) => void;
    mutations[name].mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const confirmation = rejection.props.onConfirm("Please clarify");
    expect(group(renderPage(), kind).props.items[0]).toMatchObject({ status: "REJECTED", actedAt: expect.any(String) });
    expect(mutations[name]).toHaveBeenCalledWith({ variables: { campaignId: "campaign-1", [`${kind}Id`]: `${kind}-1`,
      expectedSubmissionId: "submission-1", rejectionNote: "Please clarify" } });
    fail(new Error("Request failed"));
    await confirmation;
    expect(group(renderPage(), kind).props.items[0].status).toBe("PENDING");
    expect(renderPage().find(element => element.type === CampaignListingRejectionDialog)!.props.open).toBe(true);

    let finishRefetch!: () => void;
    refetches[kind === "need" ? "CampaignNeedTriage" : "CampaignResourceTriage"].mockImplementationOnce(
      () => new Promise<void>(resolve => { finishRefetch = resolve; })
    );
    const retry = renderPage().find(element => element.type === CampaignListingRejectionDialog)!.props.onConfirm(undefined);
    await Promise.resolve();
    expect(group(renderPage(), kind).props.items[0].status).toBe("REJECTED");
    nodes = [{ ...pending, status: "REJECTED", isCurrent: false }];
    finishRefetch();
    await retry;
    expect(group(renderPage(), kind).props.items[0].status).toBe("REJECTED");
    expect(renderPage().find(element => element.type === CampaignListingRejectionDialog)!.props.open).toBe(false);
  });

  it.each(["need", "resource"] as const)("refuses a stale %s decision if the campaign ended while the dialog was open", async kind => {
    const currentGroup = group(renderPage(), kind);
    elements(currentGroup.props.renderActions(currentGroup.props.items[0])).find(element => element.props.color === "error")!.props.onClick();
    const rejection = renderPage().find(element => element.type === CampaignListingRejectionDialog)!;
    pending.campaignByCampaignId.endAt = "2020-01-01";
    try {
      await rejection.props.onConfirm(undefined);
      expect(mutations[kind === "need" ? "RejectCampaignNeed" : "RejectCampaignResource"]).not.toHaveBeenCalled();
    } finally {
      pending.campaignByCampaignId.endAt = "2099-01-01";
    }
  });
});