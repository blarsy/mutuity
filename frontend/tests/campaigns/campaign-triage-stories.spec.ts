import type { MockOperationResolver } from "../../src/stories/harness/mockApollo";
import { createCampaignTriageMocks, TRIAGE_CAMPAIGN_ID, TRIAGE_MUTATION_ERROR } from "../../src/stories/harness/campaignTriageMocks";

function resolve(resolver: MockOperationResolver | undefined, variables: Record<string, unknown> = {}) {
  if (!resolver) throw new Error("Missing story operation");
  return typeof resolver === "function" ? resolver(variables) : resolver;
}

type Node = {
  campaignId: string;
  needId?: string;
  resourceId?: string;
  status: string;
  actedAt: string | null;
  actedByAccountId: string | null;
};

describe.each(["need", "resource"] as const)("%s triage story mocks", kind => {
  const suffix = kind === "need" ? "Need" : "Resource";
  const queryName = `Campaign${suffix}Triage`;
  const connectionName = kind === "need" ? "allCampaignNeeds" : "allCampaignResources";
  const idKey = kind === "need" ? "needId" : "resourceId";
  const getNodes = (mocks: ReturnType<typeof createCampaignTriageMocks>, variables = {}) => {
    const data = resolve(mocks.operations?.[queryName], variables);
    return (data[connectionName] as { nodes: Node[] }).nodes;
  };

  it("populates the default story with pending, accepted and rejected items", () => {
    const nodes = getNodes(createCampaignTriageMocks(kind, "mixed"));
    expect(nodes.map(node => node.status)).toEqual(["PENDING", "PENDING", "ACCEPTED", "REJECTED"]);
    expect(nodes[0]?.actedAt).toBeNull();
    expect(nodes[2]?.actedAt).not.toBeNull();
  });

  it.each(["pending", "accepted", "rejected"] as const)("populates the %s phase", phase => {
    const nodes = getNodes(createCampaignTriageMocks(kind, phase));
    expect(nodes).toHaveLength(4);
    expect(nodes.every(node => node.status === phase.toUpperCase())).toBe(true);
  });

  it("honours campaign filtering", () => {
    const nodes = getNodes(createCampaignTriageMocks(kind, "mixed"), { campaignId: TRIAGE_CAMPAIGN_ID });
    expect(nodes).toHaveLength(2);
    expect(nodes.every(node => node.campaignId === TRIAGE_CAMPAIGN_ID)).toBe(true);
  });

  it.each(["Accept", "Reject"])("persists an %s decision after refetch without leaking into another story", action => {
    const mocks = createCampaignTriageMocks(kind, "pending");
    const freshMocks = createCampaignTriageMocks(kind, "pending");
    const node = getNodes(mocks)[0]!;
    const response = resolve(mocks.operations?.[`${action}Campaign${suffix}`], {
      campaignId: node.campaignId, [idKey]: node[idKey]
    });
    expect(response).toHaveProperty(`${action.toLowerCase()}Campaign${suffix}`);
    expect(getNodes(mocks)[0]).toMatchObject({
      status: action === "Accept" ? "ACCEPTED" : "REJECTED",
      actedAt: expect.any(String), actedByAccountId: expect.any(String)
    });
    expect(getNodes(freshMocks)[0]?.status).toBe("PENDING");
  });

  it("provides empty, loading, query error and mutation-in-flight states", () => {
    expect(getNodes(createCampaignTriageMocks(kind, "empty"))).toEqual([]);
    expect(createCampaignTriageMocks(kind, "loading").loadingOperations).toEqual([queryName]);
    expect(createCampaignTriageMocks(kind, "queryError").errorOperations).toHaveProperty(queryName);
    expect(createCampaignTriageMocks(kind, "accepting").loadingOperations).toEqual([`AcceptCampaign${suffix}`]);
    expect(createCampaignTriageMocks(kind, "rejecting").loadingOperations).toEqual([`RejectCampaign${suffix}`]);
  });

  it("fails both moderation actions without changing the pending fixture", () => {
    const mocks = createCampaignTriageMocks(kind, "moderationError");
    expect(mocks.errorOperations).toEqual({
      [`AcceptCampaign${suffix}`]: TRIAGE_MUTATION_ERROR,
      [`RejectCampaign${suffix}`]: TRIAGE_MUTATION_ERROR
    });
    expect(getNodes(mocks).every(node => node.status === "PENDING")).toBe(true);
  });
});