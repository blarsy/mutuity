import { logBackofficeError, logBackofficeInfo } from "../../src/features/logging/operationalLogger";
import { apolloClient } from "../../src/services/graphql/client";

jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: {
    mutate: jest.fn()
  }
}));

type ApolloLike = {
  mutate: jest.Mock;
};

function mockedApollo() {
  return apolloClient as unknown as ApolloLike;
}

describe("backoffice operational logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes backoffice logs through writeOperationalLog with component and context", async () => {
    mockedApollo().mutate.mockResolvedValueOnce({
      data: {
        writeOperationalLog: {
          uuid: "log-1"
        }
      }
    });

    await expect(
      logBackofficeInfo("Loaded admin dashboard", {
        context: "admin_dashboard",
        accountId: "00000000-0000-0000-0000-000000000123",
        metadata: {
          panel: "overview"
        }
      })
    ).resolves.toBeUndefined();

    expect(mockedApollo().mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          level: "info",
          component: "backoffice_web",
          message: "Loaded admin dashboard",
          context: "admin_dashboard",
          accountId: "00000000-0000-0000-0000-000000000123",
          metadata: {
            panel: "overview"
          }
        }
      })
    );
  });

  it("falls back to console diagnostics when mutation persistence fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const failure = new Error("network down");

    mockedApollo().mutate.mockRejectedValueOnce(failure);

    await expect(
      logBackofficeError("Claim read marker failed", failure, {
        context: "claim_thread",
        accountId: "00000000-0000-0000-0000-000000000123",
        metadata: {
          claimId: "claim-1"
        }
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[operational-log] frontend fallback",
      expect.objectContaining({
        input: expect.objectContaining({
          level: "error",
          context: "claim_thread",
          accountId: "00000000-0000-0000-0000-000000000123"
        }),
        error: expect.objectContaining({
          message: "network down"
        })
      })
    );

    consoleSpy.mockRestore();
  });
});
