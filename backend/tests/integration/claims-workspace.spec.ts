import {
  TEST_BACKEND_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";

jest.setTimeout(30000);

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function gqlRequest<T>(
  cookie: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie
    },
    body: JSON.stringify({ query, variables })
  });

  const json = (await response.json()) as GraphqlResponse<T>;
  expect(response.status).toBe(200);
  expect(json.errors).toBeUndefined();
  return json.data as T;
}

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

const ALL_CLAIMS_QUERY = `
  query WorkspaceClaims {
    allNeedClaims(first: 50) {
      nodes {
        id
        needId
        claimerAccountId
        status
        createdAt
        updatedAt
        needByNeedId {
          id
          creatorAccountId
        }
      }
    }
  }
`;

describe("claims-workspace: visibility and ordering", () => {
  it("claimer sees their sent claims and need creator sees their received claims", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `wks-creator-${stamp}@example.com`,
      displayName: "Workspace Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `wks-claimer-${stamp}@example.com`,
      displayName: "Workspace Claimer"
    });
    const outsider = await seedDemoAccount({
      identifier: `wks-outsider-${stamp}@example.com`,
      displayName: "Outsider"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `WKS Need ${stamp}`,
      proposedTopesAmount: 100
    });

    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Workspace test claim"
    });

    // Claimer sees their own claim
    const claimerCookie = await loginAs(claimer);
    const claimerData = await gqlRequest<{
      allNeedClaims: { nodes: Array<{ id: string; claimerAccountId: string }> };
    }>(claimerCookie, ALL_CLAIMS_QUERY);

    const claimerClaims = claimerData.allNeedClaims.nodes;
    expect(claimerClaims.some(c => c.id === claim.id)).toBe(true);
    expect(claimerClaims.every(c => c.claimerAccountId === claimer.accountId)).toBe(true);

    // Creator sees the claim on their need
    const creatorCookie = await loginAs(creator);
    const creatorData = await gqlRequest<{
      allNeedClaims: {
        nodes: Array<{
          id: string;
          needByNeedId: { creatorAccountId: string };
        }>;
      };
    }>(creatorCookie, ALL_CLAIMS_QUERY);

    const creatorClaims = creatorData.allNeedClaims.nodes;
    expect(creatorClaims.some(c => c.id === claim.id)).toBe(true);

    // Outsider cannot see the claim
    const outsiderCookie = await loginAs(outsider);
    const outsiderData = await gqlRequest<{
      allNeedClaims: { nodes: Array<{ id: string }> };
    }>(outsiderCookie, ALL_CLAIMS_QUERY);

    expect(outsiderData.allNeedClaims.nodes.every(c => c.id !== claim.id)).toBe(true);
  });

  it("claims are returned with updatedAt and createdAt for client-side ordering", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `wks-ord-creator-${stamp}@example.com`
    });
    const claimer = await seedDemoAccount({
      identifier: `wks-ord-claimer-${stamp}@example.com`
    });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const cookie = await loginAs(claimer);
    const data = await gqlRequest<{
      allNeedClaims: {
        nodes: Array<{
          id: string;
          createdAt: string;
          updatedAt: string;
        }>;
      };
    }>(cookie, ALL_CLAIMS_QUERY);

    const found = data.allNeedClaims.nodes.find(c => c.id === claim.id);
    expect(found).toBeTruthy();
    expect(found?.createdAt).toBeTruthy();
    expect(found?.updatedAt).toBeTruthy();
    // updatedAt is a valid ISO timestamp
    expect(new Date(found!.updatedAt).getTime()).toBeGreaterThan(0);
  });

  it("multiple claims across needs are all returned in a single query", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `wks-multi-creator-${stamp}@example.com`
    });
    const claimer = await seedDemoAccount({
      identifier: `wks-multi-claimer-${stamp}@example.com`
    });

    const needA = await seedNeed({ creatorAccount: creator, title: `Multi A ${stamp}`, proposedTopesAmount: 0 });
    const needB = await seedNeed({ creatorAccount: creator, title: `Multi B ${stamp}`, proposedTopesAmount: 0 });
    const claimA = await seedNeedClaim({ needId: needA.id, claimerAccount: claimer });
    const claimB = await seedNeedClaim({ needId: needB.id, claimerAccount: claimer });

    const cookie = await loginAs(claimer);
    const data = await gqlRequest<{
      allNeedClaims: { nodes: Array<{ id: string }> };
    }>(cookie, ALL_CLAIMS_QUERY);

    const ids = data.allNeedClaims.nodes.map(c => c.id);
    expect(ids).toContain(claimA.id);
    expect(ids).toContain(claimB.id);
  });

  it("claims with different statuses are all readable (open, withdrawn, declined, settled)", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `wks-statuses-creator-${stamp}@example.com`
    });
    const claimer = await seedDemoAccount({
      identifier: `wks-statuses-claimer-${stamp}@example.com`
    });

    const needOpen = await seedNeed({ creatorAccount: creator, title: `Open ${stamp}`, proposedTopesAmount: 0 });
    const needWithdrawn = await seedNeed({ creatorAccount: creator, title: `Withdrawn ${stamp}`, proposedTopesAmount: 0 });
    const needDeclined = await seedNeed({ creatorAccount: creator, title: `Declined ${stamp}`, proposedTopesAmount: 0 });

    const claimOpen = await seedNeedClaim({ needId: needOpen.id, claimerAccount: claimer, status: "open" });
    const claimWithdrawn = await seedNeedClaim({ needId: needWithdrawn.id, claimerAccount: claimer, status: "withdrawn" });
    const claimDeclined = await seedNeedClaim({ needId: needDeclined.id, claimerAccount: claimer, status: "declined" });

    const cookie = await loginAs(claimer);
    const data = await gqlRequest<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(cookie, ALL_CLAIMS_QUERY);

    const nodes = data.allNeedClaims.nodes;
    expect(nodes.find(c => c.id === claimOpen.id)?.status).toBe("OPEN");
    expect(nodes.find(c => c.id === claimWithdrawn.id)?.status).toBe("WITHDRAWN");
    expect(nodes.find(c => c.id === claimDeclined.id)?.status).toBe("DECLINED");
  });
});
