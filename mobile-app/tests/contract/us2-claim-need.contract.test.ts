import { NeedClaimStatus } from "../../src/services/graphql/generated";
import { CLAIM_NEED_MUTATION } from "../../src/services/graphql/operations";
import { normalizeNeedClaimPayload } from "../../src/services/graphql/needs";

describe("US2 claim need contract", () => {
  it("exports the claim need mutation document", () => {
    expect(CLAIM_NEED_MUTATION).toBeDefined();
  });

  it("normalizes claim need payload", () => {
    const normalized = normalizeNeedClaimPayload({
      needClaim: {
        __typename: "NeedClaim",
        id: "00000000-0000-0000-0000-000000000099",
        needId: "00000000-0000-0000-0000-000000000055",
        status: NeedClaimStatus.Open,
        claimerAccountId: "123e4567-e89b-12d3-a456-426614174000"
      }
    });

    expect(normalized).toEqual({
      id: "00000000-0000-0000-0000-000000000099",
      needId: "00000000-0000-0000-0000-000000000055",
      status: NeedClaimStatus.Open,
      claimerAccountId: "123e4567-e89b-12d3-a456-426614174000"
    });
  });

  it("returns null when payload has no needClaim id", () => {
    const normalized = normalizeNeedClaimPayload({
      needClaim: {
        __typename: "NeedClaim",
        id: null,
        needId: "00000000-0000-0000-0000-000000000055",
        status: NeedClaimStatus.Open,
        claimerAccountId: "123e4567-e89b-12d3-a456-426614174000"
      }
    });

    expect(normalized).toBeNull();
  });
});
