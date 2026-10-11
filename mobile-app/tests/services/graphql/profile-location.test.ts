import { apolloClient } from "../../../src/services/graphql/client";
import { fetchMyProfile } from "../../../src/services/graphql/profile";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: { query: jest.fn() }
}));

describe("profile location normalization", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    { latitude: null, longitude: null, expected: { label: "Paris" } },
    { latitude: 0, longitude: 0, expected: { label: "Paris", latitude: 0, longitude: 0 } },
    { latitude: 48.85, longitude: null, expected: { label: "Paris", latitude: 48.85 } },
    { latitude: null, longitude: 2.35, expected: { label: "Paris", longitude: 2.35 } }
  ])("omits absent coordinates and preserves numeric ones: $latitude / $longitude", async ({ latitude, longitude, expected }) => {
    jest.mocked(apolloClient.query).mockResolvedValue({
      data: { accountById: { id: "account-1", location: "Paris", latitude, longitude } }
    });

    const profile = await fetchMyProfile("account-1");
    expect(profile?.location).toStrictEqual(expected);
  });
});