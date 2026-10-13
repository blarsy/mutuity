type Message = { body: string; imageUrls: string[] };
type Result = Promise<string | null | undefined>;

/** Select an authorized send path without treating a need owner as its claimer. */
export async function sendNeedThreadMessage(
  context: Message & { conversationId?: string | null; needClaimId?: string | null; needId: string },
  send: {
    conversation: (input: Message & { conversationId: string }) => Result;
    claim: (input: Message & { needClaimId: string }) => Result;
    publicNeed: (input: Message & { needId: string }) => Result;
  }
): Result {
  const message = { body: context.body, imageUrls: context.imageUrls };
  if (context.conversationId) return send.conversation({ ...message, conversationId: context.conversationId });
  if (context.needClaimId) return send.claim({ ...message, needClaimId: context.needClaimId });
  return send.publicNeed({ ...message, needId: context.needId });
}