import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { apolloClient } from "../../../src/services/graphql/client";
import { authenticateWithPassword, requestPasswordReset } from "../../../src/services/graphql/auth";
import { isPasswordResetRequiredError } from "../../../src/services/auth/errors";
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

  it("preserves the migrated-account error from Apollo for the login UI", async () => {
    const failure = new CombinedGraphQLErrors({
      errors: [{ message: "Password reset is required before sign in.", extensions: { code: "PASSWORD_RESET_REQUIRED" } }]
    });
    (apolloClient.mutate as jest.Mock).mockRejectedValue(failure);

    await expect(authenticateWithPassword({ email: "person@example.com", password: "old-password" })).rejects.toBe(failure);
    expect(isPasswordResetRequiredError(failure)).toBe(true);
  });

  it("does not identify password-reset requirements by message alone", () => {
    expect(isPasswordResetRequiredError(new Error("PASSWORD_RESET_REQUIRED"))).toBe(false);
    expect(isPasswordResetRequiredError(undefined)).toBe(false);
  });
});
