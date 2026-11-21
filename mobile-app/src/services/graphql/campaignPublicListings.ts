import type { NeedSearchListing, ResourceSearchListing } from "../../components/listings/SearchListingCards";
import { apolloClient } from "./client";
import {
  PUBLIC_CAMPAIGN_LISTING_LINKS_QUERY,
  PUBLIC_CAMPAIGN_NEED_CARD_QUERY,
  PUBLIC_CAMPAIGN_RESOURCE_CARD_QUERY
} from "./operations";

export interface CampaignPublicListings {
  resources: ResourceSearchListing[];
  needs: NeedSearchListing[];
}

interface CardNode {
  id: string;
  title: string;
  createdAt: string | null;
  imageUrls: (string | null)[] | null;
  isActive: boolean;
  expiresAt: string | null;
  accountByCreatorAccountId: { displayName: string | null } | null;
}

function visible(node: CardNode | null | undefined): node is CardNode {
  return !!node && node.isActive && (!node.expiresAt || Date.parse(node.expiresAt) > Date.now());
}

function metadata(node: CardNode) {
  return {
    id: node.id,
    title: node.title,
    createdAt: node.createdAt,
    creatorDisplayName: node.accountByCreatorAccountId?.displayName ?? null,
    imageUrls: (node.imageUrls ?? []).filter((url): url is string => !!url)
  };
}

// Limit concurrent requests while still loading all listings rather than a bounded search page.
async function mapInBatches<T, R>(items: T[], map: (item: T) => Promise<R>): Promise<R[]> {
  const result: R[] = [];
  for (let index = 0; index < items.length; index += 8) {
    result.push(...await Promise.all(items.slice(index, index + 8).map(map)));
  }
  return result;
}

export async function fetchCampaignPublicListings(campaignId: string): Promise<CampaignPublicListings> {
  const { data } = await apolloClient.query<{
    publicCampaignResourceLinks: { nodes: { campaignId: string; resourceId: string }[] } | null;
    publicCampaignNeedLinks: { nodes: { campaignId: string; needId: string }[] } | null;
  }>({ query: PUBLIC_CAMPAIGN_LISTING_LINKS_QUERY, fetchPolicy: "network-only" });

  if (!data?.publicCampaignResourceLinks || !data.publicCampaignNeedLinks) {
    throw new Error("Campaign listing links unavailable");
  }

  const resourceIds = [...new Set(data.publicCampaignResourceLinks.nodes
    .filter((link) => link.campaignId === campaignId).map((link) => link.resourceId))];
  const needIds = [...new Set(data.publicCampaignNeedLinks.nodes
    .filter((link) => link.campaignId === campaignId).map((link) => link.needId))];

  const [resources, needs] = await Promise.all([
    mapInBatches(resourceIds, async (id): Promise<ResourceSearchListing | null> => {
      const { data: result } = await apolloClient.query<{
        resourceById: (CardNode & { canBeGiven: boolean; canBeExchanged: boolean }) | null;
      }>({ query: PUBLIC_CAMPAIGN_RESOURCE_CARD_QUERY, variables: { id }, fetchPolicy: "network-only" });
      const node = result?.resourceById;
      return visible(node) ? { ...metadata(node), canBeGifted: node.canBeGiven, canBeExchanged: node.canBeExchanged } : null;
    }),
    mapInBatches(needIds, async (id): Promise<NeedSearchListing | null> => {
      const { data: result } = await apolloClient.query<{
        needById: (CardNode & { proposedTopesAmount: number | null }) | null;
      }>({ query: PUBLIC_CAMPAIGN_NEED_CARD_QUERY, variables: { id }, fetchPolicy: "network-only" });
      const node = result?.needById;
      return visible(node) ? { ...metadata(node), proposedTokenAmount: node.proposedTopesAmount } : null;
    })
  ]);

  return {
    resources: resources.filter((item): item is ResourceSearchListing => item !== null),
    needs: needs.filter((item): item is NeedSearchListing => item !== null)
  };
}