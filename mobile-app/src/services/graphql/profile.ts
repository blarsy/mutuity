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

interface AccountProfileQueryResult {
  accountById: Pick<Query, "accountById">["accountById"];
}

interface UpdateAccountProfileMutationResult {
  updateAccountById: Pick<Mutation, "updateAccountById">["updateAccountById"];
}

function toProfileRecord(account: NonNullable<AccountProfileQueryResult["accountById"]>): MyProfileRecord {
  return {
    accountId: String(account.id),
    displayName: account.displayName ?? "",
    email: "",
    city: account.location ?? "",
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
  profilePatch: Pick<MyProfileRecord, "displayName" | "city" | "bio">
): Promise<MyProfileRecord | null> {
  const variables: { input: UpdateAccountByIdInput } = {
    input: {
      id: accountId,
      accountPatch: {
        displayName: profilePatch.displayName,
        location: profilePatch.city,
        bio: profilePatch.bio
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
