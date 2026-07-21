import { apolloClient } from "./client";
import {
  type AccountDeliveryPreferenceInput,
  type CreateAccountDeliveryPreferenceInput,
  type Mutation,
  type QueryAllAccountDeliveryPreferencesArgs,
  type UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput
} from "./generated";
import {
  ACCOUNT_DELIVERY_PREFERENCES_QUERY,
  CREATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION,
  UPDATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION
} from "./operations";

export interface NotificationPreferenceRecord {
  eventCategory: string;
  deliveryMode: "realtime" | "summary";
  summaryCadenceDays?: 1 | 3 | 7 | 30;
}

const notificationPreferences: NotificationPreferenceRecord[] = [];

export function getNotificationPreferences(): NotificationPreferenceRecord[] {
  return [...notificationPreferences];
}

export function setNotificationPreference(preference: NotificationPreferenceRecord): void {
  const existingIndex = notificationPreferences.findIndex((item) => item.eventCategory === preference.eventCategory);

  if (existingIndex >= 0) {
    notificationPreferences[existingIndex] = preference;
    return;
  }

  notificationPreferences.push(preference);
}

interface AccountDeliveryPreferencesQueryResult {
  allAccountDeliveryPreferences: {
    nodes: Array<{
      eventCategory: string;
      deliveryStrategy: string;
      summaryFrequencyDays: number;
    }>;
  } | null;
}

interface UpdateDeliveryPreferenceMutationResult {
  updateAccountDeliveryPreferenceByAccountIdAndEventCategory: Pick<
    Mutation,
    "updateAccountDeliveryPreferenceByAccountIdAndEventCategory"
  >["updateAccountDeliveryPreferenceByAccountIdAndEventCategory"];
}

interface CreateDeliveryPreferenceMutationResult {
  createAccountDeliveryPreference: Pick<Mutation, "createAccountDeliveryPreference">["createAccountDeliveryPreference"];
}

function toDeliveryStrategy(mode: NotificationPreferenceRecord["deliveryMode"]): string {
  return mode === "summary" ? "email_summary" : "realtime_push";
}

export async function fetchNotificationPreferencesFromBackend(accountId: string): Promise<NotificationPreferenceRecord[]> {
  const variables: QueryAllAccountDeliveryPreferencesArgs = {
    condition: { accountId },
    first: 50
  };

  const { data } = await apolloClient.query<AccountDeliveryPreferencesQueryResult, QueryAllAccountDeliveryPreferencesArgs>({
    query: ACCOUNT_DELIVERY_PREFERENCES_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.allAccountDeliveryPreferences?.nodes ?? []).map((entry) => ({
    eventCategory: entry.eventCategory,
    deliveryMode: entry.deliveryStrategy === "email_summary" ? "summary" : "realtime",
    summaryCadenceDays:
      entry.summaryFrequencyDays === 1 ||
      entry.summaryFrequencyDays === 3 ||
      entry.summaryFrequencyDays === 7 ||
      entry.summaryFrequencyDays === 30
        ? entry.summaryFrequencyDays
        : 7
  }));
}

export async function saveNotificationPreferenceToBackend(
  accountId: string,
  preference: NotificationPreferenceRecord
): Promise<void> {
  const summaryCadenceDays = preference.summaryCadenceDays ?? 7;

  const updateInput: UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput = {
    accountId,
    eventCategory: preference.eventCategory,
    accountDeliveryPreferencePatch: {
      deliveryStrategy: toDeliveryStrategy(preference.deliveryMode),
      summaryFrequencyDays: summaryCadenceDays
    }
  };

  try {
    await apolloClient.mutate<
      UpdateDeliveryPreferenceMutationResult,
      { input: UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput }
    >({
      mutation: UPDATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION,
      variables: { input: updateInput }
    });
    return;
  } catch {
    const createInput: CreateAccountDeliveryPreferenceInput = {
      accountDeliveryPreference: {
        accountId,
        eventCategory: preference.eventCategory,
        deliveryStrategy: toDeliveryStrategy(preference.deliveryMode),
        summaryFrequencyDays: summaryCadenceDays
      } satisfies AccountDeliveryPreferenceInput
    };

    await apolloClient.mutate<CreateDeliveryPreferenceMutationResult, { input: CreateAccountDeliveryPreferenceInput }>({
      mutation: CREATE_ACCOUNT_DELIVERY_PREFERENCE_MUTATION,
      variables: { input: createInput }
    });
  }
}
