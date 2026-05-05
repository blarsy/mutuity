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
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
};

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function gqlRaw<T>(
  cookie: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<GraphqlResponse<T>> {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie
    },
    body: JSON.stringify({ query, variables })
  });
  expect(response.status).toBe(200);
  return (await response.json()) as GraphqlResponse<T>;
}

async function gqlOk<T>(
  cookie: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const json = await gqlRaw<T>(cookie, query, variables);
  expect(json.errors).toBeUndefined();
  return json.data as T;
}

const CANCEL_CLAIM_MUTATION = `
  mutation CancelNeedClaim($input: CancelNeedClaimInput!) {
    cancelNeedClaim(input: $input) {
      needClaim {
        id
        status
      }
    }
  }
`;

const DECLINE_CLAIM_MUTATION = `
  mutation DeclineNeedClaim($input: DeclineNeedClaimInput!) {
    declineNeedClaim(input: $input) {
      needClaim {
        id
        status
      }
    }
  }
`;

const MY_NOTIFICATIONS_QUERY = `
  query MyClaimNotifications {
    allNeedClaimNotifications(first: 30) {
      nodes {
        eventType
        needClaimId
      }
    }
  }
`;

describe("claims-settlement: cancel (claimer-side withdrawal)", () => {
  it("claimer can cancel their own open claim, status becomes WITHDRAWN", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `cancel-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `cancel-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const claimerCookie = await loginAs(claimer);
    const data = await gqlOk<{
      cancelNeedClaim: { needClaim: { id: string; status: string } };
    }>(claimerCookie, CANCEL_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(data.cancelNeedClaim.needClaim.status).toBe("WITHDRAWN");
  });

  it("need creator cannot cancel someone else's claim", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `cancel-creator2-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `cancel-claimer2-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const creatorCookie = await loginAs(creator);
    const json = await gqlRaw(creatorCookie, CANCEL_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(json.errors).toBeDefined();
    expect(json.errors![0].message).toBe("Only the claimer can cancel this claim");
  });

  it("cancelling an already-withdrawn claim is idempotent", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `cancel-idem-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `cancel-idem-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer, status: "withdrawn" });

    const claimerCookie = await loginAs(claimer);
    const data = await gqlOk<{
      cancelNeedClaim: { needClaim: { id: string; status: string } };
    }>(claimerCookie, CANCEL_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(data.cancelNeedClaim.needClaim.status).toBe("WITHDRAWN");
  });

  it("cancellation sends a notification to the need creator", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `cancel-notify-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `cancel-notify-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const claimerCookie = await loginAs(claimer);
    await gqlOk(claimerCookie, CANCEL_CLAIM_MUTATION, { input: { needClaimId: claim.id } });

    const creatorCookie = await loginAs(creator);
    const notifData = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string }> };
    }>(creatorCookie, MY_NOTIFICATIONS_QUERY);

    expect(
      notifData.allNeedClaimNotifications.nodes.some(
        n => n.needClaimId === claim.id && n.eventType === "claim_withdrawn"
      )
    ).toBe(true);
  });
});

describe("claims-settlement: decline (creator-side)", () => {
  it("need creator can decline an open claim on their need, status becomes DECLINED", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `decline-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `decline-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const creatorCookie = await loginAs(creator);
    const data = await gqlOk<{
      declineNeedClaim: { needClaim: { id: string; status: string } };
    }>(creatorCookie, DECLINE_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(data.declineNeedClaim.needClaim.status).toBe("DECLINED");
  });

  it("claimer cannot decline their own claim", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `decline-creator2-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `decline-claimer2-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const claimerCookie = await loginAs(claimer);
    const json = await gqlRaw(claimerCookie, DECLINE_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(json.errors).toBeDefined();
    expect(json.errors![0].message).toBe("Only the need creator can decline this claim");
  });

  it("declining an already-declined claim is idempotent", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `decline-idem-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `decline-idem-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer, status: "declined" });

    const creatorCookie = await loginAs(creator);
    const data = await gqlOk<{
      declineNeedClaim: { needClaim: { id: string; status: string } };
    }>(creatorCookie, DECLINE_CLAIM_MUTATION, {
      input: { needClaimId: claim.id }
    });

    expect(data.declineNeedClaim.needClaim.status).toBe("DECLINED");
  });

  it("decline sends a notification to the claimer", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `decline-notify-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `decline-notify-claimer-${stamp}@example.com` });

    const need = await seedNeed({ creatorAccount: creator, proposedTopesAmount: 0 });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const creatorCookie = await loginAs(creator);
    await gqlOk(creatorCookie, DECLINE_CLAIM_MUTATION, { input: { needClaimId: claim.id } });

    const claimerCookie = await loginAs(claimer);
    const notifData = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string }> };
    }>(claimerCookie, MY_NOTIFICATIONS_QUERY);

    expect(
      notifData.allNeedClaimNotifications.nodes.some(
        n => n.needClaimId === claim.id && n.eventType === "claim_declined"
      )
    ).toBe(true);
  });
});


