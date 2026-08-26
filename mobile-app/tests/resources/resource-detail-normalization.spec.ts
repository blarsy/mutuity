import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn()
  }
}));

import { apolloClient } from "../../src/services/graphql/client";
import { fetchResourceById } from "../../src/services/graphql/resources";

describe("fetchResourceById normalization", () => {
  it("uses the account display name when it is present", async () => {
    const mockedQuery = apolloClient.query as jest.Mock;
    mockedQuery.mockResolvedValue({
      data: {
        resourceById: {
          id: "c58e5bba-817a-45eb-b044-8442a7133bfd",
          title: "Desk lamp",
          description: "A bright desk lamp",
          creatorAccountId: "11111111-1111-4111-8111-111111111111",
          createdAt: "2025-01-01T00:00:00Z",
          expiresAt: null,
          isActive: true,
          isProduct: true,
          isService: false,
          canBeTakenAway: true,
          canBeDelivered: false,
          canBeExchanged: true,
          canBeGiven: false,
          location: "Montreal",
          latitude: 45.5,
          longitude: -73.6,
          defaultTokenAmount: 10,
          categoryLabels: ["Lighting"],
          imageUrls: [],
          accountByCreatorAccountId: {
            id: "11111111-1111-4111-8111-111111111111",
            displayName: "Alice Example",
            externalSubject: "11111111-1111-4111-8111-111111111111",
            avatarUrl: null
          }
        }
      }
    });

    const result = await fetchResourceById("c58e5bba-817a-45eb-b044-8442a7133bfd");

    expect(result?.creatorDisplayName).toBe("Alice Example");
  });

  it("does not show a raw UUID in place of an account name", async () => {
    const mockedQuery = apolloClient.query as jest.Mock;
    mockedQuery.mockResolvedValue({
      data: {
        resourceById: {
          id: "c58e5bba-817a-45eb-b044-8442a7133bfd",
          title: "Desk lamp",
          description: "A bright desk lamp",
          creatorAccountId: "11111111-1111-4111-8111-111111111111",
          createdAt: "2025-01-01T00:00:00Z",
          expiresAt: null,
          isActive: true,
          isProduct: true,
          isService: false,
          canBeTakenAway: true,
          canBeDelivered: false,
          canBeExchanged: true,
          canBeGiven: false,
          location: "Montreal",
          latitude: 45.5,
          longitude: -73.6,
          defaultTokenAmount: 10,
          categoryLabels: ["Lighting"],
          imageUrls: [],
          accountByCreatorAccountId: {
            id: "11111111-1111-4111-8111-111111111111",
            displayName: null,
            externalSubject: "11111111-1111-4111-8111-111111111111",
            avatarUrl: null
          }
        }
      }
    });

    const result = await fetchResourceById("c58e5bba-817a-45eb-b044-8442a7133bfd");

    expect(result?.creatorDisplayName).toBe("Unknown account");
  });

  it("ignores a UUID-like display name and falls back to a safe label", async () => {
    const mockedQuery = apolloClient.query as jest.Mock;
    mockedQuery.mockResolvedValue({
      data: {
        resourceById: {
          id: "c58e5bba-817a-45eb-b044-8442a7133bfd",
          title: "Desk lamp",
          description: "A bright desk lamp",
          creatorAccountId: "11111111-1111-4111-8111-111111111111",
          createdAt: "2025-01-01T00:00:00Z",
          expiresAt: null,
          isActive: true,
          isProduct: true,
          isService: false,
          canBeTakenAway: true,
          canBeDelivered: false,
          canBeExchanged: true,
          canBeGiven: false,
          location: "Montreal",
          latitude: 45.5,
          longitude: -73.6,
          defaultTokenAmount: 10,
          categoryLabels: ["Lighting"],
          imageUrls: [],
          accountByCreatorAccountId: {
            id: "11111111-1111-4111-8111-111111111111",
            displayName: "11111111-1111-4111-8111-111111111111",
            externalSubject: "11111111-1111-4111-8111-111111111111",
            avatarUrl: null
          }
        }
      }
    });

    const result = await fetchResourceById("c58e5bba-817a-45eb-b044-8442a7133bfd");

    expect(result?.creatorDisplayName).toBe("Unknown account");
  });
});
