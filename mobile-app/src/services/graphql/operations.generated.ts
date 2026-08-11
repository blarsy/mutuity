/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/**
 * A condition to be used against `AccountDeliveryPreference` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type AccountDeliveryPreferenceCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: unknown;
};

/** An input for mutations affecting `AccountDeliveryPreference` */
export type AccountDeliveryPreferenceInput = {
  accountId: unknown;
  createdAt?: unknown;
  /** Out-of-app delivery strategy per category: realtime_push or email_summary. */
  deliveryStrategy?: string | null | undefined;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: string;
  /** Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30. */
  summaryFrequencyDays?: number | null | undefined;
  updatedAt?: unknown;
};

/** Represents an update to a `AccountDeliveryPreference`. Fields that are set will be updated. */
export type AccountDeliveryPreferencePatch = {
  accountId?: unknown;
  createdAt?: unknown;
  /** Out-of-app delivery strategy per category: realtime_push or email_summary. */
  deliveryStrategy?: string | null | undefined;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory?: string | null | undefined;
  /** Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30. */
  summaryFrequencyDays?: number | null | undefined;
  updatedAt?: unknown;
};

/**
 * A condition to be used against `AccountNotification` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type AccountNotificationCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: unknown;
  /** Checks for equality with the object’s `id` field. */
  id?: unknown;
  /** Checks for equality with the object’s `recipientAccountId` field. */
  recipientAccountId?: unknown;
};

/** Represents an update to a `Account`. Fields that are set will be updated. */
export type AccountPatch = {
  activationVerifiedAt?: unknown;
  avatarUrl?: string | null | undefined;
  bio?: string | null | undefined;
  createdAt?: unknown;
  displayName?: string | null | undefined;
  externalSubject?: string | null | undefined;
  id?: unknown;
  latitude?: unknown;
  location?: string | null | undefined;
  longitude?: unknown;
  /** The account owner's preferred UI and email language. Supported values: en, fr. */
  preferredLanguage?: string | null | undefined;
  profileLinks?: unknown;
  requirePasswordResetOnNextLogin?: boolean | null | undefined;
  updatedAt?: unknown;
};

export type AuthLoginInput = {
  clientMutationId?: string | null | undefined;
  identifier: string;
  password: string;
};

export type CampaignModerationStatus =
  | 'APPROVED'
  | 'AWAITING_ADAPTATION'
  | 'PENDING';

/** Represents an update to a `Campaign`. Fields that are set will be updated. */
export type CampaignPatch = {
  airdropAmount?: number | null | undefined;
  airdropAt?: unknown;
  createdAt?: unknown;
  creatorAccountId?: unknown;
  description?: string | null | undefined;
  endAt?: unknown;
  id?: unknown;
  imageUrl?: string | null | undefined;
  managerNoteFromCreator?: string | null | undefined;
  moderationStatus?: CampaignModerationStatus | null | undefined;
  rewardsMultiplier?: number | null | undefined;
  startAt?: unknown;
  theme?: string | null | undefined;
  title?: string | null | undefined;
  updatedAt?: unknown;
};

export type ChatContextKind =
  | 'NEED'
  | 'RESOURCE';

/** All input for the `claimNeed` mutation. */
export type ClaimNeedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  message?: string | null | undefined;
  needId?: unknown;
};

/** All input for the create `AccountDeliveryPreference` mutation. */
export type CreateAccountDeliveryPreferenceInput = {
  /** The `AccountDeliveryPreference` to be created by this mutation. */
  accountDeliveryPreference: AccountDeliveryPreferenceInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
};

/** All input for the `createCampaign` mutation. */
export type CreateCampaignInput = {
  airdropAmount?: number | null | undefined;
  airdropAt?: unknown;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  description?: string | null | undefined;
  endAt?: unknown;
  imageUrl?: string | null | undefined;
  managerNoteFromCreator?: string | null | undefined;
  rewardsMultiplier?: number | null | undefined;
  startAt?: unknown;
  theme?: string | null | undefined;
  title?: string | null | undefined;
};

/** All input for the `createNeed` mutation. */
export type CreateNeedInput = {
  campaignId?: unknown;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  competenceRequired?: boolean | null | undefined;
  description?: string | null | undefined;
  expiresAt?: unknown;
  imageUrls?: Array<string | null | undefined> | null | undefined;
  intensity?: NeedIntensity | null | undefined;
  latitude?: unknown;
  location?: string | null | undefined;
  longitude?: unknown;
  multiplePeopleRequired?: boolean | null | undefined;
  objectRequired?: boolean | null | undefined;
  proposedTopesAmount?: number | null | undefined;
  requiredCompetenceText?: string | null | undefined;
  requiredPeopleCount?: number | null | undefined;
  requiredToolingText?: string | null | undefined;
  title?: string | null | undefined;
  toolingRequired?: boolean | null | undefined;
};

/** All input for the create `Resource` mutation. */
export type CreateResourceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  /** The `Resource` to be created by this mutation. */
  resource: ResourceInput;
};

/** All input for the create `ResourceMessage` mutation. */
export type CreateResourceMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  /** The `ResourceMessage` to be created by this mutation. */
  resourceMessage: ResourceMessageInput;
};

/** All input for the `markAccountNotificationRead` mutation. */
export type MarkAccountNotificationReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  notificationId?: unknown;
};

/** All input for the `markAllNotificationsRead` mutation. */
export type MarkAllNotificationsReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
};

/** All input for the `markResourceMessagesRead` mutation. */
export type MarkResourceMessagesReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  pConversationId?: unknown;
};

/**
 * A condition to be used against `NeedClaim` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type NeedClaimCondition = {
  /** Checks for equality with the object’s `claimerAccountId` field. */
  claimerAccountId?: unknown;
  /** Checks for equality with the object’s `id` field. */
  id?: unknown;
  /** Checks for equality with the object’s `needId` field. */
  needId?: unknown;
  /** Checks for equality with the object’s `settledByAccountId` field. */
  settledByAccountId?: unknown;
};

export type NeedClaimStatus =
  | 'DECLINED'
  | 'EXPIRED'
  | 'OPEN'
  | 'SETTLED'
  | 'WITHDRAWN';

export type NeedIntensity =
  | 'COMMITMENT'
  | 'LEG_UP'
  | 'RARE_CONTRIBUTION'
  | 'SHARING';

/** Represents an update to a `Need`. Fields that are set will be updated. */
export type NeedPatch = {
  competenceRequired?: boolean | null | undefined;
  createdAt?: unknown;
  creatorAccountId?: unknown;
  description?: string | null | undefined;
  expiresAt?: unknown;
  id?: unknown;
  imageUrls?: Array<string | null | undefined> | null | undefined;
  intensity?: NeedIntensity | null | undefined;
  isActive?: boolean | null | undefined;
  latitude?: unknown;
  location?: string | null | undefined;
  longitude?: unknown;
  multiplePeopleRequired?: boolean | null | undefined;
  objectRequired?: boolean | null | undefined;
  proposedTopesAmount?: number | null | undefined;
  requiredCompetenceText?: string | null | undefined;
  requiredPeopleCount?: number | null | undefined;
  requiredToolingText?: string | null | undefined;
  title?: string | null | undefined;
  toolingRequired?: boolean | null | undefined;
  updatedAt?: unknown;
};

/** All input for the `registerLocalAccountWithSocialIdentity` mutation. */
export type RegisterLocalAccountWithSocialIdentityInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  displayName?: string | null | undefined;
  identifier?: string | null | undefined;
  password?: string | null | undefined;
  preferredLanguage?: string | null | undefined;
  provider?: string | null | undefined;
  providerEmail?: string | null | undefined;
  providerEmailVerified?: boolean | null | undefined;
  providerSubject?: string | null | undefined;
  verificationTtlMs?: unknown;
};

export type ResourceBidStatus =
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'OPEN'
  | 'WITHDRAWN';

/** An input for mutations affecting `Resource` */
export type ResourceInput = {
  canBeDelivered?: boolean | null | undefined;
  canBeExchanged?: boolean | null | undefined;
  canBeGiven?: boolean | null | undefined;
  canBeTakenAway?: boolean | null | undefined;
  createdAt?: unknown;
  creatorAccountId: unknown;
  defaultTokenAmount?: number | null | undefined;
  description?: string | null | undefined;
  expiresAt?: unknown;
  id?: unknown;
  imageUrls?: Array<string | null | undefined> | null | undefined;
  intensity: NeedIntensity;
  isActive?: boolean | null | undefined;
  isProduct?: boolean | null | undefined;
  isService?: boolean | null | undefined;
  latitude?: unknown;
  location?: string | null | undefined;
  longitude?: unknown;
  title: string;
  updatedAt?: unknown;
};

/** An input for mutations affecting `ResourceMessage` */
export type ResourceMessageInput = {
  body: string;
  conversationId: unknown;
  createdAt?: unknown;
  id?: unknown;
  readAt?: unknown;
  senderAccountId: unknown;
};

/** Represents an update to a `Resource`. Fields that are set will be updated. */
export type ResourcePatch = {
  canBeDelivered?: boolean | null | undefined;
  canBeExchanged?: boolean | null | undefined;
  canBeGiven?: boolean | null | undefined;
  canBeTakenAway?: boolean | null | undefined;
  createdAt?: unknown;
  creatorAccountId?: unknown;
  defaultTokenAmount?: number | null | undefined;
  description?: string | null | undefined;
  expiresAt?: unknown;
  id?: unknown;
  imageUrls?: Array<string | null | undefined> | null | undefined;
  intensity?: NeedIntensity | null | undefined;
  isActive?: boolean | null | undefined;
  isProduct?: boolean | null | undefined;
  isService?: boolean | null | undefined;
  latitude?: unknown;
  location?: string | null | undefined;
  longitude?: unknown;
  title?: string | null | undefined;
  updatedAt?: unknown;
};

/**
 * A condition to be used against `TokenMovement` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type TokenMovementCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: unknown;
  /** Checks for equality with the object’s `counterpartyAccountId` field. */
  counterpartyAccountId?: unknown;
  /** Checks for equality with the object’s `id` field. */
  id?: unknown;
  /** Checks for equality with the object’s `idempotencyKey` field. */
  idempotencyKey?: string | null | undefined;
  /** Checks for equality with the object’s `referenceType` field. */
  referenceType?: string | null | undefined;
};

export type TriStateFilter =
  | 'NEUTRAL'
  | 'SET'
  | 'UNSET';

/** All input for the `updateAccountDeliveryPreferenceByAccountIdAndEventCategory` mutation. */
export type UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput = {
  /** An object where the defined keys will be set on the `AccountDeliveryPreference` being updated. */
  accountDeliveryPreferencePatch: AccountDeliveryPreferencePatch;
  accountId: unknown;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: string | null | undefined;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: string;
};

export type AuthLoginMutationVariables = Exact<{
  input: AuthLoginInput;
}>;


export type AuthLoginMutation = { __typename: 'Mutation', authLogin: { __typename: 'AuthLoginPayload', authSession: { __typename: 'AuthSessionPayload', account: { __typename: 'AuthSessionAccount', id: string } | null } } | null };

export type RegisterLocalAccountWithSocialIdentityMutationVariables = Exact<{
  input: RegisterLocalAccountWithSocialIdentityInput;
}>;


export type RegisterLocalAccountWithSocialIdentityMutation = { __typename: 'Mutation', registerLocalAccountWithSocialIdentity: { __typename: 'RegisterLocalAccountWithSocialIdentityPayload', boolean: boolean | null } | null };

export type AccountByIdQueryVariables = Exact<{
  id: unknown;
}>;


export type AccountByIdQuery = { __typename: 'Query', accountById: { __typename: 'Account', id: unknown, displayName: string | null, avatarUrl: string | null, location: string | null, preferredLanguage: string } | null };

export type SearchResourcesQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: unknown;
  searchText?: string | null | undefined;
  favorLocalResources?: boolean | null | undefined;
  maxDistanceKm?: unknown;
  isProduct?: TriStateFilter | null | undefined;
  isService?: TriStateFilter | null | undefined;
  canBeTakenAway?: TriStateFilter | null | undefined;
  canBeDelivered?: TriStateFilter | null | undefined;
  canBeExchanged?: TriStateFilter | null | undefined;
  canBeGiven?: TriStateFilter | null | undefined;
}>;


export type SearchResourcesQuery = { __typename: 'Query', searchResources: { __typename: 'SearchResourcesConnection', nodes: Array<{ __typename: 'SearchResourcesRecord', id: unknown, title: string | null, description: string | null, createdAt: unknown, creatorAccountId: unknown, creatorDisplayName: string | null, distanceKm: unknown, latitude: unknown, longitude: unknown, isProduct: boolean | null, isService: boolean | null, canBeTakenAway: boolean | null, canBeDelivered: boolean | null, canBeExchanged: boolean | null, canBeGiven: boolean | null, defaultTokenAmount: number | null, categoryLabels: Array<string | null> | null, imageUrls: Array<string | null> | null }> } | null, publicCampaignResourceLinks: { __typename: 'PublicCampaignResourceLinksConnection', nodes: Array<{ __typename: 'PublicCampaignResourceLinksRecord', campaignId: unknown, resourceId: unknown }> } | null };

export type MyResourcesQueryVariables = Exact<{
  creatorAccountId: unknown;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type MyResourcesQuery = { __typename: 'Query', allResources: { __typename: 'ResourcesConnection', nodes: Array<{ __typename: 'Resource', id: unknown, title: string, description: string | null, defaultTokenAmount: number | null, imageUrls: Array<string | null>, isActive: boolean, isProduct: boolean, isService: boolean, canBeTakenAway: boolean, canBeDelivered: boolean, canBeExchanged: boolean, canBeGiven: boolean, location: string | null, latitude: unknown, longitude: unknown, expiresAt: unknown, updatedAt: unknown, resourceCategoryAssignmentsByResourceId: { __typename: 'ResourceCategoryAssignmentsConnection', nodes: Array<{ __typename: 'ResourceCategoryAssignment', categoryCode: number }> }, campaignResourcesByResourceId: { __typename: 'CampaignResourcesConnection', nodes: Array<{ __typename: 'CampaignResource', campaignId: unknown }> } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type SearchNeedsQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: unknown;
}>;


export type SearchNeedsQuery = { __typename: 'Query', allNeeds: { __typename: 'NeedsConnection', nodes: Array<{ __typename: 'Need', id: unknown, creatorAccountId: unknown, title: string, description: string | null, createdAt: unknown, proposedTopesAmount: number | null, intensity: NeedIntensity, needClaimsByNeedId: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: unknown, claimerAccountId: unknown, status: NeedClaimStatus }> } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null, publicCampaignNeedLinks: { __typename: 'PublicCampaignNeedLinksConnection', nodes: Array<{ __typename: 'PublicCampaignNeedLinksRecord', campaignId: unknown, needId: unknown }> } | null };

export type MyNeedsQueryVariables = Exact<{
  creatorAccountId: unknown;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type MyNeedsQuery = { __typename: 'Query', allNeeds: { __typename: 'NeedsConnection', nodes: Array<{ __typename: 'Need', id: unknown, creatorAccountId: unknown, title: string, description: string | null, imageUrls: Array<string | null> | null, location: string, latitude: unknown, longitude: unknown, createdAt: unknown, expiresAt: unknown, proposedTopesAmount: number | null, intensity: NeedIntensity, objectRequired: boolean, competenceRequired: boolean, toolingRequired: boolean, multiplePeopleRequired: boolean, requiredCompetenceText: string | null, requiredToolingText: string | null, requiredPeopleCount: number | null, campaignNeedsByNeedId: { __typename: 'CampaignNeedsConnection', nodes: Array<{ __typename: 'CampaignNeed', campaignId: unknown }> }, needClaimsByNeedId: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: unknown, claimerAccountId: unknown, status: NeedClaimStatus }> } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type MyCampaignsQueryVariables = Exact<{
  creatorAccountId: unknown;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type MyCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: unknown, title: string, theme: string, description: string | null, imageUrl: string | null, createdAt: unknown, creatorAccountId: unknown, moderationStatus: CampaignModerationStatus, startAt: unknown, airdropAt: unknown, endAt: unknown, campaignResourcesByCampaignId: { __typename: 'CampaignResourcesConnection', totalCount: number }, campaignNeedsByCampaignId: { __typename: 'CampaignNeedsConnection', totalCount: number } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type LinkableCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type LinkableCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: unknown, title: string, startAt: unknown, endAt: unknown }> } | null };

export type ResourceByIdQueryVariables = Exact<{
  id: unknown;
}>;


export type ResourceByIdQuery = { __typename: 'Query', resourceById: { __typename: 'Resource', id: unknown, title: string, description: string | null, defaultTokenAmount: number | null, categoryLabels: Array<string | null> | null, imageUrls: Array<string | null> } | null };

export type NeedByIdQueryVariables = Exact<{
  id: unknown;
}>;


export type NeedByIdQuery = { __typename: 'Query', needById: { __typename: 'Need', id: unknown, title: string, description: string | null, proposedTopesAmount: number | null, intensity: NeedIntensity } | null };

export type CampaignByIdQueryVariables = Exact<{
  id: unknown;
}>;


export type CampaignByIdQuery = { __typename: 'Query', campaignById: { __typename: 'Campaign', id: unknown, title: string, description: string | null, moderationStatus: CampaignModerationStatus, startAt: unknown, endAt: unknown } | null };

export type CreateResourceMutationVariables = Exact<{
  input: CreateResourceInput;
}>;


export type CreateResourceMutation = { __typename: 'Mutation', createResource: { __typename: 'CreateResourcePayload', resource: { __typename: 'Resource', id: unknown, title: string } | null } | null };

export type CreateNeedMutationVariables = Exact<{
  input: CreateNeedInput;
}>;


export type CreateNeedMutation = { __typename: 'Mutation', createNeed: { __typename: 'CreateNeedPayload', need: { __typename: 'Need', id: unknown, title: string } | null } | null };

export type ClaimNeedMutationVariables = Exact<{
  input: ClaimNeedInput;
}>;


export type ClaimNeedMutation = { __typename: 'Mutation', claimNeed: { __typename: 'ClaimNeedPayload', needClaim: { __typename: 'NeedClaim', id: unknown, needId: unknown, claimerAccountId: unknown, status: NeedClaimStatus } | null } | null };

export type CreateCampaignMutationVariables = Exact<{
  input: CreateCampaignInput;
}>;


export type CreateCampaignMutation = { __typename: 'Mutation', createCampaign: { __typename: 'CreateCampaignPayload', campaign: { __typename: 'Campaign', id: unknown, title: string, moderationStatus: CampaignModerationStatus } | null } | null };

export type UpdateResourceByIdMutationVariables = Exact<{
  id: unknown;
  resourcePatch: ResourcePatch;
}>;


export type UpdateResourceByIdMutation = { __typename: 'Mutation', updateResourceById: { __typename: 'UpdateResourcePayload', resource: { __typename: 'Resource', id: unknown, title: string, description: string | null, defaultTokenAmount: number | null, imageUrls: Array<string | null>, isActive: boolean, isProduct: boolean, isService: boolean, canBeTakenAway: boolean, canBeDelivered: boolean, canBeExchanged: boolean, canBeGiven: boolean, location: string | null, latitude: unknown, longitude: unknown, expiresAt: unknown, updatedAt: unknown, resourceCategoryAssignmentsByResourceId: { __typename: 'ResourceCategoryAssignmentsConnection', nodes: Array<{ __typename: 'ResourceCategoryAssignment', categoryCode: number }> }, campaignResourcesByResourceId: { __typename: 'CampaignResourcesConnection', nodes: Array<{ __typename: 'CampaignResource', campaignId: unknown }> } } | null } | null };

export type ResourceCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type ResourceCategoriesQuery = { __typename: 'Query', allResourceCategories: { __typename: 'ResourceCategoriesConnection', nodes: Array<{ __typename: 'ResourceCategory', code: number, label: string, labelFr: string }> } | null };

export type CreateResourceCategoryAssignmentMutationVariables = Exact<{
  resourceId: unknown;
  categoryCode: number;
}>;


export type CreateResourceCategoryAssignmentMutation = { __typename: 'Mutation', createResourceCategoryAssignment: { __typename: 'CreateResourceCategoryAssignmentPayload', resourceCategoryAssignment: { __typename: 'ResourceCategoryAssignment', categoryCode: number } | null } | null };

export type DeleteResourceCategoryAssignmentMutationVariables = Exact<{
  resourceId: unknown;
  categoryCode: number;
}>;


export type DeleteResourceCategoryAssignmentMutation = { __typename: 'Mutation', deleteResourceCategoryAssignmentByResourceIdAndCategoryCode: { __typename: 'DeleteResourceCategoryAssignmentPayload', deletedResourceCategoryAssignmentId: string | null } | null };

export type CreateCampaignNeedMutationVariables = Exact<{
  campaignId: unknown;
  needId: unknown;
}>;


export type CreateCampaignNeedMutation = { __typename: 'Mutation', createCampaignNeed: { __typename: 'CreateCampaignNeedPayload', campaignNeed: { __typename: 'CampaignNeed', campaignId: unknown, needId: unknown } | null } | null };

export type DeleteCampaignNeedMutationVariables = Exact<{
  campaignId: unknown;
  needId: unknown;
}>;


export type DeleteCampaignNeedMutation = { __typename: 'Mutation', deleteCampaignNeedByCampaignIdAndNeedId: { __typename: 'DeleteCampaignNeedPayload', deletedCampaignNeedId: string | null } | null };

export type CreateCampaignResourceMutationVariables = Exact<{
  campaignId: unknown;
  resourceId: unknown;
}>;


export type CreateCampaignResourceMutation = { __typename: 'Mutation', createCampaignResource: { __typename: 'CreateCampaignResourcePayload', campaignResource: { __typename: 'CampaignResource', campaignId: unknown, resourceId: unknown } | null } | null };

export type DeleteCampaignResourceMutationVariables = Exact<{
  campaignId: unknown;
  resourceId: unknown;
}>;


export type DeleteCampaignResourceMutation = { __typename: 'Mutation', deleteCampaignResourceByCampaignIdAndResourceId: { __typename: 'DeleteCampaignResourcePayload', deletedCampaignResourceId: string | null } | null };

export type DeleteResourceByIdMutationVariables = Exact<{
  id: unknown;
}>;


export type DeleteResourceByIdMutation = { __typename: 'Mutation', deleteResourceById: { __typename: 'DeleteResourcePayload', deletedResourceId: string | null } | null };

export type UpdateNeedByIdMutationVariables = Exact<{
  id: unknown;
  needPatch: NeedPatch;
}>;


export type UpdateNeedByIdMutation = { __typename: 'Mutation', updateNeedById: { __typename: 'UpdateNeedPayload', need: { __typename: 'Need', id: unknown, title: string, description: string | null, proposedTopesAmount: number | null, campaignNeedsByNeedId: { __typename: 'CampaignNeedsConnection', nodes: Array<{ __typename: 'CampaignNeed', campaignId: unknown }> } } | null } | null };

export type UpdateCampaignByIdMutationVariables = Exact<{
  id: unknown;
  campaignPatch: CampaignPatch;
}>;


export type UpdateCampaignByIdMutation = { __typename: 'Mutation', updateCampaignById: { __typename: 'UpdateCampaignPayload', campaign: { __typename: 'Campaign', id: unknown, title: string, description: string | null, moderationStatus: CampaignModerationStatus } | null } | null };

export type SentResourceBidsQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: unknown;
  activeOnly?: boolean | null | undefined;
}>;


export type SentResourceBidsQuery = { __typename: 'Query', sentResourceBids: { __typename: 'ResourceBidsConnection', nodes: Array<{ __typename: 'ResourceBid', id: unknown, message: string | null, proposedTokenAmount: number | null, isActive: boolean | null, status: ResourceBidStatus, updatedAt: unknown, resourceByResourceId: { __typename: 'Resource', id: unknown, title: string } | null, accountByBidderAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null, accountByRespondedByAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type ReceivedResourceBidsQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: unknown;
  activeOnly?: boolean | null | undefined;
}>;


export type ReceivedResourceBidsQuery = { __typename: 'Query', receivedResourceBids: { __typename: 'ResourceBidsConnection', nodes: Array<{ __typename: 'ResourceBid', id: unknown, message: string | null, proposedTokenAmount: number | null, isActive: boolean | null, status: ResourceBidStatus, updatedAt: unknown, resourceByResourceId: { __typename: 'Resource', id: unknown, title: string } | null, accountByBidderAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null, accountByRespondedByAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type SentNeedClaimsQueryVariables = Exact<{
  condition?: NeedClaimCondition | null | undefined;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type SentNeedClaimsQuery = { __typename: 'Query', allNeedClaims: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: unknown, needId: unknown, claimerAccountId: unknown, status: NeedClaimStatus, createdAt: unknown, needByNeedId: { __typename: 'Need', id: unknown, title: string } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type ReceivedNeedClaimsQueryVariables = Exact<{
  creatorAccountId: unknown;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type ReceivedNeedClaimsQuery = { __typename: 'Query', allNeeds: { __typename: 'NeedsConnection', nodes: Array<{ __typename: 'Need', id: unknown, title: string, needClaimsByNeedId: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: unknown, needId: unknown, claimerAccountId: unknown, status: NeedClaimStatus, createdAt: unknown }> } }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type ChatConversationsQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: unknown;
}>;


export type ChatConversationsQuery = { __typename: 'Query', allChatConversationSummaries: { __typename: 'ChatConversationSummariesConnection', nodes: Array<{ __typename: 'ChatConversationSummary', conversationId: unknown, conversationKind: ChatContextKind | null, contextTitle: string | null, lastMessagePreview: string | null, lastActivityAt: unknown, otherAccountId: unknown, unreadCount: number | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type ResourceConversationByIdQueryVariables = Exact<{
  id: unknown;
}>;


export type ResourceConversationByIdQuery = { __typename: 'Query', resourceConversationById: { __typename: 'ResourceConversation', id: unknown, resourceId: unknown, ownerAccountId: unknown, bidderAccountId: unknown, resourceByResourceId: { __typename: 'Resource', id: unknown, title: string } | null, accountByOwnerAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null, accountByBidderAccountId: { __typename: 'Account', id: unknown, displayName: string | null } | null } | null };

export type ResourceMessagesQueryVariables = Exact<{
  conversationId: unknown;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type ResourceMessagesQuery = { __typename: 'Query', allResourceMessages: { __typename: 'ResourceMessagesConnection', nodes: Array<{ __typename: 'ResourceMessage', id: unknown, body: string, createdAt: unknown, senderAccountId: unknown }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type CreateResourceMessageMutationVariables = Exact<{
  input: CreateResourceMessageInput;
}>;


export type CreateResourceMessageMutation = { __typename: 'Mutation', createResourceMessage: { __typename: 'CreateResourceMessagePayload', resourceMessage: { __typename: 'ResourceMessage', id: unknown, body: string, createdAt: unknown, senderAccountId: unknown } | null } | null };

export type MarkResourceMessagesReadMutationVariables = Exact<{
  input: MarkResourceMessagesReadInput;
}>;


export type MarkResourceMessagesReadMutation = { __typename: 'Mutation', markResourceMessagesRead: { __typename: 'MarkResourceMessagesReadPayload', integer: number | null } | null };

export type AccountNotificationsQueryVariables = Exact<{
  condition?: AccountNotificationCondition | null | undefined;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type AccountNotificationsQuery = { __typename: 'Query', allAccountNotifications: { __typename: 'AccountNotificationsConnection', nodes: Array<{ __typename: 'AccountNotification', id: unknown, eventType: string, payload: unknown, createdAt: unknown, readAt: unknown }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type MarkAccountNotificationReadMutationVariables = Exact<{
  input: MarkAccountNotificationReadInput;
}>;


export type MarkAccountNotificationReadMutation = { __typename: 'Mutation', markAccountNotificationRead: { __typename: 'MarkAccountNotificationReadPayload', accountNotification: { __typename: 'AccountNotification', id: unknown, readAt: unknown } | null } | null };

export type MarkAllNotificationsReadMutationVariables = Exact<{
  input: MarkAllNotificationsReadInput;
}>;


export type MarkAllNotificationsReadMutation = { __typename: 'Mutation', markAllNotificationsRead: { __typename: 'MarkAllNotificationsReadPayload', integer: number | null } | null };

export type AccountProfileQueryVariables = Exact<{
  id: unknown;
}>;


export type AccountProfileQuery = { __typename: 'Query', accountById: { __typename: 'Account', id: unknown, displayName: string | null, avatarUrl: string | null, bio: string | null, location: string | null, latitude: unknown, longitude: unknown, preferredLanguage: string } | null };

export type UpdateAccountProfileMutationVariables = Exact<{
  id: unknown;
  accountPatch: AccountPatch;
}>;


export type UpdateAccountProfileMutation = { __typename: 'Mutation', updateAccountById: { __typename: 'UpdateAccountPayload', account: { __typename: 'Account', id: unknown, displayName: string | null, avatarUrl: string | null, bio: string | null, location: string | null, latitude: unknown, longitude: unknown } | null } | null };

export type CurrentTokenBalanceQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentTokenBalanceQuery = { __typename: 'Query', currentTokenBalance: number | null };

export type TokenHistoryQueryVariables = Exact<{
  condition?: TokenMovementCondition | null | undefined;
  first?: number | null | undefined;
  after?: unknown;
}>;


export type TokenHistoryQuery = { __typename: 'Query', allTokenMovements: { __typename: 'TokenMovementsConnection', nodes: Array<{ __typename: 'TokenMovement', id: unknown, amountDelta: number, eventType: string, createdAt: unknown }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: unknown } } | null };

export type AccountDeliveryPreferencesQueryVariables = Exact<{
  condition?: AccountDeliveryPreferenceCondition | null | undefined;
  first?: number | null | undefined;
}>;


export type AccountDeliveryPreferencesQuery = { __typename: 'Query', allAccountDeliveryPreferences: { __typename: 'AccountDeliveryPreferencesConnection', nodes: Array<{ __typename: 'AccountDeliveryPreference', accountId: unknown, eventCategory: string, deliveryStrategy: string, summaryFrequencyDays: number }> } | null };

export type UpdateAccountDeliveryPreferenceMutationVariables = Exact<{
  input: UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput;
}>;


export type UpdateAccountDeliveryPreferenceMutation = { __typename: 'Mutation', updateAccountDeliveryPreferenceByAccountIdAndEventCategory: { __typename: 'UpdateAccountDeliveryPreferencePayload', accountDeliveryPreference: { __typename: 'AccountDeliveryPreference', accountId: unknown, eventCategory: string, deliveryStrategy: string, summaryFrequencyDays: number } | null } | null };

export type CreateAccountDeliveryPreferenceMutationVariables = Exact<{
  input: CreateAccountDeliveryPreferenceInput;
}>;


export type CreateAccountDeliveryPreferenceMutation = { __typename: 'Mutation', createAccountDeliveryPreference: { __typename: 'CreateAccountDeliveryPreferencePayload', accountDeliveryPreference: { __typename: 'AccountDeliveryPreference', accountId: unknown, eventCategory: string, deliveryStrategy: string, summaryFrequencyDays: number } | null } | null };

export type InspirationCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type InspirationCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: unknown, title: string, theme: string, imageUrl: string | null, moderationStatus: CampaignModerationStatus, startAt: unknown, airdropAt: unknown, endAt: unknown, createdAt: unknown }> } | null };


export const AuthLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AuthLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuthLoginMutation, AuthLoginMutationVariables>;
export const RegisterLocalAccountWithSocialIdentityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterLocalAccountWithSocialIdentity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RegisterLocalAccountWithSocialIdentityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerLocalAccountWithSocialIdentity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<RegisterLocalAccountWithSocialIdentityMutation, RegisterLocalAccountWithSocialIdentityMutationVariables>;
export const AccountByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}}]}}]}}]} as unknown as DocumentNode<AccountByIdQuery, AccountByIdQueryVariables>;
export const SearchResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"favorLocalResources"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"maxDistanceKm"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isService"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}}},{"kind":"Argument","name":{"kind":"Name","value":"favorLocalResources"},"value":{"kind":"Variable","name":{"kind":"Name","value":"favorLocalResources"}}},{"kind":"Argument","name":{"kind":"Name","value":"maxDistanceKm"},"value":{"kind":"Variable","name":{"kind":"Name","value":"maxDistanceKm"}}},{"kind":"Argument","name":{"kind":"Name","value":"isProduct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}}},{"kind":"Argument","name":{"kind":"Name","value":"isService"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isService"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeTakenAway"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeDelivered"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeExchanged"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeGiven"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"creatorDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicCampaignResourceLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}}]}}]}}]}}]} as unknown as DocumentNode<SearchResourcesQuery, SearchResourcesQueryVariables>;
export const MyResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"ID_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceCategoryAssignmentsByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryCode"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"campaignResourcesByResourceId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyResourcesQuery, MyResourcesQueryVariables>;
export const SearchNeedsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchNeeds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicCampaignNeedLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}}]}}]}}]}}]} as unknown as DocumentNode<SearchNeedsQuery, SearchNeedsQueryVariables>;
export const MyNeedsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNeeds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"objectRequired"}},{"kind":"Field","name":{"kind":"Name","value":"competenceRequired"}},{"kind":"Field","name":{"kind":"Name","value":"toolingRequired"}},{"kind":"Field","name":{"kind":"Name","value":"multiplePeopleRequired"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCompetenceText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredToolingText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPeopleCount"}},{"kind":"Field","name":{"kind":"Name","value":"campaignNeedsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"needClaimsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyNeedsQuery, MyNeedsQueryVariables>;
export const MyCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCampaigns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"campaignResourcesByCampaignId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"campaignNeedsByCampaignId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyCampaignsQuery, MyCampaignsQueryVariables>;
export const LinkableCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LinkableCampaigns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"moderationStatus"},"value":{"kind":"EnumValue","value":"APPROVED"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"START_AT_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]}}]} as unknown as DocumentNode<LinkableCampaignsQuery, LinkableCampaignsQueryVariables>;
export const ResourceByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}}]}}]}}]} as unknown as DocumentNode<ResourceByIdQuery, ResourceByIdQueryVariables>;
export const NeedByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NeedById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}}]}}]}}]} as unknown as DocumentNode<NeedByIdQuery, NeedByIdQueryVariables>;
export const CampaignByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CampaignById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]} as unknown as DocumentNode<CampaignByIdQuery, CampaignByIdQueryVariables>;
export const CreateResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateResourceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]} as unknown as DocumentNode<CreateResourceMutation, CreateResourceMutationVariables>;
export const CreateNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNeedInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"need"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]} as unknown as DocumentNode<CreateNeedMutation, CreateNeedMutationVariables>;
export const ClaimNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClaimNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClaimNeedInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaim"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<ClaimNeedMutation, ClaimNeedMutationVariables>;
export const CreateCampaignDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCampaign"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCampaignInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCampaign"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaign"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCampaignMutation, CreateCampaignMutationVariables>;
export const UpdateResourceByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateResourceById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourcePatch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ResourcePatch"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateResourceById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"resourcePatch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourcePatch"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceCategoryAssignmentsByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryCode"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"campaignResourcesByResourceId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateResourceByIdMutation, UpdateResourceByIdMutationVariables>;
export const ResourceCategoriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResourceCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CODE_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelFr"}}]}}]}}]}}]} as unknown as DocumentNode<ResourceCategoriesQuery, ResourceCategoriesQueryVariables>;
export const CreateResourceCategoryAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateResourceCategoryAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createResourceCategoryAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"resourceCategoryAssignment"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"categoryCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryCode"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceCategoryAssignment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryCode"}}]}}]}}]}}]} as unknown as DocumentNode<CreateResourceCategoryAssignmentMutation, CreateResourceCategoryAssignmentMutationVariables>;
export const DeleteResourceCategoryAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteResourceCategoryAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteResourceCategoryAssignmentByResourceIdAndCategoryCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"categoryCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryCode"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedResourceCategoryAssignmentId"}}]}}]}}]} as unknown as DocumentNode<DeleteResourceCategoryAssignmentMutation, DeleteResourceCategoryAssignmentMutationVariables>;
export const CreateCampaignNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCampaignNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCampaignNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignNeed"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignNeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCampaignNeedMutation, CreateCampaignNeedMutationVariables>;
export const DeleteCampaignNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCampaignNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCampaignNeedByCampaignIdAndNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedCampaignNeedId"}}]}}]}}]} as unknown as DocumentNode<DeleteCampaignNeedMutation, DeleteCampaignNeedMutationVariables>;
export const CreateCampaignResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCampaignResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCampaignResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignResource"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignResource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCampaignResourceMutation, CreateCampaignResourceMutationVariables>;
export const DeleteCampaignResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCampaignResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCampaignResourceByCampaignIdAndResourceId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedCampaignResourceId"}}]}}]}}]} as unknown as DocumentNode<DeleteCampaignResourceMutation, DeleteCampaignResourceMutationVariables>;
export const DeleteResourceByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteResourceById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteResourceById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedResourceId"}}]}}]}}]} as unknown as DocumentNode<DeleteResourceByIdMutation, DeleteResourceByIdMutationVariables>;
export const UpdateNeedByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNeedById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needPatch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NeedPatch"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNeedById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needPatch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needPatch"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"need"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"campaignNeedsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<UpdateNeedByIdMutation, UpdateNeedByIdMutationVariables>;
export const UpdateCampaignByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCampaignById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignPatch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CampaignPatch"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCampaignById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"campaignPatch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignPatch"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaign"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCampaignByIdMutation, UpdateCampaignByIdMutationVariables>;
export const SentResourceBidsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SentResourceBids"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sentResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByRespondedByAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<SentResourceBidsQuery, SentResourceBidsQueryVariables>;
export const ReceivedResourceBidsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReceivedResourceBids"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receivedResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByRespondedByAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ReceivedResourceBidsQuery, ReceivedResourceBidsQueryVariables>;
export const SentNeedClaimsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SentNeedClaims"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NeedClaimCondition"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeedClaims"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<SentNeedClaimsQuery, SentNeedClaimsQueryVariables>;
export const ReceivedNeedClaimsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReceivedNeedClaims"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"20"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ReceivedNeedClaimsQuery, ReceivedNeedClaimsQueryVariables>;
export const ChatConversationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatConversations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allChatConversationSummaries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"conversationKind"}},{"kind":"Field","name":{"kind":"Name","value":"contextTitle"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessagePreview"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}},{"kind":"Field","name":{"kind":"Name","value":"otherAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ChatConversationsQuery, ChatConversationsQueryVariables>;
export const ResourceConversationByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceConversationById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceConversationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByOwnerAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}}]}}]}}]}}]} as unknown as DocumentNode<ResourceConversationByIdQuery, ResourceConversationByIdQueryVariables>;
export const ResourceMessagesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceMessages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResourceMessages"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"conversationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"ID_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ResourceMessagesQuery, ResourceMessagesQueryVariables>;
export const CreateResourceMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateResourceMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateResourceMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createResourceMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}}]}}]}}]}}]} as unknown as DocumentNode<CreateResourceMessageMutation, CreateResourceMessageMutationVariables>;
export const MarkResourceMessagesReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkResourceMessagesRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkResourceMessagesReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markResourceMessagesRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integer"}}]}}]}}]} as unknown as DocumentNode<MarkResourceMessagesReadMutation, MarkResourceMessagesReadMutationVariables>;
export const AccountNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountNotificationCondition"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allAccountNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<AccountNotificationsQuery, AccountNotificationsQueryVariables>;
export const MarkAccountNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAccountNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkAccountNotificationReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAccountNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountNotification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<MarkAccountNotificationReadMutation, MarkAccountNotificationReadMutationVariables>;
export const MarkAllNotificationsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkAllNotificationsReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integer"}}]}}]}}]} as unknown as DocumentNode<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>;
export const AccountProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}}]}}]}}]} as unknown as DocumentNode<AccountProfileQuery, AccountProfileQueryVariables>;
export const UpdateAccountProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAccountProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountPatch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountPatch"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAccountById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountPatch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountPatch"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAccountProfileMutation, UpdateAccountProfileMutationVariables>;
export const CurrentTokenBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentTokenBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentTokenBalance"}}]}}]} as unknown as DocumentNode<CurrentTokenBalanceQuery, CurrentTokenBalanceQueryVariables>;
export const TokenHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TokenHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TokenMovementCondition"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allTokenMovements"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amountDelta"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<TokenHistoryQuery, TokenHistoryQueryVariables>;
export const AccountDeliveryPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountDeliveryPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"condition"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountDeliveryPreferenceCondition"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allAccountDeliveryPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"Variable","name":{"kind":"Name","value":"condition"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"eventCategory"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"summaryFrequencyDays"}}]}}]}}]}}]} as unknown as DocumentNode<AccountDeliveryPreferencesQuery, AccountDeliveryPreferencesQueryVariables>;
export const UpdateAccountDeliveryPreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAccountDeliveryPreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAccountDeliveryPreferenceByAccountIdAndEventCategory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountDeliveryPreference"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"eventCategory"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"summaryFrequencyDays"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAccountDeliveryPreferenceMutation, UpdateAccountDeliveryPreferenceMutationVariables>;
export const CreateAccountDeliveryPreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAccountDeliveryPreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAccountDeliveryPreferenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAccountDeliveryPreference"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountDeliveryPreference"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountId"}},{"kind":"Field","name":{"kind":"Name","value":"eventCategory"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"summaryFrequencyDays"}}]}}]}}]}}]} as unknown as DocumentNode<CreateAccountDeliveryPreferenceMutation, CreateAccountDeliveryPreferenceMutationVariables>;
export const InspirationCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InspirationCampaigns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"moderationStatus"},"value":{"kind":"EnumValue","value":"APPROVED"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<InspirationCampaignsQuery, InspirationCampaignsQueryVariables>;