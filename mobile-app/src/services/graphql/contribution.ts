import { CombinedGraphQLErrors } from "@apollo/client/errors";

import { apolloClient } from "./client";
import { GiftTokensDocument } from "./operations.generated";
import { signalAccountRefresh } from "../realtime/accountEvents";

export async function giftTokens(recipientAccountId: string, amount: number, message: string): Promise<void> {
  await apolloClient.mutate({
    mutation: GiftTokensDocument,
    variables: {
      input: { recipientAccountId, amount, message: message.trim() || null }
    },
    update(cache, { data }) {
      if (!data?.giftTokens?.tokenMovement) return;

      // Economics screens fetch on mount; invalidate any cached balance/history too.
      // Do not turn a successful transfer into a failed request if a refetch fails.
      cache.evict({ id: "ROOT_QUERY", fieldName: "currentTokenBalance" });
      cache.evict({ id: "ROOT_QUERY", fieldName: "allTokenMovements" });
    }
  });
  signalAccountRefresh();
}

export function getGiftErrorMessage(error: unknown, fallback: string, unauthenticated: string): string {
  if (!CombinedGraphQLErrors.is(error)) return fallback;
  if (error.errors.some(item => item.extensions?.code === "UNAUTHENTICATED")) return unauthenticated;
  return error.errors.find(item => item.message.trim())?.message ?? fallback;
}