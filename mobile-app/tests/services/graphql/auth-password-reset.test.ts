import { apolloClient } from "../../../src/services/graphql/client";
import { requestPasswordReset } from "../../../src/services/graphql/auth";
import { REQUEST_PASSWORD_RESET_MUTATION } from "../../../src/services/graphql/operations";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn() } }));

describe("requestPasswordReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: { requestPasswordReset: { boolean: true } } });
  });

  it("submits the normalized identifier with the reset-token lifetime and throttle", async () => {
    await requestPasswordReset("  Person@Example.com ");

    expect(apolloClient.mutate).toHaveBeenCalledWith({
      mutation: REQUEST_PASSWORD_RESET_MUTATION,
      variables: {
        input: {
          identifier: "person@example.com",
          resetTtlMs: 60 * 60 * 1000,
          throttleMs: 60 * 1000
        }
      }
    });
  });

  it("propagates failed recovery requests to the screen", async () => {
    const failure = new Error("request failed");
    (apolloClient.mutate as jest.Mock).mockRejectedValue(failure);

    await expect(requestPasswordReset("person@example.com")).rejects.toBe(failure);
  });
});
