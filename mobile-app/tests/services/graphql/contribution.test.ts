import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { apolloClient } from "../../../src/services/graphql/client";
import { giftTokens, getGiftErrorMessage } from "../../../src/services/graphql/contribution";
import { GiftTokensDocument } from "../../../src/services/graphql/operations.generated";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn() } }));

describe("giftTokens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: { giftTokens: { tokenMovement: { id: "gift" } } } });
  });

  it.each([["  Thank you!  ", "Thank you!"], ["  ", null]])("normalizes the optional message %j", async (message, expected) => {
    await giftTokens("recipient", 12, message!);
    expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
      mutation: GiftTokensDocument,
      variables: { input: { recipientAccountId: "recipient", amount: 12, message: expected } }
    }));
  });

  it("invalidates the balance and history only after a successful transfer", async () => {
    await giftTokens("recipient", 12, "");
    const { update } = (apolloClient.mutate as jest.Mock).mock.calls[0][0];
    const cache = { evict: jest.fn() };
    update(cache, { data: null });
    expect(cache.evict).not.toHaveBeenCalled();
    update(cache, { data: { giftTokens: { tokenMovement: { id: "gift" } } } });
    expect(cache.evict).toHaveBeenCalledWith({ id: "ROOT_QUERY", fieldName: "currentTokenBalance" });
    expect(cache.evict).toHaveBeenCalledWith({ id: "ROOT_QUERY", fieldName: "allTokenMovements" });
  });

  it("propagates transfer failures without retrying automatically", async () => {
    const error = new Error("failed");
    (apolloClient.mutate as jest.Mock).mockRejectedValue(error);
    await expect(giftTokens("recipient", 12, "")).rejects.toBe(error);
    expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
  });
});

describe("getGiftErrorMessage", () => {
  it("uses sanitized GraphQL errors from Apollo 4", () => {
    const error = new CombinedGraphQLErrors({ errors: [{ message: "Insufficient token balance." }] });
    expect(getGiftErrorMessage(error, "fallback", "sign in")).toBe("Insufficient token balance.");
  });

  it("localizes authentication failures", () => {
    const error = new CombinedGraphQLErrors({ errors: [{ message: "Unauthorized", extensions: { code: "UNAUTHENTICATED" } }] });
    expect(getGiftErrorMessage(error, "fallback", "sign in")).toBe("sign in");
  });

  it("does not expose network or unexpected error details", () => {
    expect(getGiftErrorMessage(new Error("private details"), "fallback", "sign in")).toBe("fallback");
  });
});