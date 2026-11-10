import { apolloClient } from "../../../src/services/graphql/client";
import { uploadListingImages } from "../../../src/services/images";
import { createResourceForAccount, updateResourceById, type UpsertResourceInput } from "../../../src/services/graphql/resources";
import { updateMyProfile } from "../../../src/services/graphql/profile";
import { sendClaimMessage, sendResourceMessage, startNeedConversation, startResourceConversation } from "../../../src/services/graphql/chat";
import { createCampaignForAccount, updateCampaignById, type UpsertCampaignInput } from "../../../src/services/graphql/campaigns";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn(), query: jest.fn() } }));
jest.mock("../../../src/services/images", () => ({ uploadListingImages: jest.fn() }));

const local = "file:///picker/photo.jpg";
const hosted = "https://example.com/uploaded.jpg";
const resource: UpsertResourceInput = {
  title: "Resource", description: "Description", imageUrls: [local], defaultTokenAmount: 12,
  expiresAt: null, isProduct: true, isService: false, canBeTakenAway: true,
  canBeDelivered: false, canBeExchanged: true, canBeGifted: false,
  location: null, categoryCodes: [], campaignId: null
};
const campaign: UpsertCampaignInput = {
  title: "Campaign", description: "Description", imageUrl: local,
  startAt: "2026-01-01T00:00:00Z", endAt: "2026-02-01T00:00:00Z"
};

describe("cross-client image persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(uploadListingImages).mockImplementation(async uris => uris.map(uri => /^https?:\/\//i.test(uri) ? uri : hosted));
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: {} });
  });

  it.each(["create", "edit"])("uploads resource images before %s", async mode => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: { updateResourceById: { resource: { id: "", resourceCategoryAssignmentsByResourceId: { nodes: [] } } } } });
    if (mode === "create") await createResourceForAccount("account", resource);
    else await updateResourceById("resource", resource);
    expect(uploadListingImages).toHaveBeenCalledWith([local]);
    const variables = (apolloClient.mutate as jest.Mock).mock.calls[0][0].variables;
    expect((variables.input?.resource ?? variables.resourcePatch).imageUrls).toEqual([hosted]);
  });

  it.each(["create", "edit"])("uploads campaign images before %s", async mode => {
    if (mode === "create") await createCampaignForAccount("account", campaign);
    else await updateCampaignById("campaign", campaign);
    expect(uploadListingImages).toHaveBeenCalledWith([local]);
    const variables = (apolloClient.mutate as jest.Mock).mock.calls[0][0].variables;
    expect((variables.input ?? variables.campaignPatch).imageUrl).toBe(hosted);
  });

  it.each(["create", "edit"])("preserves campaign image URL semantics on %s", async mode => {
    const save = mode === "create"
      ? (input: UpsertCampaignInput) => createCampaignForAccount("account", input)
      : (input: UpsertCampaignInput) => updateCampaignById("campaign", input);
    await save({ ...campaign, imageUrl: "https://cdn.example.com/campaign.jpg" });
    await save({ ...campaign, imageUrl: null });
    await save({ ...campaign, imageUrl: undefined });
    const imageFields = (apolloClient.mutate as jest.Mock).mock.calls.map(([call]) => {
      const input = call.variables.input ?? call.variables.campaignPatch;
      return { present: Object.hasOwn(input, "imageUrl"), value: input.imageUrl };
    });
    expect(imageFields).toEqual([
      { present: true, value: "https://cdn.example.com/campaign.jpg" },
      { present: true, value: null },
      { present: false, value: undefined }
    ]);
    expect(uploadListingImages).not.toHaveBeenCalled();
  });

  it("uploads avatars and preserves omitted/null avatar semantics", async () => {
    const patch = { displayName: "Name", location: null, bio: "", profileLinks: [] };
    await updateMyProfile("account", { ...patch, avatarUrl: local });
    expect((apolloClient.mutate as jest.Mock).mock.calls[0][0].variables.accountPatch.avatarUrl).toBe(hosted);
    await updateMyProfile("account", patch);
    expect((apolloClient.mutate as jest.Mock).mock.calls[1][0].variables.accountPatch).not.toHaveProperty("avatarUrl");
    await updateMyProfile("account", { ...patch, avatarUrl: null });
    expect((apolloClient.mutate as jest.Mock).mock.calls[2][0].variables.accountPatch.avatarUrl).toBeNull();
    expect(uploadListingImages).toHaveBeenCalledTimes(1);
  });

  it.each([
    { send: sendResourceMessage, field: "sendResourceConversationMessage", message: "resourceMessage" },
    { send: sendClaimMessage, field: "sendClaimConversationMessage", message: "claimMessage" }
  ])("persists hosted chat attachments and returns hosted URLs ($field)", async ({ send, field, message }) => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: { [field]: { [message]: { id: "message", body: "Hi", createdAt: "date" } } } });
    const result = await send("conversation", "sender", "Hi", local);
    expect((apolloClient.mutate as jest.Mock).mock.calls[0][0].variables.input.pImageUrls).toEqual([hosted]);
    expect(result.imageUrls).toEqual([hosted]);
  });

  it("uploads attachments when starting either kind of conversation", async () => {
    (apolloClient.mutate as jest.Mock)
      .mockResolvedValueOnce({ data: { sendNeedMessage: { claimMessage: { conversationId: "need-chat" } } } })
      .mockResolvedValueOnce({ data: { sendResourceMessageDirect: { resourceMessage: { conversationId: "resource-chat" } } } });
    await startNeedConversation({ needId: "need", messageText: "Hi", imageUrl: local });
    await startResourceConversation({ resourceId: "resource", otherAccountId: "owner", messageText: "Hi", imageUrl: local });
    for (const [call] of (apolloClient.mutate as jest.Mock).mock.calls) {
      expect(call.variables.input.pImageUrls).toEqual([hosted]);
    }
  });

  it("never writes metadata if an upload fails", async () => {
    jest.mocked(uploadListingImages).mockRejectedValue(new Error("Upload failed"));
    const writes = [
      () => createResourceForAccount("account", resource),
      () => updateResourceById("resource", resource),
      () => updateMyProfile("account", { displayName: "Name", location: null, bio: "", avatarUrl: local }),
      () => createCampaignForAccount("account", campaign),
      () => updateCampaignById("campaign", campaign),
      () => sendResourceMessage("conversation", "sender", "Hi", local),
      () => sendClaimMessage("conversation", "sender", "Hi", local),
      () => startNeedConversation({ needId: "need", messageText: "Hi", imageUrl: local }),
      () => startResourceConversation({ resourceId: "resource", otherAccountId: "owner", messageText: "Hi", imageUrl: local })
    ];
    for (const write of writes) await expect(write()).rejects.toThrow("Upload failed");
    expect(apolloClient.mutate).not.toHaveBeenCalled();
  });
});