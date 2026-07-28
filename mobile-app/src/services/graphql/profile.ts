import { apolloClient } from "./client";
import {
  type AccountPatch,
  type Mutation,
  type Query,
  type QueryAccountByIdArgs,
  type UpdateAccountByIdInput
} from "./generated";
import { ACCOUNT_PROFILE_QUERY, UPDATE_ACCOUNT_PROFILE_MUTATION } from "./operations";
import type { MyProfileRecord } from "../../screens/profile/MyProfileScreen";
import type { ProximityLocationValue } from "../../components/primitives/ProximityLocationEditor";

interface AccountProfileQueryResult {
  accountById: Pick<Query, "accountById">["accountById"];
}

interface UpdateAccountProfileMutationResult {
  updateAccountById: Pick<Mutation, "updateAccountById">["updateAccountById"];
}

function toProfileRecord(account: NonNullable<AccountProfileQueryResult["accountById"]>): MyProfileRecord {
  const locationLabel = account.location ?? "";
  const latitude = typeof account.latitude === "number" ? account.latitude : undefined;
  const longitude = typeof account.longitude === "number" ? account.longitude : undefined;

  return {
    accountId: String(account.id),
    displayName: account.displayName ?? "",
    email: "",
    avatarUrl: account.avatarUrl ?? null,
    location: locationLabel
      ? { label: locationLabel, latitude, longitude }
      : null,
    bio: account.bio ?? ""
  };
}

export async function fetchMyProfile(accountId: string): Promise<MyProfileRecord | null> {
  const variables: QueryAccountByIdArgs = { id: accountId };

  const { data } = await apolloClient.query<AccountProfileQueryResult, QueryAccountByIdArgs>({
    query: ACCOUNT_PROFILE_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const account = data?.accountById;
  if (!account) {
    return null;
  }

  return toProfileRecord(account);
}

export async function updateMyProfile(
  accountId: string,
  profilePatch: Pick<MyProfileRecord, "displayName" | "location" | "bio"> & { avatarUrl?: string | null }
): Promise<MyProfileRecord | null> {
  const locationValue: ProximityLocationValue | null = profilePatch.location ?? null;
  const variables: { input: UpdateAccountByIdInput } = {
    input: {
      id: accountId,
      accountPatch: {
        displayName: profilePatch.displayName,
        location: locationValue?.label ?? null,
        latitude: locationValue?.latitude ?? null,
        longitude: locationValue?.longitude ?? null,
        bio: profilePatch.bio,
        ...(profilePatch.avatarUrl !== undefined && { avatarUrl: profilePatch.avatarUrl })
      } satisfies AccountPatch
    }
  };

  const { data } = await apolloClient.mutate<UpdateAccountProfileMutationResult, { input: UpdateAccountByIdInput }>({
    mutation: UPDATE_ACCOUNT_PROFILE_MUTATION,
    variables
  });

  const account = data?.updateAccountById?.account;
  if (!account) {
    return null;
  }

  return toProfileRecord(account);
}
