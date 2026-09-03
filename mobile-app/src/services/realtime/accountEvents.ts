import { apolloClient } from "../graphql/client";
import { ACCOUNT_EVENTS_SUBSCRIPTION } from "../graphql/operations";

export interface AccountEventSubscriptionHandle {
  unsubscribe: () => void;
}

export function accountEventsTopic(accountId: string): string {
  return `account_events_${accountId}`;
}

export function subscribeToAccountEvents(
  accountId: string,
  onEvent: () => void
): AccountEventSubscriptionHandle {
  const subscription = apolloClient
    .subscribe<{ listen: { relatedNodeId: string | null } }>({
      query: ACCOUNT_EVENTS_SUBSCRIPTION,
      variables: { topic: accountEventsTopic(accountId) }
    })
    .subscribe({
      next: () => onEvent(),
      error: () => undefined
    });

  return { unsubscribe: () => subscription.unsubscribe() };
}
