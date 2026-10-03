import type { CampaignNeedStatus } from "../../components/campaign/CampaignNeedStatusChip";
import type { MockApolloParameters } from "./mockApollo";
import { MOCK_ACCOUNT_ID } from "./mockAuth";

export type CampaignTriageKind = "need" | "resource";
export type CampaignTriagePhase =
  | "mixed"
  | "pending"
  | "accepted"
  | "rejected"
  | "empty"
  | "loading"
  | "queryError"
  | "accepting"
  | "rejecting"
  | "moderationError";

export const TRIAGE_CAMPAIGN_ID = "22222222-2222-4222-8222-222222222222";
export const TRIAGE_MUTATION_ERROR = "This campaign is no longer open for moderation. Please refresh and try again.";

type TriageNode = {
  campaignId: string;
  needId?: string;
  resourceId?: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  actedByAccountId: string | null;
  campaignByCampaignId: { id: string; title: string };
  needByNeedId?: {
    id: string;
    title: string;
    location: string;
    intensity: string;
    proposedTopesAmount: number | null;
  };
  resourceByResourceId?: {
    id: string;
    title: string;
    location: string | null;
    defaultTokenAmount: number | null;
  };
};

const needs = [
  { title: "Help transport donated furniture", location: "Brussels, Saint-Gilles", intensity: "leg_up", amount: 20 },
  { title: "Volunteers for the neighbourhood meal", location: "Brussels, Ixelles", intensity: "commitment", amount: 35 },
  { title: "Share gardening skills at the community garden", location: "Brussels, Forest", intensity: "sharing", amount: 0 },
  { title: "Specialist help to restore a community workshop", location: "Brussels, Schaerbeek", intensity: "rare_contribution", amount: null }
];

const resources = [
  { title: "Cargo bicycle for local deliveries", location: "Brussels, Saint-Gilles", amount: 15 },
  { title: "Folding tables for the neighbourhood meal", location: "Brussels, Ixelles", amount: 10 },
  { title: "Gardening tools to share", location: "Brussels, Forest", amount: 0 },
  { title: "Workshop space for community projects", location: null, amount: null }
];

/** A fresh, mutable mock backend per mounted story; refetch reflects triage decisions. */
export function createCampaignTriageMocks(kind: CampaignTriageKind, phase: CampaignTriagePhase): MockApolloParameters {
  const isNeed = kind === "need";
  const queryName = isNeed ? "CampaignNeedTriage" : "CampaignResourceTriage";
  const acceptName = isNeed ? "AcceptCampaignNeed" : "AcceptCampaignResource";
  const rejectName = isNeed ? "RejectCampaignNeed" : "RejectCampaignResource";
  const connectionName = isNeed ? "allCampaignNeeds" : "allCampaignResources";
  const itemIdKey = isNeed ? "needId" : "resourceId";
  const payloadKey = isNeed ? "campaignNeed" : "campaignResource";
  const mixedStatuses: CampaignNeedStatus[] = ["PENDING", "PENDING", "ACCEPTED", "REJECTED"];

  let nodes: TriageNode[] = phase === "empty" ? [] : needs.map((need, index) => {
    const id = `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`;
    const campaignId = index < 2 ? TRIAGE_CAMPAIGN_ID : "44444444-4444-4444-8444-444444444444";
    const status: CampaignNeedStatus = phase === "mixed" ? mixedStatuses[index]!
      : phase === "accepted" ? "ACCEPTED"
      : phase === "rejected" ? "REJECTED" : "PENDING";
    const resource = resources[index]!;

    return {
      campaignId,
      [itemIdKey]: id,
      status,
      createdAt: `2026-10-0${3 - Math.floor(index / 2)}T09:00:00.000Z`,
      actedAt: status === "PENDING" ? null : "2026-10-03T11:30:00.000Z",
      actedByAccountId: status === "PENDING" ? null : MOCK_ACCOUNT_ID,
      campaignByCampaignId: {
        id: campaignId,
        title: index < 2 ? "Neighbourhood solidarity week" : "Community garden and workshop"
      },
      ...(isNeed ? {
        needByNeedId: {
          id, title: need.title, location: need.location, intensity: need.intensity,
          proposedTopesAmount: need.amount
        }
      } : {
        resourceByResourceId: {
          id, title: resource.title, location: resource.location, defaultTokenAmount: resource.amount
        }
      })
    };
  });

  const moderate = (variables: Record<string, unknown>, status: CampaignNeedStatus, field: string) => {
    const node = nodes.find(candidate => candidate.campaignId === variables.campaignId && candidate[itemIdKey] === variables[itemIdKey]);
    if (!node) throw new Error("The campaign item was not found.");
    const updated = { ...node, status, actedAt: "2026-10-03T12:00:00.000Z", actedByAccountId: MOCK_ACCOUNT_ID };
    nodes = nodes.map(candidate => candidate === node ? updated : candidate);
    return { [field]: { [payloadKey]: updated } };
  };

  return {
    operations: {
      [queryName]: variables => ({
        [connectionName]: {
          nodes: nodes.filter(node => !variables.campaignId || node.campaignId === variables.campaignId)
        }
      }),
      [acceptName]: variables => moderate(variables, "ACCEPTED", isNeed ? "acceptCampaignNeed" : "acceptCampaignResource"),
      [rejectName]: variables => moderate(variables, "REJECTED", isNeed ? "rejectCampaignNeed" : "rejectCampaignResource")
    },
    loadingOperations: phase === "loading" ? [queryName]
      : phase === "accepting" ? [acceptName]
      : phase === "rejecting" ? [rejectName] : [],
    errorOperations: phase === "queryError" ? { [queryName]: "Unable to load the moderation queue." }
      : phase === "moderationError" ? { [acceptName]: TRIAGE_MUTATION_ERROR, [rejectName]: TRIAGE_MUTATION_ERROR } : {}
  };
}