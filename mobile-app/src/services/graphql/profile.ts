import { apolloClient } from "./client";
import {
  type AccountPatch,
  type Mutation,
  type Query,
  type QueryAccountByIdArgs,
  type UpdateAccountByIdInput
} from "./generated";
import { ACCOUNT_PROFILE_QUERY, UPDATE_ACCOUNT_PROFILE_MUTATION } from "./operations";
import type {
  MyProfileRecord,
  PublicProfileLink,
  PublicProfileNeed,
  PublicProfileResource
} from "../../screens/profile/MyProfileScreen";
import { NeedIntensity } from "./generated";
import type { ProximityLocationValue } from "../../components/primitives/ProximityLocationEditor";

interface AccountProfileQueryResult {
  accountById: Pick<Query, "accountById">["accountById"];
  allResources?: {
    nodes?: Array<{
      id?: string | null;
      title?: string | null;
      description?: string | null;
      imageUrls?: Array<string | null> | null;
      createdAt?: string | null;
      canBeExchanged?: boolean | null;
      canBeGiven?: boolean | null;
    }> | null;
  } | null;
  allNeeds?: {
    nodes?: Array<{
      id?: string | null;
      title?: string | null;
      description?: string | null;
      proposedTopesAmount?: number | null;
      intensity?: NeedIntensity | null;
    }> | null;
  } | null;
}

interface UpdateAccountProfileMutationResult {
  updateAccountById: Pick<Mutation, "updateAccountById">["updateAccountById"];
}

function normalizeProfileLinks(value: unknown): PublicProfileLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((link) => {
      if (!link || typeof link !== "object") {
        return null;
      }

      const candidate = link as { type?: unknown; label?: unknown; url?: unknown };
      const type = typeof candidate.type === "string" ? candidate.type : "website";
      const url = typeof candidate.url === "string" ? candidate.url : "";
      const label = typeof candidate.label === "string" ? candidate.label : url;

      if (!url) {
        return null;
      }

      return {
        type: ["website", "facebook", "instagram", "x"].includes(type) ? (type as PublicProfileLink["type"]) : "website",
        label,
        url
      };
    })
    .filter((link): link is PublicProfileLink => link !== null);
}

function normalizePublicResources(value: unknown): PublicProfileResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((resource) => {
      if (!resource || typeof resource !== "object") {
        return null;
      }

      const candidate = resource as {
        id?: unknown;
        title?: unknown;
        description?: unknown;
        imageUrls?: unknown;
        createdAt?: unknown;
        canBeExchanged?: unknown;
        canBeGiven?: unknown;
      };
      const id = typeof candidate.id === "string" ? candidate.id : "";
      const title = typeof candidate.title === "string" ? candidate.title : "";
      const description = typeof candidate.description === "string" ? candidate.description : "";
      const imageUrls = Array.isArray(candidate.imageUrls)
        ? candidate.imageUrls.filter((item): item is string => typeof item === "string")
        : [];

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title,
        description,
        imageUrls,
        createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : null,
        canBeExchanged: candidate.canBeExchanged === true,
        canBeGifted: candidate.canBeGiven === true
      };
    })
    .filter((resource): resource is PublicProfileResource => resource !== null);
}

function normalizePublicNeeds(value: unknown): PublicProfileNeed[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((need) => {
      if (!need || typeof need !== "object") {
        return null;
      }

      const candidate = need as {
        id?: unknown;
        title?: unknown;
        description?: unknown;
        proposedTopesAmount?: unknown;
        intensity?: unknown;
      };
      const id = typeof candidate.id === "string" ? candidate.id : "";
      const title = typeof candidate.title === "string" ? candidate.title : "";

      if (!id || !title) {
        return null;
      }

      return {
        id,
        title,
        description: typeof candidate.description === "string" ? candidate.description : "",
        proposedTokenAmount:
          typeof candidate.proposedTopesAmount === "number" && Number.isFinite(candidate.proposedTopesAmount)
            ? candidate.proposedTopesAmount
            : 0,
        intensity:
          candidate.intensity === NeedIntensity.Commitment ||
          candidate.intensity === NeedIntensity.LegUp ||
          candidate.intensity === NeedIntensity.RareContribution
            ? candidate.intensity
            : NeedIntensity.Sharing
      };
    })
    .filter((need): need is PublicProfileNeed => need !== null);
}

function toProfileRecord(
  account: NonNullable<AccountProfileQueryResult["accountById"]>,
  allResources: unknown = [],
  allNeeds: unknown = []
): MyProfileRecord {
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
    bio: account.bio ?? "",
    profileLinks: normalizeProfileLinks((account as { profileLinks?: unknown }).profileLinks),
    resources: normalizePublicResources(allResources),
    needs: normalizePublicNeeds(allNeeds)
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

  return toProfileRecord(account, data?.allResources?.nodes ?? [], data?.allNeeds?.nodes ?? []);
}

export async function updateMyProfile(
  accountId: string,
  profilePatch: Pick<MyProfileRecord, "displayName" | "location" | "bio" | "profileLinks"> & { avatarUrl?: string | null }
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
        profileLinks: profilePatch.profileLinks ?? [],
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
