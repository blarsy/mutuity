import { sendNeedThreadMessage } from "../../src/features/chat/needThreadMessaging";

describe("need thread messaging", () => {
  const message = { needId: "need", body: "Hello", imageUrls: ["https://example.com/image.jpg"] };
  const sends = () => ({
    conversation: jest.fn().mockResolvedValue("existing"),
    claim: jest.fn().mockResolvedValue("created-for-claim"),
    publicNeed: jest.fn().mockResolvedValue("created-public")
  });

  it("replies by conversation ID even when no claim is linked (including owner replies)", async () => {
    const send = sends();
    await expect(sendNeedThreadMessage({ ...message, conversationId: "existing" }, send)).resolves.toBe("existing");
    expect(send.conversation).toHaveBeenCalledWith({ conversationId: "existing", body: message.body, imageUrls: message.imageUrls });
    expect(send.claim).not.toHaveBeenCalled();
    expect(send.publicNeed).not.toHaveBeenCalled();
  });

  it("uses the claim-authorized path for a workspace draft, for either participant and any claim status", async () => {
    const send = sends();
    await expect(sendNeedThreadMessage({ ...message, needClaimId: "claim" }, send)).resolves.toBe("created-for-claim");
    expect(send.claim).toHaveBeenCalledWith({ needClaimId: "claim", body: message.body, imageUrls: message.imageUrls });
    expect(send.publicNeed).not.toHaveBeenCalled();
    expect(send.conversation).not.toHaveBeenCalled();
  });

  it("preserves the public need first-message path for drafts without claims", async () => {
    const send = sends();
    await expect(sendNeedThreadMessage(message, send)).resolves.toBe("created-public");
    expect(send.publicNeed).toHaveBeenCalledWith(message);
    expect(send.claim).not.toHaveBeenCalled();
  });

  it("propagates failed sends instead of reporting a created conversation", async () => {
    const send = sends();
    send.claim.mockRejectedValue(new Error("Forbidden"));
    await expect(sendNeedThreadMessage({ ...message, needClaimId: "claim" }, send)).rejects.toThrow("Forbidden");
  });
});