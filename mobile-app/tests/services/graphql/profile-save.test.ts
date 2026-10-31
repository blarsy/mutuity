import { apolloClient } from "../../../src/services/graphql/client";
import { uploadListingImages } from "../../../src/services/images";
import { UpdateAccountProfileDocument } from "../../../src/services/graphql/operations.generated";
import { updateMyProfile } from "../../../src/services/graphql/profile";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn() } }));
jest.mock("../../../src/services/images", () => ({ uploadListingImages: jest.fn() }));

describe("updateMyProfile", () => {
  const accountId = "12345678-1234-1234-1234-123456789abc";
  const profileLinks = [{ type: "website" as const, label: "Updated link", url: "https://example.com/updated" }];
  const patch = {
    displayName: "Alice",
    location: { label: "Paris", latitude: 48.85, longitude: 2.35 },
    bio: "My bio",
    profileLinks
  };

  beforeEach(() => {
    jest.resetAllMocks();
    (apolloClient.mutate as jest.Mock).mockResolvedValue({
      data: { updateAccountById: { account: { id: accountId, ...patch, location: "Paris", latitude: 48.85, longitude: 2.35, avatarUrl: null } } }
    });
  });

  it("sends the declared top-level variables when saving an edited link", async () => {
    const profile = await updateMyProfile(accountId, patch);

    expect(apolloClient.mutate).toHaveBeenCalledWith({
      mutation: UpdateAccountProfileDocument,
      variables: {
        id: accountId,
        accountPatch: { displayName: "Alice", location: "Paris", latitude: 48.85, longitude: 2.35, bio: "My bio", profileLinks }
      }
    });
    expect(profile?.profileLinks).toEqual(profileLinks);
    expect(profile?.location).toEqual(patch.location);
    expect(uploadListingImages).not.toHaveBeenCalled();
  });

  it("uploads the avatar and includes its public URL in the patch", async () => {
    jest.mocked(uploadListingImages).mockResolvedValue(["https://example.com/avatar.jpg"]);

    await updateMyProfile(accountId, { ...patch, avatarUrl: "file:///avatar.jpg" });

    expect(uploadListingImages).toHaveBeenCalledWith(["file:///avatar.jpg"]);
    expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
      variables: { id: accountId, accountPatch: expect.objectContaining({ avatarUrl: "https://example.com/avatar.jpg" }) }
    }));
  });

  it("explicitly clears removed links, location and avatar", async () => {
    await updateMyProfile(accountId, { ...patch, profileLinks: [], location: null, avatarUrl: null });

    expect(apolloClient.mutate).toHaveBeenCalledWith(expect.objectContaining({
      variables: {
        id: accountId,
        accountPatch: { displayName: "Alice", bio: "My bio", profileLinks: [], location: null, latitude: null, longitude: null, avatarUrl: null }
      }
    }));
    expect(uploadListingImages).not.toHaveBeenCalled();
  });

  it("propagates mutation errors", async () => {
    const error = new Error("Save failed");
    (apolloClient.mutate as jest.Mock).mockRejectedValue(error);
    await expect(updateMyProfile(accountId, patch)).rejects.toBe(error);
  });
});