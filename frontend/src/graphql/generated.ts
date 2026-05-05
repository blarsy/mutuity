import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A floating point number that requires more precision than IEEE 754 binary 64 */
  BigFloat: { input: any; output: any; }
  /**
   * A signed eight-byte integer. The upper big integer values are greater than the
   * max value for a JavaScript number. Therefore all big integers will be output as
   * strings and not numbers.
   */
  BigInt: { input: any; output: any; }
  /** A location in a connection that can be used for resuming pagination. */
  Cursor: { input: any; output: any; }
  /**
   * A point in time as described by the [ISO
   * 8601](https://en.wikipedia.org/wiki/ISO_8601) standard. May or may not include a timezone.
   */
  Datetime: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** A universally unique identifier as defined by [RFC 4122](https://tools.ietf.org/html/rfc4122). */
  UUID: { input: any; output: any; }
};

/** All input for the `acceptCampaignNeed` mutation. */
export type AcceptCampaignNeedInput = {
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `acceptCampaignNeed` mutation. */
export type AcceptCampaignNeedPayload = {
  __typename: 'AcceptCampaignNeedPayload';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignNeed: Maybe<CampaignNeed>;
  /** An edge for our `CampaignNeed`. May be used by Relay 1. */
  campaignNeedEdge: Maybe<CampaignNeedsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `acceptCampaignNeed` mutation. */
export type AcceptCampaignNeedPayloadCampaignNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};

export type Account = Node & {
  __typename: 'Account';
  /** Reads and enables pagination through a set of `AccountDeliveryPreference`. */
  accountDeliveryPreferencesByAccountId: AccountDeliveryPreferencesConnection;
  /** Reads and enables pagination through a set of `AccountNotification`. */
  accountNotificationsByRecipientAccountId: AccountNotificationsConnection;
  avatarUrl: Maybe<Scalars['String']['output']>;
  bio: Maybe<Scalars['String']['output']>;
  /** Reads and enables pagination through a set of `CampaignModerationAuditEvent`. */
  campaignModerationAuditEventsByActorAccountId: CampaignModerationAuditEventsConnection;
  /** Reads and enables pagination through a set of `CampaignModerationNote`. */
  campaignModerationNotesByManagerAccountId: CampaignModerationNotesConnection;
  /** Reads and enables pagination through a set of `CampaignNeed`. */
  campaignNeedsByActedByAccountId: CampaignNeedsConnection;
  /** Reads and enables pagination through a set of `CampaignResource`. */
  campaignResourcesByActedByAccountId: CampaignResourcesConnection;
  /** Reads and enables pagination through a set of `Campaign`. */
  campaignsByCreatorAccountId: CampaignsConnection;
  /** Reads and enables pagination through a set of `ChatTypingPresence`. */
  chatTypingPresencesByAccountId: ChatTypingPresencesConnection;
  /** Reads and enables pagination through a set of `ClaimConversation`. */
  claimConversationsByClaimerAccountId: ClaimConversationsConnection;
  /** Reads and enables pagination through a set of `ClaimConversation`. */
  claimConversationsByCreatorAccountId: ClaimConversationsConnection;
  /** Reads and enables pagination through a set of `ClaimMessage`. */
  claimMessagesBySenderAccountId: ClaimMessagesConnection;
  createdAt: Scalars['Datetime']['output'];
  displayName: Maybe<Scalars['String']['output']>;
  externalSubject: Scalars['String']['output'];
  /** Reads and enables pagination through a set of `GrantClaim`. */
  grantClaimsByAccountId: GrantClaimsConnection;
  /** Reads and enables pagination through a set of `GrantDefinition`. */
  grantDefinitionsByCreatedByAccountId: GrantDefinitionsConnection;
  /** Reads and enables pagination through a set of `GrantTargetAccount`. */
  grantTargetAccountsByAccountId: GrantTargetAccountsConnection;
  id: Scalars['UUID']['output'];
  latitude: Maybe<Scalars['BigFloat']['output']>;
  location: Maybe<Scalars['String']['output']>;
  longitude: Maybe<Scalars['BigFloat']['output']>;
  /** Reads and enables pagination through a set of `NeedClaimNotification`. */
  needClaimNotificationsByRecipientAccountId: NeedClaimNotificationsConnection;
  /** Reads and enables pagination through a set of `NeedClaimSettlementEvent`. */
  needClaimSettlementEventsByClaimerAccountId: NeedClaimSettlementEventsConnection;
  /** Reads and enables pagination through a set of `NeedClaimSettlementEvent`. */
  needClaimSettlementEventsBySettledByAccountId: NeedClaimSettlementEventsConnection;
  /** Reads and enables pagination through a set of `NeedClaim`. */
  needClaimsByClaimerAccountId: NeedClaimsConnection;
  /** Reads and enables pagination through a set of `NeedClaim`. */
  needClaimsBySettledByAccountId: NeedClaimsConnection;
  /** Reads and enables pagination through a set of `Need`. */
  needsByCreatorAccountId: NeedsConnection;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads and enables pagination through a set of `OperationalLog`. */
  operationalLogsByAccountId: OperationalLogsConnection;
  /** The account owner's preferred UI and email language. Supported values: en, fr. */
  preferredLanguage: Scalars['String']['output'];
  profileLinks: Scalars['JSON']['output'];
  /** Reads and enables pagination through a set of `ResourceBidNotification`. */
  resourceBidNotificationsByRecipientAccountId: ResourceBidNotificationsConnection;
  /** Reads and enables pagination through a set of `ResourceBid`. */
  resourceBidsByBidderAccountId: ResourceBidsConnection;
  /** Reads and enables pagination through a set of `ResourceBid`. */
  resourceBidsByRespondedByAccountId: ResourceBidsConnection;
  /** Reads and enables pagination through a set of `ResourceConversation`. */
  resourceConversationsByBidderAccountId: ResourceConversationsConnection;
  /** Reads and enables pagination through a set of `ResourceConversation`. */
  resourceConversationsByOwnerAccountId: ResourceConversationsConnection;
  /** Reads and enables pagination through a set of `ResourceMessage`. */
  resourceMessagesBySenderAccountId: ResourceMessagesConnection;
  /** Reads and enables pagination through a set of `Resource`. */
  resourcesByCreatorAccountId: ResourcesConnection;
  /** Reads and enables pagination through a set of `TokenMovement`. */
  tokenMovementsByAccountId: TokenMovementsConnection;
  /** Reads and enables pagination through a set of `TokenMovement`. */
  tokenMovementsByCounterpartyAccountId: TokenMovementsConnection;
  updatedAt: Scalars['Datetime']['output'];
};


export type AccountAccountDeliveryPreferencesByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<AccountDeliveryPreferenceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};


export type AccountAccountNotificationsByRecipientAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<AccountNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};


export type AccountCampaignModerationAuditEventsByActorAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationAuditEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};


export type AccountCampaignModerationNotesByManagerAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationNoteCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};


export type AccountCampaignNeedsByActedByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignNeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};


export type AccountCampaignResourcesByActedByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};


export type AccountCampaignsByCreatorAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};


export type AccountChatTypingPresencesByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ChatTypingPresenceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};


export type AccountClaimConversationsByClaimerAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};


export type AccountClaimConversationsByCreatorAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};


export type AccountClaimMessagesBySenderAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};


export type AccountGrantClaimsByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};


export type AccountGrantDefinitionsByCreatedByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantDefinitionCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};


export type AccountGrantTargetAccountsByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantTargetAccountCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};


export type AccountNeedClaimNotificationsByRecipientAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};


export type AccountNeedClaimSettlementEventsByClaimerAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimSettlementEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};


export type AccountNeedClaimSettlementEventsBySettledByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimSettlementEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};


export type AccountNeedClaimsByClaimerAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};


export type AccountNeedClaimsBySettledByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};


export type AccountNeedsByCreatorAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedsOrderBy>>;
};


export type AccountOperationalLogsByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<OperationalLogCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<OperationalLogsOrderBy>>;
};


export type AccountResourceBidNotificationsByRecipientAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};


export type AccountResourceBidsByBidderAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};


export type AccountResourceBidsByRespondedByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};


export type AccountResourceConversationsByBidderAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};


export type AccountResourceConversationsByOwnerAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};


export type AccountResourceMessagesBySenderAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};


export type AccountResourcesByCreatorAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};


export type AccountTokenMovementsByAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<TokenMovementCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};


export type AccountTokenMovementsByCounterpartyAccountIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<TokenMovementCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};

/** A condition to be used against `Account` object types. All fields are tested for equality and combined with a logical ‘and.’ */
export type AccountCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `externalSubject` field. */
  externalSubject?: InputMaybe<Scalars['String']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
};

/** Per-account delivery preferences for out-of-app notifications by managed event category. */
export type AccountDeliveryPreference = Node & {
  __typename: 'AccountDeliveryPreference';
  /** Reads a single `Account` that is related to this `AccountDeliveryPreference`. */
  accountByAccountId: Maybe<Account>;
  accountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** Out-of-app delivery strategy per category: realtime_push or email_summary. */
  deliveryStrategy: Scalars['String']['output'];
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: Scalars['String']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30. */
  summaryFrequencyDays: Scalars['Int']['output'];
  updatedAt: Scalars['Datetime']['output'];
};

/**
 * A condition to be used against `AccountDeliveryPreference` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type AccountDeliveryPreferenceCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `AccountDeliveryPreference` */
export type AccountDeliveryPreferenceInput = {
  accountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Out-of-app delivery strategy per category: realtime_push or email_summary. */
  deliveryStrategy?: InputMaybe<Scalars['String']['input']>;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: Scalars['String']['input'];
  /** Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30. */
  summaryFrequencyDays?: InputMaybe<Scalars['Int']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Represents an update to a `AccountDeliveryPreference`. Fields that are set will be updated. */
export type AccountDeliveryPreferencePatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Out-of-app delivery strategy per category: realtime_push or email_summary. */
  deliveryStrategy?: InputMaybe<Scalars['String']['input']>;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory?: InputMaybe<Scalars['String']['input']>;
  /** Digest cadence in days for email_summary strategy. Allowed values: 1, 3, 7, 30. */
  summaryFrequencyDays?: InputMaybe<Scalars['Int']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `AccountDeliveryPreference` values. */
export type AccountDeliveryPreferencesConnection = {
  __typename: 'AccountDeliveryPreferencesConnection';
  /** A list of edges which contains the `AccountDeliveryPreference` and cursor to aid in pagination. */
  edges: Array<AccountDeliveryPreferencesEdge>;
  /** A list of `AccountDeliveryPreference` objects. */
  nodes: Array<AccountDeliveryPreference>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `AccountDeliveryPreference` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `AccountDeliveryPreference` edge in the connection. */
export type AccountDeliveryPreferencesEdge = {
  __typename: 'AccountDeliveryPreferencesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AccountDeliveryPreference` at the end of the edge. */
  node: AccountDeliveryPreference;
};

/** Methods to use when ordering `AccountDeliveryPreference`. */
export enum AccountDeliveryPreferencesOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** An input for mutations affecting `Account` */
export type AccountInput = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  externalSubject: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  /** The account owner's preferred UI and email language. Supported values: en, fr. */
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  profileLinks?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Generic account-scoped notifications for gifts, profile rewards, campaigns, and other non-claim/bid events. */
export type AccountNotification = Node & {
  __typename: 'AccountNotification';
  /** Reads a single `Account` that is related to this `AccountNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  createdAt: Scalars['Datetime']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  readAt: Maybe<Scalars['Datetime']['output']>;
  recipientAccountId: Scalars['UUID']['output'];
};

/**
 * A condition to be used against `AccountNotification` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type AccountNotificationCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `recipientAccountId` field. */
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `AccountNotification` */
export type AccountNotificationInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId: Scalars['UUID']['input'];
};

/** Represents an update to a `AccountNotification`. Fields that are set will be updated. */
export type AccountNotificationPatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `AccountNotification` values. */
export type AccountNotificationsConnection = {
  __typename: 'AccountNotificationsConnection';
  /** A list of edges which contains the `AccountNotification` and cursor to aid in pagination. */
  edges: Array<AccountNotificationsEdge>;
  /** A list of `AccountNotification` objects. */
  nodes: Array<AccountNotification>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `AccountNotification` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `AccountNotification` edge in the connection. */
export type AccountNotificationsEdge = {
  __typename: 'AccountNotificationsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AccountNotification` at the end of the edge. */
  node: AccountNotification;
};

/** Methods to use when ordering `AccountNotification`. */
export enum AccountNotificationsOrderBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  RecipientAccountIdAsc = 'RECIPIENT_ACCOUNT_ID_ASC',
  RecipientAccountIdDesc = 'RECIPIENT_ACCOUNT_ID_DESC'
}

/** Represents an update to a `Account`. Fields that are set will be updated. */
export type AccountPatch = {
  avatarUrl?: InputMaybe<Scalars['String']['input']>;
  bio?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  externalSubject?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  /** The account owner's preferred UI and email language. Supported values: en, fr. */
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  profileLinks?: InputMaybe<Scalars['JSON']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `Account` values. */
export type AccountsConnection = {
  __typename: 'AccountsConnection';
  /** A list of edges which contains the `Account` and cursor to aid in pagination. */
  edges: Array<AccountsEdge>;
  /** A list of `Account` objects. */
  nodes: Array<Account>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Account` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `Account` edge in the connection. */
export type AccountsEdge = {
  __typename: 'AccountsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `Account` at the end of the edge. */
  node: Account;
};

/** Methods to use when ordering `Account`. */
export enum AccountsOrderBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  ExternalSubjectAsc = 'EXTERNAL_SUBJECT_ASC',
  ExternalSubjectDesc = 'EXTERNAL_SUBJECT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** All input for the `addCampaignModerationNote` mutation. */
export type AddCampaignModerationNoteInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `addCampaignModerationNote` mutation. */
export type AddCampaignModerationNotePayload = {
  __typename: 'AddCampaignModerationNotePayload';
  /** Reads a single `Account` that is related to this `CampaignModerationNote`. */
  accountByManagerAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationNote`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignModerationNote: Maybe<CampaignModerationNote>;
  /** An edge for our `CampaignModerationNote`. May be used by Relay 1. */
  campaignModerationNoteEdge: Maybe<CampaignModerationNotesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `addCampaignModerationNote` mutation. */
export type AddCampaignModerationNotePayloadCampaignModerationNoteEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};

/** All input for the `adminGetMailContent` mutation. */
export type AdminGetMailContentInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pMailId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `adminGetMailContent` mutation. */
export type AdminGetMailContentPayload = {
  __typename: 'AdminGetMailContentPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  string: Maybe<Scalars['String']['output']>;
};

/** A `AdminListAccountsRecord` edge in the connection. */
export type AdminListAccountEdge = {
  __typename: 'AdminListAccountEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListAccountsRecord` at the end of the edge. */
  node: AdminListAccountsRecord;
};

/** A connection to a list of `AdminListAccountsRecord` values. */
export type AdminListAccountsConnection = {
  __typename: 'AdminListAccountsConnection';
  /** A list of edges which contains the `AdminListAccountsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListAccountEdge>;
  /** A list of `AdminListAccountsRecord` objects. */
  nodes: Array<AdminListAccountsRecord>;
  /** The count of *all* `AdminListAccountsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListAccounts` query. */
export type AdminListAccountsRecord = {
  __typename: 'AdminListAccountsRecord';
  address: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  language: Maybe<Scalars['String']['output']>;
  name: Maybe<Scalars['String']['output']>;
  tokenAmount: Maybe<Scalars['Int']['output']>;
};

/** A `AdminListBidsRecord` edge in the connection. */
export type AdminListBidEdge = {
  __typename: 'AdminListBidEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListBidsRecord` at the end of the edge. */
  node: AdminListBidsRecord;
};

/** A connection to a list of `AdminListBidsRecord` values. */
export type AdminListBidsConnection = {
  __typename: 'AdminListBidsConnection';
  /** A list of edges which contains the `AdminListBidsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListBidEdge>;
  /** A list of `AdminListBidsRecord` objects. */
  nodes: Array<AdminListBidsRecord>;
  /** The count of *all* `AdminListBidsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListBids` query. */
export type AdminListBidsRecord = {
  __typename: 'AdminListBidsRecord';
  bidderName: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  expirationDatetime: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  intensity: Maybe<NeedIntensity>;
  receiverName: Maybe<Scalars['String']['output']>;
  resourceTitle: Maybe<Scalars['String']['output']>;
  status: Maybe<ResourceBidStatus>;
  tokenAmount: Maybe<Scalars['Int']['output']>;
};

/** A `AdminListCampaignsRecord` edge in the connection. */
export type AdminListCampaignEdge = {
  __typename: 'AdminListCampaignEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListCampaignsRecord` at the end of the edge. */
  node: AdminListCampaignsRecord;
};

/** A connection to a list of `AdminListCampaignsRecord` values. */
export type AdminListCampaignsConnection = {
  __typename: 'AdminListCampaignsConnection';
  /** A list of edges which contains the `AdminListCampaignsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListCampaignEdge>;
  /** A list of `AdminListCampaignsRecord` objects. */
  nodes: Array<AdminListCampaignsRecord>;
  /** The count of *all* `AdminListCampaignsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListCampaigns` query. */
export type AdminListCampaignsRecord = {
  __typename: 'AdminListCampaignsRecord';
  airdropDatetime: Maybe<Scalars['Datetime']['output']>;
  airdropTokenAmount: Maybe<Scalars['Int']['output']>;
  beginDatetime: Maybe<Scalars['Datetime']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  creatorName: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  endDatetime: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  moderationStatus: Maybe<CampaignModerationStatus>;
  resourceRewardsMultiplier: Maybe<Scalars['Int']['output']>;
  summary: Maybe<Scalars['String']['output']>;
};

/** A `AdminListGrantsRecord` edge in the connection. */
export type AdminListGrantEdge = {
  __typename: 'AdminListGrantEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListGrantsRecord` at the end of the edge. */
  node: AdminListGrantsRecord;
};

/** A connection to a list of `AdminListGrantsRecord` values. */
export type AdminListGrantsConnection = {
  __typename: 'AdminListGrantsConnection';
  /** A list of edges which contains the `AdminListGrantsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListGrantEdge>;
  /** A list of `AdminListGrantsRecord` objects. */
  nodes: Array<AdminListGrantsRecord>;
  /** The count of *all* `AdminListGrantsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListGrants` query. */
export type AdminListGrantsRecord = {
  __typename: 'AdminListGrantsRecord';
  amountGranted: Maybe<Scalars['Int']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  description: Maybe<Scalars['String']['output']>;
  expirationDatetime: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

/** A `AdminListLogsRecord` edge in the connection. */
export type AdminListLogEdge = {
  __typename: 'AdminListLogEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListLogsRecord` at the end of the edge. */
  node: AdminListLogsRecord;
};

/** A connection to a list of `AdminListLogsRecord` values. */
export type AdminListLogsConnection = {
  __typename: 'AdminListLogsConnection';
  /** A list of edges which contains the `AdminListLogsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListLogEdge>;
  /** A list of `AdminListLogsRecord` objects. */
  nodes: Array<AdminListLogsRecord>;
  /** The count of *all* `AdminListLogsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListLogs` query. */
export type AdminListLogsRecord = {
  __typename: 'AdminListLogsRecord';
  component: Maybe<Scalars['String']['output']>;
  context: Maybe<Scalars['String']['output']>;
  message: Maybe<Scalars['String']['output']>;
  severity: Maybe<Scalars['String']['output']>;
  timestamp: Maybe<Scalars['Datetime']['output']>;
};

/** A `AdminListMailsRecord` edge in the connection. */
export type AdminListMailEdge = {
  __typename: 'AdminListMailEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListMailsRecord` at the end of the edge. */
  node: AdminListMailsRecord;
};

/** A connection to a list of `AdminListMailsRecord` values. */
export type AdminListMailsConnection = {
  __typename: 'AdminListMailsConnection';
  /** A list of edges which contains the `AdminListMailsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListMailEdge>;
  /** A list of `AdminListMailsRecord` objects. */
  nodes: Array<AdminListMailsRecord>;
  /** The count of *all* `AdminListMailsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListMails` query. */
export type AdminListMailsRecord = {
  __typename: 'AdminListMailsRecord';
  createdAt: Maybe<Scalars['Datetime']['output']>;
  email: Maybe<Scalars['String']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  recipientAccountName: Maybe<Scalars['String']['output']>;
  subject: Maybe<Scalars['String']['output']>;
};

/** A `AdminListNotificationsRecord` edge in the connection. */
export type AdminListNotificationEdge = {
  __typename: 'AdminListNotificationEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListNotificationsRecord` at the end of the edge. */
  node: AdminListNotificationsRecord;
};

/** A connection to a list of `AdminListNotificationsRecord` values. */
export type AdminListNotificationsConnection = {
  __typename: 'AdminListNotificationsConnection';
  /** A list of edges which contains the `AdminListNotificationsRecord` and cursor to aid in pagination. */
  edges: Array<AdminListNotificationEdge>;
  /** A list of `AdminListNotificationsRecord` objects. */
  nodes: Array<AdminListNotificationsRecord>;
  /** The count of *all* `AdminListNotificationsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListNotifications` query. */
export type AdminListNotificationsRecord = {
  __typename: 'AdminListNotificationsRecord';
  accountName: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  data: Maybe<Scalars['JSON']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  readAt: Maybe<Scalars['Datetime']['output']>;
};

/** A `AdminListResourcesRecord` edge in the connection. */
export type AdminListResourceEdge = {
  __typename: 'AdminListResourceEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `AdminListResourcesRecord` at the end of the edge. */
  node: AdminListResourcesRecord;
};

/** A connection to a list of `AdminListResourcesRecord` values. */
export type AdminListResourcesConnection = {
  __typename: 'AdminListResourcesConnection';
  /** A list of edges which contains the `AdminListResourcesRecord` and cursor to aid in pagination. */
  edges: Array<AdminListResourceEdge>;
  /** A list of `AdminListResourcesRecord` objects. */
  nodes: Array<AdminListResourcesRecord>;
  /** The count of *all* `AdminListResourcesRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `adminListResources` query. */
export type AdminListResourcesRecord = {
  __typename: 'AdminListResourcesRecord';
  createdAt: Maybe<Scalars['Datetime']['output']>;
  creatorName: Maybe<Scalars['String']['output']>;
  expirationDatetime: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  imageCount: Maybe<Scalars['Int']['output']>;
  intensity: Maybe<NeedIntensity>;
  location: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  tokenAmount: Maybe<Scalars['Int']['output']>;
};

/** All input for the `adminResendMail` mutation. */
export type AdminResendMailInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pMailId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `adminResendMail` mutation. */
export type AdminResendMailPayload = {
  __typename: 'AdminResendMailPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `approveCampaign` mutation. */
export type ApproveCampaignInput = {
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `approveCampaign` mutation. */
export type ApproveCampaignPayload = {
  __typename: 'ApproveCampaignPayload';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  campaign: Maybe<Campaign>;
  /** An edge for our `Campaign`. May be used by Relay 1. */
  campaignEdge: Maybe<CampaignsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `approveCampaign` mutation. */
export type ApproveCampaignPayloadCampaignEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};

/** All input for the `archiveGrant` mutation. */
export type ArchiveGrantInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `archiveGrant` mutation. */
export type ArchiveGrantPayload = {
  __typename: 'ArchiveGrantPayload';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  grantDefinition: Maybe<GrantDefinition>;
  /** An edge for our `GrantDefinition`. May be used by Relay 1. */
  grantDefinitionEdge: Maybe<GrantDefinitionsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `archiveGrant` mutation. */
export type ArchiveGrantPayloadGrantDefinitionEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

export type AuthChangePasswordInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type AuthChangePasswordPayload = {
  __typename: 'AuthChangePasswordPayload';
  authSession: AuthSessionPayload;
  clientMutationId: Maybe<Scalars['String']['output']>;
};

export type AuthLoginInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type AuthLoginPayload = {
  __typename: 'AuthLoginPayload';
  authSession: AuthSessionPayload;
  clientMutationId: Maybe<Scalars['String']['output']>;
};

export type AuthLogoutInput = {
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

export type AuthLogoutPayload = {
  __typename: 'AuthLogoutPayload';
  authSession: AuthSessionPayload;
  clientMutationId: Maybe<Scalars['String']['output']>;
};

export type AuthSessionAccount = {
  __typename: 'AuthSessionAccount';
  avatarUrl: Maybe<Scalars['String']['output']>;
  displayName: Maybe<Scalars['String']['output']>;
  emailVerified: Scalars['Boolean']['output'];
  externalSubject: Scalars['String']['output'];
  id: Scalars['String']['output'];
  preferredLanguage: Scalars['String']['output'];
};

export type AuthSessionPayload = {
  __typename: 'AuthSessionPayload';
  account: Maybe<AuthSessionAccount>;
  authenticated: Scalars['Boolean']['output'];
  expiresAt: Maybe<Scalars['String']['output']>;
  role: Scalars['String']['output'];
};

/** Campaign submitted by an account and moderated before going live. */
export type Campaign = Node & {
  __typename: 'Campaign';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  airdropAmount: Scalars['Int']['output'];
  airdropAt: Scalars['Datetime']['output'];
  /** Reads and enables pagination through a set of `CampaignModerationAuditEvent`. */
  campaignModerationAuditEventsByCampaignId: CampaignModerationAuditEventsConnection;
  /** Reads and enables pagination through a set of `CampaignModerationNote`. */
  campaignModerationNotesByCampaignId: CampaignModerationNotesConnection;
  /** Reads and enables pagination through a set of `CampaignNeed`. */
  campaignNeedsByCampaignId: CampaignNeedsConnection;
  /** Reads and enables pagination through a set of `CampaignResource`. */
  campaignResourcesByCampaignId: CampaignResourcesConnection;
  createdAt: Scalars['Datetime']['output'];
  creatorAccountId: Scalars['UUID']['output'];
  endAt: Scalars['Datetime']['output'];
  /** Reads and enables pagination through a set of `GrantDefinition`. */
  grantDefinitionsByLinkedCampaignId: GrantDefinitionsConnection;
  id: Scalars['UUID']['output'];
  managerNoteFromCreator: Maybe<Scalars['String']['output']>;
  moderationStatus: CampaignModerationStatus;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  rewardsMultiplier: Scalars['Int']['output'];
  startAt: Scalars['Datetime']['output'];
  theme: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Datetime']['output'];
};


/** Campaign submitted by an account and moderated before going live. */
export type CampaignCampaignModerationAuditEventsByCampaignIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationAuditEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};


/** Campaign submitted by an account and moderated before going live. */
export type CampaignCampaignModerationNotesByCampaignIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationNoteCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};


/** Campaign submitted by an account and moderated before going live. */
export type CampaignCampaignNeedsByCampaignIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignNeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};


/** Campaign submitted by an account and moderated before going live. */
export type CampaignCampaignResourcesByCampaignIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};


/** Campaign submitted by an account and moderated before going live. */
export type CampaignGrantDefinitionsByLinkedCampaignIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantDefinitionCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

/**
 * A condition to be used against `Campaign` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type CampaignCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `creatorAccountId` field. */
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `moderationStatus` field. */
  moderationStatus?: InputMaybe<CampaignModerationStatus>;
  /** Checks for equality with the object’s `startAt` field. */
  startAt?: InputMaybe<Scalars['Datetime']['input']>;
};

export type CampaignModerationAuditEvent = Node & {
  __typename: 'CampaignModerationAuditEvent';
  /** Reads a single `Account` that is related to this `CampaignModerationAuditEvent`. */
  accountByActorAccountId: Maybe<Account>;
  actorAccountId: Scalars['UUID']['output'];
  body: Maybe<Scalars['String']['output']>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationAuditEvent`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};

/**
 * A condition to be used against `CampaignModerationAuditEvent` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type CampaignModerationAuditEventCondition = {
  /** Checks for equality with the object’s `actorAccountId` field. */
  actorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `campaignId` field. */
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `CampaignModerationAuditEvent` */
export type CampaignModerationAuditEventInput = {
  actorAccountId: Scalars['UUID']['input'];
  body?: InputMaybe<Scalars['String']['input']>;
  campaignId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
};

/** Represents an update to a `CampaignModerationAuditEvent`. Fields that are set will be updated. */
export type CampaignModerationAuditEventPatch = {
  actorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `CampaignModerationAuditEvent` values. */
export type CampaignModerationAuditEventsConnection = {
  __typename: 'CampaignModerationAuditEventsConnection';
  /** A list of edges which contains the `CampaignModerationAuditEvent` and cursor to aid in pagination. */
  edges: Array<CampaignModerationAuditEventsEdge>;
  /** A list of `CampaignModerationAuditEvent` objects. */
  nodes: Array<CampaignModerationAuditEvent>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `CampaignModerationAuditEvent` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `CampaignModerationAuditEvent` edge in the connection. */
export type CampaignModerationAuditEventsEdge = {
  __typename: 'CampaignModerationAuditEventsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `CampaignModerationAuditEvent` at the end of the edge. */
  node: CampaignModerationAuditEvent;
};

/** Methods to use when ordering `CampaignModerationAuditEvent`. */
export enum CampaignModerationAuditEventsOrderBy {
  ActorAccountIdAsc = 'ACTOR_ACCOUNT_ID_ASC',
  ActorAccountIdDesc = 'ACTOR_ACCOUNT_ID_DESC',
  CampaignIdAsc = 'CAMPAIGN_ID_ASC',
  CampaignIdDesc = 'CAMPAIGN_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** A `CampaignModerationEventsRecord` edge in the connection. */
export type CampaignModerationEventEdge = {
  __typename: 'CampaignModerationEventEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `CampaignModerationEventsRecord` at the end of the edge. */
  node: CampaignModerationEventsRecord;
};

/** A connection to a list of `CampaignModerationEventsRecord` values. */
export type CampaignModerationEventsConnection = {
  __typename: 'CampaignModerationEventsConnection';
  /** A list of edges which contains the `CampaignModerationEventsRecord` and cursor to aid in pagination. */
  edges: Array<CampaignModerationEventEdge>;
  /** A list of `CampaignModerationEventsRecord` objects. */
  nodes: Array<CampaignModerationEventsRecord>;
  /** The count of *all* `CampaignModerationEventsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `campaignModerationEvents` query. */
export type CampaignModerationEventsRecord = {
  __typename: 'CampaignModerationEventsRecord';
  actorAccountId: Maybe<Scalars['UUID']['output']>;
  body: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  eventType: Maybe<Scalars['String']['output']>;
};

export type CampaignModerationNote = Node & {
  __typename: 'CampaignModerationNote';
  /** Reads a single `Account` that is related to this `CampaignModerationNote`. */
  accountByManagerAccountId: Maybe<Account>;
  body: Scalars['String']['output'];
  /** Reads a single `Campaign` that is related to this `CampaignModerationNote`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  managerAccountId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};

/**
 * A condition to be used against `CampaignModerationNote` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type CampaignModerationNoteCondition = {
  /** Checks for equality with the object’s `campaignId` field. */
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `managerAccountId` field. */
  managerAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `CampaignModerationNote` */
export type CampaignModerationNoteInput = {
  body: Scalars['String']['input'];
  campaignId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  managerAccountId: Scalars['UUID']['input'];
};

/** Represents an update to a `CampaignModerationNote`. Fields that are set will be updated. */
export type CampaignModerationNotePatch = {
  body?: InputMaybe<Scalars['String']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  managerAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `CampaignModerationNote` values. */
export type CampaignModerationNotesConnection = {
  __typename: 'CampaignModerationNotesConnection';
  /** A list of edges which contains the `CampaignModerationNote` and cursor to aid in pagination. */
  edges: Array<CampaignModerationNotesEdge>;
  /** A list of `CampaignModerationNote` objects. */
  nodes: Array<CampaignModerationNote>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `CampaignModerationNote` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `CampaignModerationNote` edge in the connection. */
export type CampaignModerationNotesEdge = {
  __typename: 'CampaignModerationNotesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `CampaignModerationNote` at the end of the edge. */
  node: CampaignModerationNote;
};

/** Methods to use when ordering `CampaignModerationNote`. */
export enum CampaignModerationNotesOrderBy {
  CampaignIdAsc = 'CAMPAIGN_ID_ASC',
  CampaignIdDesc = 'CAMPAIGN_ID_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  ManagerAccountIdAsc = 'MANAGER_ACCOUNT_ID_ASC',
  ManagerAccountIdDesc = 'MANAGER_ACCOUNT_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

export enum CampaignModerationStatus {
  Approved = 'APPROVED',
  AwaitingAdaptation = 'AWAITING_ADAPTATION',
  Pending = 'PENDING'
}

export type CampaignNeed = Node & {
  __typename: 'CampaignNeed';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  actedAt: Maybe<Scalars['Datetime']['output']>;
  actedByAccountId: Maybe<Scalars['UUID']['output']>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  needId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  status: CampaignNeedStatus;
};

/**
 * A condition to be used against `CampaignNeed` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type CampaignNeedCondition = {
  /** Checks for equality with the object’s `actedByAccountId` field. */
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `campaignId` field. */
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `needId` field. */
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `CampaignNeed` */
export type CampaignNeedInput = {
  actedAt?: InputMaybe<Scalars['Datetime']['input']>;
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  campaignId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  needId: Scalars['UUID']['input'];
  status?: InputMaybe<CampaignNeedStatus>;
};

/** Represents an update to a `CampaignNeed`. Fields that are set will be updated. */
export type CampaignNeedPatch = {
  actedAt?: InputMaybe<Scalars['Datetime']['input']>;
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<CampaignNeedStatus>;
};

export enum CampaignNeedStatus {
  Accepted = 'ACCEPTED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** A connection to a list of `CampaignNeed` values. */
export type CampaignNeedsConnection = {
  __typename: 'CampaignNeedsConnection';
  /** A list of edges which contains the `CampaignNeed` and cursor to aid in pagination. */
  edges: Array<CampaignNeedsEdge>;
  /** A list of `CampaignNeed` objects. */
  nodes: Array<CampaignNeed>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `CampaignNeed` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `CampaignNeed` edge in the connection. */
export type CampaignNeedsEdge = {
  __typename: 'CampaignNeedsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `CampaignNeed` at the end of the edge. */
  node: CampaignNeed;
};

/** Methods to use when ordering `CampaignNeed`. */
export enum CampaignNeedsOrderBy {
  ActedByAccountIdAsc = 'ACTED_BY_ACCOUNT_ID_ASC',
  ActedByAccountIdDesc = 'ACTED_BY_ACCOUNT_ID_DESC',
  CampaignIdAsc = 'CAMPAIGN_ID_ASC',
  CampaignIdDesc = 'CAMPAIGN_ID_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  Natural = 'NATURAL',
  NeedIdAsc = 'NEED_ID_ASC',
  NeedIdDesc = 'NEED_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Represents an update to a `Campaign`. Fields that are set will be updated. */
export type CampaignPatch = {
  airdropAmount?: InputMaybe<Scalars['Int']['input']>;
  airdropAt?: InputMaybe<Scalars['Datetime']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  endAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  managerNoteFromCreator?: InputMaybe<Scalars['String']['input']>;
  moderationStatus?: InputMaybe<CampaignModerationStatus>;
  rewardsMultiplier?: InputMaybe<Scalars['Int']['input']>;
  startAt?: InputMaybe<Scalars['Datetime']['input']>;
  theme?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Approved or pending links between campaigns and resources, used for campaign detail visibility and airdrop eligibility. */
export type CampaignResource = Node & {
  __typename: 'CampaignResource';
  /** Reads a single `Account` that is related to this `CampaignResource`. */
  accountByActedByAccountId: Maybe<Account>;
  actedAt: Maybe<Scalars['Datetime']['output']>;
  actedByAccountId: Maybe<Scalars['UUID']['output']>;
  /** Reads a single `Campaign` that is related to this `CampaignResource`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads a single `Resource` that is related to this `CampaignResource`. */
  resourceByResourceId: Maybe<Resource>;
  resourceId: Scalars['UUID']['output'];
  status: CampaignNeedStatus;
};

/**
 * A condition to be used against `CampaignResource` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type CampaignResourceCondition = {
  /** Checks for equality with the object’s `actedByAccountId` field. */
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `campaignId` field. */
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `resourceId` field. */
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `CampaignResource` */
export type CampaignResourceInput = {
  actedAt?: InputMaybe<Scalars['Datetime']['input']>;
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  campaignId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  resourceId: Scalars['UUID']['input'];
  status?: InputMaybe<CampaignNeedStatus>;
};

/** Represents an update to a `CampaignResource`. Fields that are set will be updated. */
export type CampaignResourcePatch = {
  actedAt?: InputMaybe<Scalars['Datetime']['input']>;
  actedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<CampaignNeedStatus>;
};

/** A connection to a list of `CampaignResource` values. */
export type CampaignResourcesConnection = {
  __typename: 'CampaignResourcesConnection';
  /** A list of edges which contains the `CampaignResource` and cursor to aid in pagination. */
  edges: Array<CampaignResourcesEdge>;
  /** A list of `CampaignResource` objects. */
  nodes: Array<CampaignResource>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `CampaignResource` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `CampaignResource` edge in the connection. */
export type CampaignResourcesEdge = {
  __typename: 'CampaignResourcesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `CampaignResource` at the end of the edge. */
  node: CampaignResource;
};

/** Methods to use when ordering `CampaignResource`. */
export enum CampaignResourcesOrderBy {
  ActedByAccountIdAsc = 'ACTED_BY_ACCOUNT_ID_ASC',
  ActedByAccountIdDesc = 'ACTED_BY_ACCOUNT_ID_DESC',
  CampaignIdAsc = 'CAMPAIGN_ID_ASC',
  CampaignIdDesc = 'CAMPAIGN_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ResourceIdAsc = 'RESOURCE_ID_ASC',
  ResourceIdDesc = 'RESOURCE_ID_DESC'
}

/** A connection to a list of `Campaign` values. */
export type CampaignsConnection = {
  __typename: 'CampaignsConnection';
  /** A list of edges which contains the `Campaign` and cursor to aid in pagination. */
  edges: Array<CampaignsEdge>;
  /** A list of `Campaign` objects. */
  nodes: Array<Campaign>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Campaign` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `Campaign` edge in the connection. */
export type CampaignsEdge = {
  __typename: 'CampaignsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `Campaign` at the end of the edge. */
  node: Campaign;
};

/** Methods to use when ordering `Campaign`. */
export enum CampaignsOrderBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  CreatorAccountIdAsc = 'CREATOR_ACCOUNT_ID_ASC',
  CreatorAccountIdDesc = 'CREATOR_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  ModerationStatusAsc = 'MODERATION_STATUS_ASC',
  ModerationStatusDesc = 'MODERATION_STATUS_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  StartAtAsc = 'START_AT_ASC',
  StartAtDesc = 'START_AT_DESC'
}

/** All input for the `cancelNeedClaim` mutation. */
export type CancelNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `cancelNeedClaim` mutation. */
export type CancelNeedClaimPayload = {
  __typename: 'CancelNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `cancelNeedClaim` mutation. */
export type CancelNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `cancelResourceBid` mutation. */
export type CancelResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `cancelResourceBid` mutation. */
export type CancelResourceBidPayload = {
  __typename: 'CancelResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our `cancelResourceBid` mutation. */
export type CancelResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

export enum ChatContextKind {
  Need = 'NEED',
  Resource = 'RESOURCE'
}

/** A connection to a list of `ChatConversationSummary` values. */
export type ChatConversationSummariesConnection = {
  __typename: 'ChatConversationSummariesConnection';
  /** A list of edges which contains the `ChatConversationSummary` and cursor to aid in pagination. */
  edges: Array<ChatConversationSummariesEdge>;
  /** A list of `ChatConversationSummary` objects. */
  nodes: Array<ChatConversationSummary>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ChatConversationSummary` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ChatConversationSummary` edge in the connection. */
export type ChatConversationSummariesEdge = {
  __typename: 'ChatConversationSummariesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ChatConversationSummary` at the end of the edge. */
  node: ChatConversationSummary;
};

/** Methods to use when ordering `ChatConversationSummary`. */
export enum ChatConversationSummariesOrderBy {
  Natural = 'NATURAL'
}

/** Read model that lists both need and resource conversations per participant account. */
export type ChatConversationSummary = {
  __typename: 'ChatConversationSummary';
  contextId: Maybe<Scalars['UUID']['output']>;
  contextTitle: Maybe<Scalars['String']['output']>;
  conversationId: Maybe<Scalars['UUID']['output']>;
  conversationKind: Maybe<ChatContextKind>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  lastActivityAt: Maybe<Scalars['Datetime']['output']>;
  lastMessagePreview: Maybe<Scalars['String']['output']>;
  otherAccountId: Maybe<Scalars['UUID']['output']>;
  participantAccountId: Maybe<Scalars['UUID']['output']>;
  unreadCount: Maybe<Scalars['Int']['output']>;
};

export type ChatTypingPresence = Node & {
  __typename: 'ChatTypingPresence';
  /** Reads a single `Account` that is related to this `ChatTypingPresence`. */
  accountByAccountId: Maybe<Account>;
  accountId: Scalars['UUID']['output'];
  conversationId: Scalars['UUID']['output'];
  conversationKind: ChatContextKind;
  createdAt: Scalars['Datetime']['output'];
  lastTypedAt: Scalars['Datetime']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  updatedAt: Scalars['Datetime']['output'];
};

/**
 * A condition to be used against `ChatTypingPresence` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ChatTypingPresenceCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `conversationKind` field. */
  conversationKind?: InputMaybe<ChatContextKind>;
};

/** An input for mutations affecting `ChatTypingPresence` */
export type ChatTypingPresenceInput = {
  accountId: Scalars['UUID']['input'];
  conversationId: Scalars['UUID']['input'];
  conversationKind: ChatContextKind;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  lastTypedAt?: InputMaybe<Scalars['Datetime']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Represents an update to a `ChatTypingPresence`. Fields that are set will be updated. */
export type ChatTypingPresencePatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  conversationKind?: InputMaybe<ChatContextKind>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  lastTypedAt?: InputMaybe<Scalars['Datetime']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `ChatTypingPresence` values. */
export type ChatTypingPresencesConnection = {
  __typename: 'ChatTypingPresencesConnection';
  /** A list of edges which contains the `ChatTypingPresence` and cursor to aid in pagination. */
  edges: Array<ChatTypingPresencesEdge>;
  /** A list of `ChatTypingPresence` objects. */
  nodes: Array<ChatTypingPresence>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ChatTypingPresence` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ChatTypingPresence` edge in the connection. */
export type ChatTypingPresencesEdge = {
  __typename: 'ChatTypingPresencesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ChatTypingPresence` at the end of the edge. */
  node: ChatTypingPresence;
};

/** Methods to use when ordering `ChatTypingPresence`. */
export enum ChatTypingPresencesOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  ConversationKindAsc = 'CONVERSATION_KIND_ASC',
  ConversationKindDesc = 'CONVERSATION_KIND_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** One private conversation channel per (need, participant-pair). Attached to a need_claim once one is submitted. */
export type ClaimConversation = Node & {
  __typename: 'ClaimConversation';
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** Reads and enables pagination through a set of `ClaimMessage`. */
  claimMessagesByConversationId: ClaimMessagesConnection;
  claimerAccountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  creatorAccountId: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  /** Reads a single `Need` that is related to this `ClaimConversation`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `ClaimConversation`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  needClaimId: Maybe<Scalars['UUID']['output']>;
  needId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};


/** One private conversation channel per (need, participant-pair). Attached to a need_claim once one is submitted. */
export type ClaimConversationClaimMessagesByConversationIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/**
 * A condition to be used against `ClaimConversation` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ClaimConversationCondition = {
  /** Checks for equality with the object’s `claimerAccountId` field. */
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `creatorAccountId` field. */
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needClaimId` field. */
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needId` field. */
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ClaimConversation` */
export type ClaimConversationInput = {
  claimerAccountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId: Scalars['UUID']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  needId: Scalars['UUID']['input'];
};

/** Represents an update to a `ClaimConversation`. Fields that are set will be updated. */
export type ClaimConversationPatch = {
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `ClaimConversation` values. */
export type ClaimConversationsConnection = {
  __typename: 'ClaimConversationsConnection';
  /** A list of edges which contains the `ClaimConversation` and cursor to aid in pagination. */
  edges: Array<ClaimConversationsEdge>;
  /** A list of `ClaimConversation` objects. */
  nodes: Array<ClaimConversation>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ClaimConversation` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ClaimConversation` edge in the connection. */
export type ClaimConversationsEdge = {
  __typename: 'ClaimConversationsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ClaimConversation` at the end of the edge. */
  node: ClaimConversation;
};

/** Methods to use when ordering `ClaimConversation`. */
export enum ClaimConversationsOrderBy {
  ClaimerAccountIdAsc = 'CLAIMER_ACCOUNT_ID_ASC',
  ClaimerAccountIdDesc = 'CLAIMER_ACCOUNT_ID_DESC',
  CreatorAccountIdAsc = 'CREATOR_ACCOUNT_ID_ASC',
  CreatorAccountIdDesc = 'CREATOR_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  NeedClaimIdAsc = 'NEED_CLAIM_ID_ASC',
  NeedClaimIdDesc = 'NEED_CLAIM_ID_DESC',
  NeedIdAsc = 'NEED_ID_ASC',
  NeedIdDesc = 'NEED_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** All input for the `claimGrant` mutation. */
export type ClaimGrantInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `claimGrant` mutation. */
export type ClaimGrantPayload = {
  __typename: 'ClaimGrantPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  grantClaimResult: Maybe<GrantClaimResult>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** Participant messages inside a claim conversation. */
export type ClaimMessage = Node & {
  __typename: 'ClaimMessage';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  body: Scalars['String']['output'];
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  /** Reads and enables pagination through a set of `ClaimMessageImage`. */
  claimMessageImagesByMessageId: ClaimMessageImagesConnection;
  conversationId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  readAt: Maybe<Scalars['Datetime']['output']>;
  senderAccountId: Scalars['UUID']['output'];
};


/** Participant messages inside a claim conversation. */
export type ClaimMessageClaimMessageImagesByMessageIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimMessageImageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimMessageImagesOrderBy>>;
};

/**
 * A condition to be used against `ClaimMessage` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ClaimMessageCondition = {
  /** Checks for equality with the object’s `conversationId` field. */
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `senderAccountId` field. */
  senderAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

export type ClaimMessageImage = Node & {
  __typename: 'ClaimMessageImage';
  /** Reads a single `ClaimMessage` that is related to this `ClaimMessageImage`. */
  claimMessageByMessageId: Maybe<ClaimMessage>;
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  imageUrl: Scalars['String']['output'];
  messageId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  sortOrder: Scalars['Int']['output'];
};

/**
 * A condition to be used against `ClaimMessageImage` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ClaimMessageImageCondition = {
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `messageId` field. */
  messageId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ClaimMessageImage` */
export type ClaimMessageImageInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrl: Scalars['String']['input'];
  messageId: Scalars['UUID']['input'];
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** Represents an update to a `ClaimMessageImage`. Fields that are set will be updated. */
export type ClaimMessageImagePatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  messageId?: InputMaybe<Scalars['UUID']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** A connection to a list of `ClaimMessageImage` values. */
export type ClaimMessageImagesConnection = {
  __typename: 'ClaimMessageImagesConnection';
  /** A list of edges which contains the `ClaimMessageImage` and cursor to aid in pagination. */
  edges: Array<ClaimMessageImagesEdge>;
  /** A list of `ClaimMessageImage` objects. */
  nodes: Array<ClaimMessageImage>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ClaimMessageImage` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ClaimMessageImage` edge in the connection. */
export type ClaimMessageImagesEdge = {
  __typename: 'ClaimMessageImagesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ClaimMessageImage` at the end of the edge. */
  node: ClaimMessageImage;
};

/** Methods to use when ordering `ClaimMessageImage`. */
export enum ClaimMessageImagesOrderBy {
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  MessageIdAsc = 'MESSAGE_ID_ASC',
  MessageIdDesc = 'MESSAGE_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** An input for mutations affecting `ClaimMessage` */
export type ClaimMessageInput = {
  body: Scalars['String']['input'];
  conversationId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  senderAccountId: Scalars['UUID']['input'];
};

/** Represents an update to a `ClaimMessage`. Fields that are set will be updated. */
export type ClaimMessagePatch = {
  body?: InputMaybe<Scalars['String']['input']>;
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  senderAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `ClaimMessage` values. */
export type ClaimMessagesConnection = {
  __typename: 'ClaimMessagesConnection';
  /** A list of edges which contains the `ClaimMessage` and cursor to aid in pagination. */
  edges: Array<ClaimMessagesEdge>;
  /** A list of `ClaimMessage` objects. */
  nodes: Array<ClaimMessage>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ClaimMessage` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ClaimMessage` edge in the connection. */
export type ClaimMessagesEdge = {
  __typename: 'ClaimMessagesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ClaimMessage` at the end of the edge. */
  node: ClaimMessage;
};

/** Methods to use when ordering `ClaimMessage`. */
export enum ClaimMessagesOrderBy {
  ConversationIdAsc = 'CONVERSATION_ID_ASC',
  ConversationIdDesc = 'CONVERSATION_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SenderAccountIdAsc = 'SENDER_ACCOUNT_ID_ASC',
  SenderAccountIdDesc = 'SENDER_ACCOUNT_ID_DESC'
}

/** All input for the `claimNeed` mutation. */
export type ClaimNeedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `claimNeed` mutation. */
export type ClaimNeedPayload = {
  __typename: 'ClaimNeedPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `claimNeed` mutation. */
export type ClaimNeedPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `cleanupOperationalLogs` mutation. */
export type CleanupOperationalLogsInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pNow?: InputMaybe<Scalars['Datetime']['input']>;
};

/** The output of our `cleanupOperationalLogs` mutation. */
export type CleanupOperationalLogsPayload = {
  __typename: 'CleanupOperationalLogsPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `cleanupReadNotifications` mutation. */
export type CleanupReadNotificationsInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `cleanupReadNotifications` mutation. */
export type CleanupReadNotificationsPayload = {
  __typename: 'CleanupReadNotificationsPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `confirmEmailVerification` mutation. */
export type ConfirmEmailVerificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `confirmEmailVerification` mutation. */
export type ConfirmEmailVerificationPayload = {
  __typename: 'ConfirmEmailVerificationPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `confirmPasswordReset` mutation. */
export type ConfirmPasswordResetInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  nextPasswordHash?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `confirmPasswordReset` mutation. */
export type ConfirmPasswordResetPayload = {
  __typename: 'ConfirmPasswordResetPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `confirmPasswordResetWithPassword` mutation. */
export type ConfirmPasswordResetWithPasswordInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  nextPassword?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `confirmPasswordResetWithPassword` mutation. */
export type ConfirmPasswordResetWithPasswordPayload = {
  __typename: 'ConfirmPasswordResetWithPasswordPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the create `AccountDeliveryPreference` mutation. */
export type CreateAccountDeliveryPreferenceInput = {
  /** The `AccountDeliveryPreference` to be created by this mutation. */
  accountDeliveryPreference: AccountDeliveryPreferenceInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `AccountDeliveryPreference` mutation. */
export type CreateAccountDeliveryPreferencePayload = {
  __typename: 'CreateAccountDeliveryPreferencePayload';
  /** Reads a single `Account` that is related to this `AccountDeliveryPreference`. */
  accountByAccountId: Maybe<Account>;
  /** The `AccountDeliveryPreference` that was created by this mutation. */
  accountDeliveryPreference: Maybe<AccountDeliveryPreference>;
  /** An edge for our `AccountDeliveryPreference`. May be used by Relay 1. */
  accountDeliveryPreferenceEdge: Maybe<AccountDeliveryPreferencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `AccountDeliveryPreference` mutation. */
export type CreateAccountDeliveryPreferencePayloadAccountDeliveryPreferenceEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};

/** All input for the create `Account` mutation. */
export type CreateAccountInput = {
  /** The `Account` to be created by this mutation. */
  account: AccountInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** All input for the create `AccountNotification` mutation. */
export type CreateAccountNotificationInput = {
  /** The `AccountNotification` to be created by this mutation. */
  accountNotification: AccountNotificationInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `AccountNotification` mutation. */
export type CreateAccountNotificationPayload = {
  __typename: 'CreateAccountNotificationPayload';
  /** Reads a single `Account` that is related to this `AccountNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /** The `AccountNotification` that was created by this mutation. */
  accountNotification: Maybe<AccountNotification>;
  /** An edge for our `AccountNotification`. May be used by Relay 1. */
  accountNotificationEdge: Maybe<AccountNotificationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `AccountNotification` mutation. */
export type CreateAccountNotificationPayloadAccountNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};

/** The output of our create `Account` mutation. */
export type CreateAccountPayload = {
  __typename: 'CreateAccountPayload';
  /** The `Account` that was created by this mutation. */
  account: Maybe<Account>;
  /** An edge for our `Account`. May be used by Relay 1. */
  accountEdge: Maybe<AccountsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `Account` mutation. */
export type CreateAccountPayloadAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountsOrderBy>>;
};

/** All input for the `createCampaign` mutation. */
export type CreateCampaignInput = {
  airdropAmount?: InputMaybe<Scalars['Int']['input']>;
  airdropAt?: InputMaybe<Scalars['Datetime']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  endAt?: InputMaybe<Scalars['Datetime']['input']>;
  managerNoteFromCreator?: InputMaybe<Scalars['String']['input']>;
  rewardsMultiplier?: InputMaybe<Scalars['Int']['input']>;
  startAt?: InputMaybe<Scalars['Datetime']['input']>;
  theme?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** All input for the create `CampaignModerationAuditEvent` mutation. */
export type CreateCampaignModerationAuditEventInput = {
  /** The `CampaignModerationAuditEvent` to be created by this mutation. */
  campaignModerationAuditEvent: CampaignModerationAuditEventInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `CampaignModerationAuditEvent` mutation. */
export type CreateCampaignModerationAuditEventPayload = {
  __typename: 'CreateCampaignModerationAuditEventPayload';
  /** Reads a single `Account` that is related to this `CampaignModerationAuditEvent`. */
  accountByActorAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationAuditEvent`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationAuditEvent` that was created by this mutation. */
  campaignModerationAuditEvent: Maybe<CampaignModerationAuditEvent>;
  /** An edge for our `CampaignModerationAuditEvent`. May be used by Relay 1. */
  campaignModerationAuditEventEdge: Maybe<CampaignModerationAuditEventsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `CampaignModerationAuditEvent` mutation. */
export type CreateCampaignModerationAuditEventPayloadCampaignModerationAuditEventEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};

/** All input for the create `CampaignModerationNote` mutation. */
export type CreateCampaignModerationNoteInput = {
  /** The `CampaignModerationNote` to be created by this mutation. */
  campaignModerationNote: CampaignModerationNoteInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `CampaignModerationNote` mutation. */
export type CreateCampaignModerationNotePayload = {
  __typename: 'CreateCampaignModerationNotePayload';
  /** Reads a single `Account` that is related to this `CampaignModerationNote`. */
  accountByManagerAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationNote`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationNote` that was created by this mutation. */
  campaignModerationNote: Maybe<CampaignModerationNote>;
  /** An edge for our `CampaignModerationNote`. May be used by Relay 1. */
  campaignModerationNoteEdge: Maybe<CampaignModerationNotesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `CampaignModerationNote` mutation. */
export type CreateCampaignModerationNotePayloadCampaignModerationNoteEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};

/** All input for the create `CampaignNeed` mutation. */
export type CreateCampaignNeedInput = {
  /** The `CampaignNeed` to be created by this mutation. */
  campaignNeed: CampaignNeedInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `CampaignNeed` mutation. */
export type CreateCampaignNeedPayload = {
  __typename: 'CreateCampaignNeedPayload';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignNeed` that was created by this mutation. */
  campaignNeed: Maybe<CampaignNeed>;
  /** An edge for our `CampaignNeed`. May be used by Relay 1. */
  campaignNeedEdge: Maybe<CampaignNeedsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `CampaignNeed` mutation. */
export type CreateCampaignNeedPayloadCampaignNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};

/** The output of our `createCampaign` mutation. */
export type CreateCampaignPayload = {
  __typename: 'CreateCampaignPayload';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  campaign: Maybe<Campaign>;
  /** An edge for our `Campaign`. May be used by Relay 1. */
  campaignEdge: Maybe<CampaignsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `createCampaign` mutation. */
export type CreateCampaignPayloadCampaignEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};

/** All input for the create `CampaignResource` mutation. */
export type CreateCampaignResourceInput = {
  /** The `CampaignResource` to be created by this mutation. */
  campaignResource: CampaignResourceInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `CampaignResource` mutation. */
export type CreateCampaignResourcePayload = {
  __typename: 'CreateCampaignResourcePayload';
  /** Reads a single `Account` that is related to this `CampaignResource`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignResource`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignResource` that was created by this mutation. */
  campaignResource: Maybe<CampaignResource>;
  /** An edge for our `CampaignResource`. May be used by Relay 1. */
  campaignResourceEdge: Maybe<CampaignResourcesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `CampaignResource`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our create `CampaignResource` mutation. */
export type CreateCampaignResourcePayloadCampaignResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};

/** All input for the create `ChatTypingPresence` mutation. */
export type CreateChatTypingPresenceInput = {
  /** The `ChatTypingPresence` to be created by this mutation. */
  chatTypingPresence: ChatTypingPresenceInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `ChatTypingPresence` mutation. */
export type CreateChatTypingPresencePayload = {
  __typename: 'CreateChatTypingPresencePayload';
  /** Reads a single `Account` that is related to this `ChatTypingPresence`. */
  accountByAccountId: Maybe<Account>;
  /** The `ChatTypingPresence` that was created by this mutation. */
  chatTypingPresence: Maybe<ChatTypingPresence>;
  /** An edge for our `ChatTypingPresence`. May be used by Relay 1. */
  chatTypingPresenceEdge: Maybe<ChatTypingPresencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `ChatTypingPresence` mutation. */
export type CreateChatTypingPresencePayloadChatTypingPresenceEdgeArgs = {
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};

/** All input for the create `ClaimConversation` mutation. */
export type CreateClaimConversationInput = {
  /** The `ClaimConversation` to be created by this mutation. */
  claimConversation: ClaimConversationInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `ClaimConversation` mutation. */
export type CreateClaimConversationPayload = {
  __typename: 'CreateClaimConversationPayload';
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** The `ClaimConversation` that was created by this mutation. */
  claimConversation: Maybe<ClaimConversation>;
  /** An edge for our `ClaimConversation`. May be used by Relay 1. */
  claimConversationEdge: Maybe<ClaimConversationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `ClaimConversation`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `ClaimConversation`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `ClaimConversation` mutation. */
export type CreateClaimConversationPayloadClaimConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};

/** All input for the create `ClaimMessageImage` mutation. */
export type CreateClaimMessageImageInput = {
  /** The `ClaimMessageImage` to be created by this mutation. */
  claimMessageImage: ClaimMessageImageInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `ClaimMessageImage` mutation. */
export type CreateClaimMessageImagePayload = {
  __typename: 'CreateClaimMessageImagePayload';
  /** Reads a single `ClaimMessage` that is related to this `ClaimMessageImage`. */
  claimMessageByMessageId: Maybe<ClaimMessage>;
  /** The `ClaimMessageImage` that was created by this mutation. */
  claimMessageImage: Maybe<ClaimMessageImage>;
  /** An edge for our `ClaimMessageImage`. May be used by Relay 1. */
  claimMessageImageEdge: Maybe<ClaimMessageImagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `ClaimMessageImage` mutation. */
export type CreateClaimMessageImagePayloadClaimMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessageImagesOrderBy>>;
};

/** All input for the create `ClaimMessage` mutation. */
export type CreateClaimMessageInput = {
  /** The `ClaimMessage` to be created by this mutation. */
  claimMessage: ClaimMessageInput;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our create `ClaimMessage` mutation. */
export type CreateClaimMessagePayload = {
  __typename: 'CreateClaimMessagePayload';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  /** The `ClaimMessage` that was created by this mutation. */
  claimMessage: Maybe<ClaimMessage>;
  /** An edge for our `ClaimMessage`. May be used by Relay 1. */
  claimMessageEdge: Maybe<ClaimMessagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `ClaimMessage` mutation. */
export type CreateClaimMessagePayloadClaimMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/** All input for the create `GrantClaim` mutation. */
export type CreateGrantClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `GrantClaim` to be created by this mutation. */
  grantClaim: GrantClaimInput;
};

/** The output of our create `GrantClaim` mutation. */
export type CreateGrantClaimPayload = {
  __typename: 'CreateGrantClaimPayload';
  /** Reads a single `Account` that is related to this `GrantClaim`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `GrantClaim` that was created by this mutation. */
  grantClaim: Maybe<GrantClaim>;
  /** An edge for our `GrantClaim`. May be used by Relay 1. */
  grantClaimEdge: Maybe<GrantClaimsEdge>;
  /** Reads a single `GrantDefinition` that is related to this `GrantClaim`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `TokenMovement` that is related to this `GrantClaim`. */
  tokenMovementByTokenMovementId: Maybe<TokenMovement>;
};


/** The output of our create `GrantClaim` mutation. */
export type CreateGrantClaimPayloadGrantClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};

/** All input for the create `GrantDefinition` mutation. */
export type CreateGrantDefinitionInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `GrantDefinition` to be created by this mutation. */
  grantDefinition: GrantDefinitionInput;
};

/** The output of our create `GrantDefinition` mutation. */
export type CreateGrantDefinitionPayload = {
  __typename: 'CreateGrantDefinitionPayload';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `GrantDefinition` that was created by this mutation. */
  grantDefinition: Maybe<GrantDefinition>;
  /** An edge for our `GrantDefinition`. May be used by Relay 1. */
  grantDefinitionEdge: Maybe<GrantDefinitionsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `GrantDefinition` mutation. */
export type CreateGrantDefinitionPayloadGrantDefinitionEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

/** All input for the create `GrantTargetAccount` mutation. */
export type CreateGrantTargetAccountInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `GrantTargetAccount` to be created by this mutation. */
  grantTargetAccount: GrantTargetAccountInput;
};

/** The output of our create `GrantTargetAccount` mutation. */
export type CreateGrantTargetAccountPayload = {
  __typename: 'CreateGrantTargetAccountPayload';
  /** Reads a single `Account` that is related to this `GrantTargetAccount`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetAccount`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetAccount` that was created by this mutation. */
  grantTargetAccount: Maybe<GrantTargetAccount>;
  /** An edge for our `GrantTargetAccount`. May be used by Relay 1. */
  grantTargetAccountEdge: Maybe<GrantTargetAccountsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `GrantTargetAccount` mutation. */
export type CreateGrantTargetAccountPayloadGrantTargetAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};

/** All input for the create `GrantTargetEmail` mutation. */
export type CreateGrantTargetEmailInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `GrantTargetEmail` to be created by this mutation. */
  grantTargetEmail: GrantTargetEmailInput;
};

/** The output of our create `GrantTargetEmail` mutation. */
export type CreateGrantTargetEmailPayload = {
  __typename: 'CreateGrantTargetEmailPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetEmail`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetEmail` that was created by this mutation. */
  grantTargetEmail: Maybe<GrantTargetEmail>;
  /** An edge for our `GrantTargetEmail`. May be used by Relay 1. */
  grantTargetEmailEdge: Maybe<GrantTargetEmailsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `GrantTargetEmail` mutation. */
export type CreateGrantTargetEmailPayloadGrantTargetEmailEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetEmailsOrderBy>>;
};

/** All input for the create `NeedClaim` mutation. */
export type CreateNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `NeedClaim` to be created by this mutation. */
  needClaim: NeedClaimInput;
};

/** All input for the create `NeedClaimNotification` mutation. */
export type CreateNeedClaimNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `NeedClaimNotification` to be created by this mutation. */
  needClaimNotification: NeedClaimNotificationInput;
};

/** The output of our create `NeedClaimNotification` mutation. */
export type CreateNeedClaimNotificationPayload = {
  __typename: 'CreateNeedClaimNotificationPayload';
  /** Reads a single `Account` that is related to this `NeedClaimNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimNotification`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimNotification` that was created by this mutation. */
  needClaimNotification: Maybe<NeedClaimNotification>;
  /** An edge for our `NeedClaimNotification`. May be used by Relay 1. */
  needClaimNotificationEdge: Maybe<NeedClaimNotificationsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `NeedClaimNotification` mutation. */
export type CreateNeedClaimNotificationPayloadNeedClaimNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};

/** The output of our create `NeedClaim` mutation. */
export type CreateNeedClaimPayload = {
  __typename: 'CreateNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  /** The `NeedClaim` that was created by this mutation. */
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `NeedClaim` mutation. */
export type CreateNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the create `NeedClaimSettlementEvent` mutation. */
export type CreateNeedClaimSettlementEventInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `NeedClaimSettlementEvent` to be created by this mutation. */
  needClaimSettlementEvent: NeedClaimSettlementEventInput;
};

/** The output of our create `NeedClaimSettlementEvent` mutation. */
export type CreateNeedClaimSettlementEventPayload = {
  __typename: 'CreateNeedClaimSettlementEventPayload';
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaimSettlementEvent`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimSettlementEvent`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimSettlementEvent` that was created by this mutation. */
  needClaimSettlementEvent: Maybe<NeedClaimSettlementEvent>;
  /** An edge for our `NeedClaimSettlementEvent`. May be used by Relay 1. */
  needClaimSettlementEventEdge: Maybe<NeedClaimSettlementEventsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `NeedClaimSettlementEvent` mutation. */
export type CreateNeedClaimSettlementEventPayloadNeedClaimSettlementEventEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};

/** All input for the `createNeed` mutation. */
export type CreateNeedInput = {
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  competenceRequired?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  intensity?: InputMaybe<NeedIntensity>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  multiplePeopleRequired?: InputMaybe<Scalars['Boolean']['input']>;
  objectRequired?: InputMaybe<Scalars['Boolean']['input']>;
  proposedTopesAmount?: InputMaybe<Scalars['Int']['input']>;
  requiredCompetenceText?: InputMaybe<Scalars['String']['input']>;
  requiredPeopleCount?: InputMaybe<Scalars['Int']['input']>;
  requiredToolingText?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  toolingRequired?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The output of our `createNeed` mutation. */
export type CreateNeedPayload = {
  __typename: 'CreateNeedPayload';
  /** Reads a single `Account` that is related to this `Need`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  need: Maybe<Need>;
  /** An edge for our `Need`. May be used by Relay 1. */
  needEdge: Maybe<NeedsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `createNeed` mutation. */
export type CreateNeedPayloadNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedsOrderBy>>;
};

/** All input for the create `OperationalLog` mutation. */
export type CreateOperationalLogInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `OperationalLog` to be created by this mutation. */
  operationalLog: OperationalLogInput;
};

/** The output of our create `OperationalLog` mutation. */
export type CreateOperationalLogPayload = {
  __typename: 'CreateOperationalLogPayload';
  /** Reads a single `Account` that is related to this `OperationalLog`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `OperationalLog` that was created by this mutation. */
  operationalLog: Maybe<OperationalLog>;
  /** An edge for our `OperationalLog`. May be used by Relay 1. */
  operationalLogEdge: Maybe<OperationalLogsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our create `OperationalLog` mutation. */
export type CreateOperationalLogPayloadOperationalLogEdgeArgs = {
  orderBy?: InputMaybe<Array<OperationalLogsOrderBy>>;
};

/** All input for the create `ResourceBid` mutation. */
export type CreateResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceBid` to be created by this mutation. */
  resourceBid: ResourceBidInput;
};

/** All input for the create `ResourceBidNotification` mutation. */
export type CreateResourceBidNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceBidNotification` to be created by this mutation. */
  resourceBidNotification: ResourceBidNotificationInput;
};

/** The output of our create `ResourceBidNotification` mutation. */
export type CreateResourceBidNotificationPayload = {
  __typename: 'CreateResourceBidNotificationPayload';
  /** Reads a single `Account` that is related to this `ResourceBidNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceBidNotification`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** The `ResourceBidNotification` that was created by this mutation. */
  resourceBidNotification: Maybe<ResourceBidNotification>;
  /** An edge for our `ResourceBidNotification`. May be used by Relay 1. */
  resourceBidNotificationEdge: Maybe<ResourceBidNotificationsEdge>;
};


/** The output of our create `ResourceBidNotification` mutation. */
export type CreateResourceBidNotificationPayloadResourceBidNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};

/** The output of our create `ResourceBid` mutation. */
export type CreateResourceBidPayload = {
  __typename: 'CreateResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceBid` that was created by this mutation. */
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our create `ResourceBid` mutation. */
export type CreateResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

/** All input for the create `ResourceCategoryAssignment` mutation. */
export type CreateResourceCategoryAssignmentInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceCategoryAssignment` to be created by this mutation. */
  resourceCategoryAssignment: ResourceCategoryAssignmentInput;
};

/** The output of our create `ResourceCategoryAssignment` mutation. */
export type CreateResourceCategoryAssignmentPayload = {
  __typename: 'CreateResourceCategoryAssignmentPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `ResourceCategoryAssignment`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceCategoryAssignment` that was created by this mutation. */
  resourceCategoryAssignment: Maybe<ResourceCategoryAssignment>;
  /** An edge for our `ResourceCategoryAssignment`. May be used by Relay 1. */
  resourceCategoryAssignmentEdge: Maybe<ResourceCategoryAssignmentsEdge>;
  /** Reads a single `ResourceCategory` that is related to this `ResourceCategoryAssignment`. */
  resourceCategoryByCategoryCode: Maybe<ResourceCategory>;
};


/** The output of our create `ResourceCategoryAssignment` mutation. */
export type CreateResourceCategoryAssignmentPayloadResourceCategoryAssignmentEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};

/** All input for the create `ResourceCategory` mutation. */
export type CreateResourceCategoryInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceCategory` to be created by this mutation. */
  resourceCategory: ResourceCategoryInput;
};

/** The output of our create `ResourceCategory` mutation. */
export type CreateResourceCategoryPayload = {
  __typename: 'CreateResourceCategoryPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceCategory` that was created by this mutation. */
  resourceCategory: Maybe<ResourceCategory>;
  /** An edge for our `ResourceCategory`. May be used by Relay 1. */
  resourceCategoryEdge: Maybe<ResourceCategoriesEdge>;
};


/** The output of our create `ResourceCategory` mutation. */
export type CreateResourceCategoryPayloadResourceCategoryEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoriesOrderBy>>;
};

/** All input for the create `ResourceConversation` mutation. */
export type CreateResourceConversationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceConversation` to be created by this mutation. */
  resourceConversation: ResourceConversationInput;
};

/** The output of our create `ResourceConversation` mutation. */
export type CreateResourceConversationPayload = {
  __typename: 'CreateResourceConversationPayload';
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByOwnerAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceConversation`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** Reads a single `Resource` that is related to this `ResourceConversation`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceConversation` that was created by this mutation. */
  resourceConversation: Maybe<ResourceConversation>;
  /** An edge for our `ResourceConversation`. May be used by Relay 1. */
  resourceConversationEdge: Maybe<ResourceConversationsEdge>;
};


/** The output of our create `ResourceConversation` mutation. */
export type CreateResourceConversationPayloadResourceConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};

/** All input for the create `Resource` mutation. */
export type CreateResourceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `Resource` to be created by this mutation. */
  resource: ResourceInput;
};

/** All input for the create `ResourceMessageImage` mutation. */
export type CreateResourceMessageImageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceMessageImage` to be created by this mutation. */
  resourceMessageImage: ResourceMessageImageInput;
};

/** The output of our create `ResourceMessageImage` mutation. */
export type CreateResourceMessageImagePayload = {
  __typename: 'CreateResourceMessageImagePayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceMessage` that is related to this `ResourceMessageImage`. */
  resourceMessageByMessageId: Maybe<ResourceMessage>;
  /** The `ResourceMessageImage` that was created by this mutation. */
  resourceMessageImage: Maybe<ResourceMessageImage>;
  /** An edge for our `ResourceMessageImage`. May be used by Relay 1. */
  resourceMessageImageEdge: Maybe<ResourceMessageImagesEdge>;
};


/** The output of our create `ResourceMessageImage` mutation. */
export type CreateResourceMessageImagePayloadResourceMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessageImagesOrderBy>>;
};

/** All input for the create `ResourceMessage` mutation. */
export type CreateResourceMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `ResourceMessage` to be created by this mutation. */
  resourceMessage: ResourceMessageInput;
};

/** The output of our create `ResourceMessage` mutation. */
export type CreateResourceMessagePayload = {
  __typename: 'CreateResourceMessagePayload';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  /** The `ResourceMessage` that was created by this mutation. */
  resourceMessage: Maybe<ResourceMessage>;
  /** An edge for our `ResourceMessage`. May be used by Relay 1. */
  resourceMessageEdge: Maybe<ResourceMessagesEdge>;
};


/** The output of our create `ResourceMessage` mutation. */
export type CreateResourceMessagePayloadResourceMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/** The output of our create `Resource` mutation. */
export type CreateResourcePayload = {
  __typename: 'CreateResourcePayload';
  /** Reads a single `Account` that is related to this `Resource`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `Resource` that was created by this mutation. */
  resource: Maybe<Resource>;
  /** An edge for our `Resource`. May be used by Relay 1. */
  resourceEdge: Maybe<ResourcesEdge>;
};


/** The output of our create `Resource` mutation. */
export type CreateResourcePayloadResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};

/** All input for the create `SystemSetting` mutation. */
export type CreateSystemSettingInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `SystemSetting` to be created by this mutation. */
  systemSetting: SystemSettingInput;
};

/** The output of our create `SystemSetting` mutation. */
export type CreateSystemSettingPayload = {
  __typename: 'CreateSystemSettingPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `SystemSetting` that was created by this mutation. */
  systemSetting: Maybe<SystemSetting>;
  /** An edge for our `SystemSetting`. May be used by Relay 1. */
  systemSettingEdge: Maybe<SystemSettingsEdge>;
};


/** The output of our create `SystemSetting` mutation. */
export type CreateSystemSettingPayloadSystemSettingEdgeArgs = {
  orderBy?: InputMaybe<Array<SystemSettingsOrderBy>>;
};

/** All input for the create `TokenMovement` mutation. */
export type CreateTokenMovementInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The `TokenMovement` to be created by this mutation. */
  tokenMovement: TokenMovementInput;
};

/** The output of our create `TokenMovement` mutation. */
export type CreateTokenMovementPayload = {
  __typename: 'CreateTokenMovementPayload';
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByCounterpartyAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `TokenMovement` that was created by this mutation. */
  tokenMovement: Maybe<TokenMovement>;
  /** An edge for our `TokenMovement`. May be used by Relay 1. */
  tokenMovementEdge: Maybe<TokenMovementsEdge>;
};


/** The output of our create `TokenMovement` mutation. */
export type CreateTokenMovementPayloadTokenMovementEdgeArgs = {
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};

/** All input for the `declineNeedClaim` mutation. */
export type DeclineNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `declineNeedClaim` mutation. */
export type DeclineNeedClaimPayload = {
  __typename: 'DeclineNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `declineNeedClaim` mutation. */
export type DeclineNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `deleteAccountByExternalSubject` mutation. */
export type DeleteAccountByExternalSubjectInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  externalSubject: Scalars['String']['input'];
};

/** All input for the `deleteAccountById` mutation. */
export type DeleteAccountByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteAccountDeliveryPreferenceByAccountIdAndEventCategory` mutation. */
export type DeleteAccountDeliveryPreferenceByAccountIdAndEventCategoryInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: Scalars['String']['input'];
};

/** All input for the `deleteAccountDeliveryPreference` mutation. */
export type DeleteAccountDeliveryPreferenceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `AccountDeliveryPreference` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `AccountDeliveryPreference` mutation. */
export type DeleteAccountDeliveryPreferencePayload = {
  __typename: 'DeleteAccountDeliveryPreferencePayload';
  /** Reads a single `Account` that is related to this `AccountDeliveryPreference`. */
  accountByAccountId: Maybe<Account>;
  /** The `AccountDeliveryPreference` that was deleted by this mutation. */
  accountDeliveryPreference: Maybe<AccountDeliveryPreference>;
  /** An edge for our `AccountDeliveryPreference`. May be used by Relay 1. */
  accountDeliveryPreferenceEdge: Maybe<AccountDeliveryPreferencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedAccountDeliveryPreferenceId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `AccountDeliveryPreference` mutation. */
export type DeleteAccountDeliveryPreferencePayloadAccountDeliveryPreferenceEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};

/** All input for the `deleteAccount` mutation. */
export type DeleteAccountInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Account` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `deleteAccountNotificationById` mutation. */
export type DeleteAccountNotificationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteAccountNotification` mutation. */
export type DeleteAccountNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `AccountNotification` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `AccountNotification` mutation. */
export type DeleteAccountNotificationPayload = {
  __typename: 'DeleteAccountNotificationPayload';
  /** Reads a single `Account` that is related to this `AccountNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /** The `AccountNotification` that was deleted by this mutation. */
  accountNotification: Maybe<AccountNotification>;
  /** An edge for our `AccountNotification`. May be used by Relay 1. */
  accountNotificationEdge: Maybe<AccountNotificationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedAccountNotificationId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `AccountNotification` mutation. */
export type DeleteAccountNotificationPayloadAccountNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};

/** The output of our delete `Account` mutation. */
export type DeleteAccountPayload = {
  __typename: 'DeleteAccountPayload';
  /** The `Account` that was deleted by this mutation. */
  account: Maybe<Account>;
  /** An edge for our `Account`. May be used by Relay 1. */
  accountEdge: Maybe<AccountsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedAccountId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `Account` mutation. */
export type DeleteAccountPayloadAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountsOrderBy>>;
};

/** All input for the `deleteCampaignById` mutation. */
export type DeleteCampaignByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteCampaign` mutation. */
export type DeleteCampaignInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Campaign` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `deleteCampaignModerationAuditEventById` mutation. */
export type DeleteCampaignModerationAuditEventByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteCampaignModerationAuditEvent` mutation. */
export type DeleteCampaignModerationAuditEventInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignModerationAuditEvent` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `CampaignModerationAuditEvent` mutation. */
export type DeleteCampaignModerationAuditEventPayload = {
  __typename: 'DeleteCampaignModerationAuditEventPayload';
  /** Reads a single `Account` that is related to this `CampaignModerationAuditEvent`. */
  accountByActorAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationAuditEvent`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationAuditEvent` that was deleted by this mutation. */
  campaignModerationAuditEvent: Maybe<CampaignModerationAuditEvent>;
  /** An edge for our `CampaignModerationAuditEvent`. May be used by Relay 1. */
  campaignModerationAuditEventEdge: Maybe<CampaignModerationAuditEventsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedCampaignModerationEventId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `CampaignModerationAuditEvent` mutation. */
export type DeleteCampaignModerationAuditEventPayloadCampaignModerationAuditEventEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};

/** All input for the `deleteCampaignModerationNoteById` mutation. */
export type DeleteCampaignModerationNoteByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteCampaignModerationNote` mutation. */
export type DeleteCampaignModerationNoteInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignModerationNote` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `CampaignModerationNote` mutation. */
export type DeleteCampaignModerationNotePayload = {
  __typename: 'DeleteCampaignModerationNotePayload';
  /** Reads a single `Account` that is related to this `CampaignModerationNote`. */
  accountByManagerAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationNote`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationNote` that was deleted by this mutation. */
  campaignModerationNote: Maybe<CampaignModerationNote>;
  /** An edge for our `CampaignModerationNote`. May be used by Relay 1. */
  campaignModerationNoteEdge: Maybe<CampaignModerationNotesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedCampaignModerationNoteId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `CampaignModerationNote` mutation. */
export type DeleteCampaignModerationNotePayloadCampaignModerationNoteEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};

/** All input for the `deleteCampaignNeedByCampaignIdAndNeedId` mutation. */
export type DeleteCampaignNeedByCampaignIdAndNeedIdInput = {
  campaignId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needId: Scalars['UUID']['input'];
};

/** All input for the `deleteCampaignNeed` mutation. */
export type DeleteCampaignNeedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignNeed` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `CampaignNeed` mutation. */
export type DeleteCampaignNeedPayload = {
  __typename: 'DeleteCampaignNeedPayload';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignNeed` that was deleted by this mutation. */
  campaignNeed: Maybe<CampaignNeed>;
  /** An edge for our `CampaignNeed`. May be used by Relay 1. */
  campaignNeedEdge: Maybe<CampaignNeedsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedCampaignNeedId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `CampaignNeed` mutation. */
export type DeleteCampaignNeedPayloadCampaignNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};

/** The output of our delete `Campaign` mutation. */
export type DeleteCampaignPayload = {
  __typename: 'DeleteCampaignPayload';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** The `Campaign` that was deleted by this mutation. */
  campaign: Maybe<Campaign>;
  /** An edge for our `Campaign`. May be used by Relay 1. */
  campaignEdge: Maybe<CampaignsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedCampaignId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `Campaign` mutation. */
export type DeleteCampaignPayloadCampaignEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};

/** All input for the `deleteCampaignResourceByCampaignIdAndResourceId` mutation. */
export type DeleteCampaignResourceByCampaignIdAndResourceIdInput = {
  campaignId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `deleteCampaignResource` mutation. */
export type DeleteCampaignResourceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignResource` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `CampaignResource` mutation. */
export type DeleteCampaignResourcePayload = {
  __typename: 'DeleteCampaignResourcePayload';
  /** Reads a single `Account` that is related to this `CampaignResource`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignResource`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignResource` that was deleted by this mutation. */
  campaignResource: Maybe<CampaignResource>;
  /** An edge for our `CampaignResource`. May be used by Relay 1. */
  campaignResourceEdge: Maybe<CampaignResourcesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedCampaignResourceId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `CampaignResource`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our delete `CampaignResource` mutation. */
export type DeleteCampaignResourcePayloadCampaignResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};

/** All input for the `deleteChatTypingPresenceByConversationKindAndConversationIdAndAccountId` mutation. */
export type DeleteChatTypingPresenceByConversationKindAndConversationIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['UUID']['input'];
  conversationKind: ChatContextKind;
};

/** All input for the `deleteChatTypingPresence` mutation. */
export type DeleteChatTypingPresenceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ChatTypingPresence` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ChatTypingPresence` mutation. */
export type DeleteChatTypingPresencePayload = {
  __typename: 'DeleteChatTypingPresencePayload';
  /** Reads a single `Account` that is related to this `ChatTypingPresence`. */
  accountByAccountId: Maybe<Account>;
  /** The `ChatTypingPresence` that was deleted by this mutation. */
  chatTypingPresence: Maybe<ChatTypingPresence>;
  /** An edge for our `ChatTypingPresence`. May be used by Relay 1. */
  chatTypingPresenceEdge: Maybe<ChatTypingPresencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedChatTypingPresenceId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `ChatTypingPresence` mutation. */
export type DeleteChatTypingPresencePayloadChatTypingPresenceEdgeArgs = {
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};

/** All input for the `deleteClaimConversationById` mutation. */
export type DeleteClaimConversationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId` mutation. */
export type DeleteClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdInput = {
  claimerAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  creatorAccountId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
};

/** All input for the `deleteClaimConversation` mutation. */
export type DeleteClaimConversationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimConversation` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ClaimConversation` mutation. */
export type DeleteClaimConversationPayload = {
  __typename: 'DeleteClaimConversationPayload';
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** The `ClaimConversation` that was deleted by this mutation. */
  claimConversation: Maybe<ClaimConversation>;
  /** An edge for our `ClaimConversation`. May be used by Relay 1. */
  claimConversationEdge: Maybe<ClaimConversationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedClaimConversationId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `Need` that is related to this `ClaimConversation`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `ClaimConversation`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `ClaimConversation` mutation. */
export type DeleteClaimConversationPayloadClaimConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};

/** All input for the `deleteClaimMessageById` mutation. */
export type DeleteClaimMessageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteClaimMessageImageById` mutation. */
export type DeleteClaimMessageImageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteClaimMessageImage` mutation. */
export type DeleteClaimMessageImageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimMessageImage` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ClaimMessageImage` mutation. */
export type DeleteClaimMessageImagePayload = {
  __typename: 'DeleteClaimMessageImagePayload';
  /** Reads a single `ClaimMessage` that is related to this `ClaimMessageImage`. */
  claimMessageByMessageId: Maybe<ClaimMessage>;
  /** The `ClaimMessageImage` that was deleted by this mutation. */
  claimMessageImage: Maybe<ClaimMessageImage>;
  /** An edge for our `ClaimMessageImage`. May be used by Relay 1. */
  claimMessageImageEdge: Maybe<ClaimMessageImagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedClaimMessageImageId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `ClaimMessageImage` mutation. */
export type DeleteClaimMessageImagePayloadClaimMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessageImagesOrderBy>>;
};

/** All input for the `deleteClaimMessage` mutation. */
export type DeleteClaimMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimMessage` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ClaimMessage` mutation. */
export type DeleteClaimMessagePayload = {
  __typename: 'DeleteClaimMessagePayload';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  /** The `ClaimMessage` that was deleted by this mutation. */
  claimMessage: Maybe<ClaimMessage>;
  /** An edge for our `ClaimMessage`. May be used by Relay 1. */
  claimMessageEdge: Maybe<ClaimMessagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedClaimMessageId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `ClaimMessage` mutation. */
export type DeleteClaimMessagePayloadClaimMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/** All input for the `deleteGrantClaimByGrantIdAndAccountId` mutation. */
export type DeleteGrantClaimByGrantIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  grantId: Scalars['UUID']['input'];
};

/** All input for the `deleteGrantClaimById` mutation. */
export type DeleteGrantClaimByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteGrantClaim` mutation. */
export type DeleteGrantClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `GrantClaim` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `GrantClaim` mutation. */
export type DeleteGrantClaimPayload = {
  __typename: 'DeleteGrantClaimPayload';
  /** Reads a single `Account` that is related to this `GrantClaim`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedGrantClaimId: Maybe<Scalars['ID']['output']>;
  /** The `GrantClaim` that was deleted by this mutation. */
  grantClaim: Maybe<GrantClaim>;
  /** An edge for our `GrantClaim`. May be used by Relay 1. */
  grantClaimEdge: Maybe<GrantClaimsEdge>;
  /** Reads a single `GrantDefinition` that is related to this `GrantClaim`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `TokenMovement` that is related to this `GrantClaim`. */
  tokenMovementByTokenMovementId: Maybe<TokenMovement>;
};


/** The output of our delete `GrantClaim` mutation. */
export type DeleteGrantClaimPayloadGrantClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};

/** All input for the `deleteGrantDefinitionById` mutation. */
export type DeleteGrantDefinitionByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteGrantDefinition` mutation. */
export type DeleteGrantDefinitionInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `GrantDefinition` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `GrantDefinition` mutation. */
export type DeleteGrantDefinitionPayload = {
  __typename: 'DeleteGrantDefinitionPayload';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedGrantDefinitionId: Maybe<Scalars['ID']['output']>;
  /** The `GrantDefinition` that was deleted by this mutation. */
  grantDefinition: Maybe<GrantDefinition>;
  /** An edge for our `GrantDefinition`. May be used by Relay 1. */
  grantDefinitionEdge: Maybe<GrantDefinitionsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `GrantDefinition` mutation. */
export type DeleteGrantDefinitionPayloadGrantDefinitionEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

/** All input for the `deleteGrantTargetAccountByGrantIdAndAccountId` mutation. */
export type DeleteGrantTargetAccountByGrantIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  grantId: Scalars['UUID']['input'];
};

/** All input for the `deleteGrantTargetAccount` mutation. */
export type DeleteGrantTargetAccountInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `GrantTargetAccount` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `GrantTargetAccount` mutation. */
export type DeleteGrantTargetAccountPayload = {
  __typename: 'DeleteGrantTargetAccountPayload';
  /** Reads a single `Account` that is related to this `GrantTargetAccount`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedGrantTargetAccountId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetAccount`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetAccount` that was deleted by this mutation. */
  grantTargetAccount: Maybe<GrantTargetAccount>;
  /** An edge for our `GrantTargetAccount`. May be used by Relay 1. */
  grantTargetAccountEdge: Maybe<GrantTargetAccountsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `GrantTargetAccount` mutation. */
export type DeleteGrantTargetAccountPayloadGrantTargetAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};

/** All input for the `deleteGrantTargetEmailByGrantIdAndTargetEmailNormalized` mutation. */
export type DeleteGrantTargetEmailByGrantIdAndTargetEmailNormalizedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  grantId: Scalars['UUID']['input'];
  targetEmailNormalized: Scalars['String']['input'];
};

/** All input for the `deleteGrantTargetEmail` mutation. */
export type DeleteGrantTargetEmailInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `GrantTargetEmail` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `GrantTargetEmail` mutation. */
export type DeleteGrantTargetEmailPayload = {
  __typename: 'DeleteGrantTargetEmailPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedGrantTargetEmailId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetEmail`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetEmail` that was deleted by this mutation. */
  grantTargetEmail: Maybe<GrantTargetEmail>;
  /** An edge for our `GrantTargetEmail`. May be used by Relay 1. */
  grantTargetEmailEdge: Maybe<GrantTargetEmailsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `GrantTargetEmail` mutation. */
export type DeleteGrantTargetEmailPayloadGrantTargetEmailEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetEmailsOrderBy>>;
};

/** All input for the `deleteNeedById` mutation. */
export type DeleteNeedByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaimById` mutation. */
export type DeleteNeedClaimByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaimByNeedIdAndClaimerAccountId` mutation. */
export type DeleteNeedClaimByNeedIdAndClaimerAccountIdInput = {
  claimerAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needId: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaim` mutation. */
export type DeleteNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `NeedClaim` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `deleteNeedClaimNotificationById` mutation. */
export type DeleteNeedClaimNotificationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaimNotification` mutation. */
export type DeleteNeedClaimNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `NeedClaimNotification` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `NeedClaimNotification` mutation. */
export type DeleteNeedClaimNotificationPayload = {
  __typename: 'DeleteNeedClaimNotificationPayload';
  /** Reads a single `Account` that is related to this `NeedClaimNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedNeedClaimNotificationId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimNotification`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimNotification` that was deleted by this mutation. */
  needClaimNotification: Maybe<NeedClaimNotification>;
  /** An edge for our `NeedClaimNotification`. May be used by Relay 1. */
  needClaimNotificationEdge: Maybe<NeedClaimNotificationsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `NeedClaimNotification` mutation. */
export type DeleteNeedClaimNotificationPayloadNeedClaimNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};

/** The output of our delete `NeedClaim` mutation. */
export type DeleteNeedClaimPayload = {
  __typename: 'DeleteNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedNeedClaimId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  /** The `NeedClaim` that was deleted by this mutation. */
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `NeedClaim` mutation. */
export type DeleteNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `deleteNeedClaimSettlementEventById` mutation. */
export type DeleteNeedClaimSettlementEventByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaimSettlementEventByNeedClaimId` mutation. */
export type DeleteNeedClaimSettlementEventByNeedClaimIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needClaimId: Scalars['UUID']['input'];
};

/** All input for the `deleteNeedClaimSettlementEvent` mutation. */
export type DeleteNeedClaimSettlementEventInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `NeedClaimSettlementEvent` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `NeedClaimSettlementEvent` mutation. */
export type DeleteNeedClaimSettlementEventPayload = {
  __typename: 'DeleteNeedClaimSettlementEventPayload';
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedNeedClaimSettlementEventId: Maybe<Scalars['ID']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaimSettlementEvent`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimSettlementEvent`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimSettlementEvent` that was deleted by this mutation. */
  needClaimSettlementEvent: Maybe<NeedClaimSettlementEvent>;
  /** An edge for our `NeedClaimSettlementEvent`. May be used by Relay 1. */
  needClaimSettlementEventEdge: Maybe<NeedClaimSettlementEventsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `NeedClaimSettlementEvent` mutation. */
export type DeleteNeedClaimSettlementEventPayloadNeedClaimSettlementEventEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};

/** All input for the `deleteNeed` mutation. */
export type DeleteNeedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Need` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `Need` mutation. */
export type DeleteNeedPayload = {
  __typename: 'DeleteNeedPayload';
  /** Reads a single `Account` that is related to this `Need`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedNeedId: Maybe<Scalars['ID']['output']>;
  /** The `Need` that was deleted by this mutation. */
  need: Maybe<Need>;
  /** An edge for our `Need`. May be used by Relay 1. */
  needEdge: Maybe<NeedsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `Need` mutation. */
export type DeleteNeedPayloadNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedsOrderBy>>;
};

/** All input for the `deleteOperationalLogById` mutation. */
export type DeleteOperationalLogByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteOperationalLog` mutation. */
export type DeleteOperationalLogInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `OperationalLog` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `OperationalLog` mutation. */
export type DeleteOperationalLogPayload = {
  __typename: 'DeleteOperationalLogPayload';
  /** Reads a single `Account` that is related to this `OperationalLog`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedOperationalLogId: Maybe<Scalars['ID']['output']>;
  /** The `OperationalLog` that was deleted by this mutation. */
  operationalLog: Maybe<OperationalLog>;
  /** An edge for our `OperationalLog`. May be used by Relay 1. */
  operationalLogEdge: Maybe<OperationalLogsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our delete `OperationalLog` mutation. */
export type DeleteOperationalLogPayloadOperationalLogEdgeArgs = {
  orderBy?: InputMaybe<Array<OperationalLogsOrderBy>>;
};

/** All input for the `deleteResourceBidById` mutation. */
export type DeleteResourceBidByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceBidByResourceIdAndBidderAccountId` mutation. */
export type DeleteResourceBidByResourceIdAndBidderAccountIdInput = {
  bidderAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceBid` mutation. */
export type DeleteResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceBid` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `deleteResourceBidNotificationById` mutation. */
export type DeleteResourceBidNotificationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceBidNotification` mutation. */
export type DeleteResourceBidNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceBidNotification` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceBidNotification` mutation. */
export type DeleteResourceBidNotificationPayload = {
  __typename: 'DeleteResourceBidNotificationPayload';
  /** Reads a single `Account` that is related to this `ResourceBidNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceBidNotificationId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceBidNotification`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** The `ResourceBidNotification` that was deleted by this mutation. */
  resourceBidNotification: Maybe<ResourceBidNotification>;
  /** An edge for our `ResourceBidNotification`. May be used by Relay 1. */
  resourceBidNotificationEdge: Maybe<ResourceBidNotificationsEdge>;
};


/** The output of our delete `ResourceBidNotification` mutation. */
export type DeleteResourceBidNotificationPayloadResourceBidNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};

/** The output of our delete `ResourceBid` mutation. */
export type DeleteResourceBidPayload = {
  __typename: 'DeleteResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceBidId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceBid` that was deleted by this mutation. */
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our delete `ResourceBid` mutation. */
export type DeleteResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

/** All input for the `deleteResourceById` mutation. */
export type DeleteResourceByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceCategoryAssignmentByResourceIdAndCategoryCode` mutation. */
export type DeleteResourceCategoryAssignmentByResourceIdAndCategoryCodeInput = {
  categoryCode: Scalars['Int']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceCategoryAssignment` mutation. */
export type DeleteResourceCategoryAssignmentInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceCategoryAssignment` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceCategoryAssignment` mutation. */
export type DeleteResourceCategoryAssignmentPayload = {
  __typename: 'DeleteResourceCategoryAssignmentPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceCategoryAssignmentId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `ResourceCategoryAssignment`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceCategoryAssignment` that was deleted by this mutation. */
  resourceCategoryAssignment: Maybe<ResourceCategoryAssignment>;
  /** An edge for our `ResourceCategoryAssignment`. May be used by Relay 1. */
  resourceCategoryAssignmentEdge: Maybe<ResourceCategoryAssignmentsEdge>;
  /** Reads a single `ResourceCategory` that is related to this `ResourceCategoryAssignment`. */
  resourceCategoryByCategoryCode: Maybe<ResourceCategory>;
};


/** The output of our delete `ResourceCategoryAssignment` mutation. */
export type DeleteResourceCategoryAssignmentPayloadResourceCategoryAssignmentEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};

/** All input for the `deleteResourceCategoryByCode` mutation. */
export type DeleteResourceCategoryByCodeInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['Int']['input'];
};

/** All input for the `deleteResourceCategoryBySlug` mutation. */
export type DeleteResourceCategoryBySlugInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  slug: Scalars['String']['input'];
};

/** All input for the `deleteResourceCategory` mutation. */
export type DeleteResourceCategoryInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceCategory` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceCategory` mutation. */
export type DeleteResourceCategoryPayload = {
  __typename: 'DeleteResourceCategoryPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceCategoryId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceCategory` that was deleted by this mutation. */
  resourceCategory: Maybe<ResourceCategory>;
  /** An edge for our `ResourceCategory`. May be used by Relay 1. */
  resourceCategoryEdge: Maybe<ResourceCategoriesEdge>;
};


/** The output of our delete `ResourceCategory` mutation. */
export type DeleteResourceCategoryPayloadResourceCategoryEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoriesOrderBy>>;
};

/** All input for the `deleteResourceConversationById` mutation. */
export type DeleteResourceConversationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId` mutation. */
export type DeleteResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdInput = {
  bidderAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  ownerAccountId: Scalars['UUID']['input'];
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceConversation` mutation. */
export type DeleteResourceConversationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceConversation` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceConversation` mutation. */
export type DeleteResourceConversationPayload = {
  __typename: 'DeleteResourceConversationPayload';
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByOwnerAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceConversationId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceConversation`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** Reads a single `Resource` that is related to this `ResourceConversation`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceConversation` that was deleted by this mutation. */
  resourceConversation: Maybe<ResourceConversation>;
  /** An edge for our `ResourceConversation`. May be used by Relay 1. */
  resourceConversationEdge: Maybe<ResourceConversationsEdge>;
};


/** The output of our delete `ResourceConversation` mutation. */
export type DeleteResourceConversationPayloadResourceConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};

/** All input for the `deleteResource` mutation. */
export type DeleteResourceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Resource` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `deleteResourceMessageById` mutation. */
export type DeleteResourceMessageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceMessageImageById` mutation. */
export type DeleteResourceMessageImageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteResourceMessageImage` mutation. */
export type DeleteResourceMessageImageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceMessageImage` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceMessageImage` mutation. */
export type DeleteResourceMessageImagePayload = {
  __typename: 'DeleteResourceMessageImagePayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceMessageImageId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceMessage` that is related to this `ResourceMessageImage`. */
  resourceMessageByMessageId: Maybe<ResourceMessage>;
  /** The `ResourceMessageImage` that was deleted by this mutation. */
  resourceMessageImage: Maybe<ResourceMessageImage>;
  /** An edge for our `ResourceMessageImage`. May be used by Relay 1. */
  resourceMessageImageEdge: Maybe<ResourceMessageImagesEdge>;
};


/** The output of our delete `ResourceMessageImage` mutation. */
export type DeleteResourceMessageImagePayloadResourceMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessageImagesOrderBy>>;
};

/** All input for the `deleteResourceMessage` mutation. */
export type DeleteResourceMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceMessage` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `ResourceMessage` mutation. */
export type DeleteResourceMessagePayload = {
  __typename: 'DeleteResourceMessagePayload';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceMessageId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  /** The `ResourceMessage` that was deleted by this mutation. */
  resourceMessage: Maybe<ResourceMessage>;
  /** An edge for our `ResourceMessage`. May be used by Relay 1. */
  resourceMessageEdge: Maybe<ResourceMessagesEdge>;
};


/** The output of our delete `ResourceMessage` mutation. */
export type DeleteResourceMessagePayloadResourceMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/** The output of our delete `Resource` mutation. */
export type DeleteResourcePayload = {
  __typename: 'DeleteResourcePayload';
  /** Reads a single `Account` that is related to this `Resource`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedResourceId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `Resource` that was deleted by this mutation. */
  resource: Maybe<Resource>;
  /** An edge for our `Resource`. May be used by Relay 1. */
  resourceEdge: Maybe<ResourcesEdge>;
};


/** The output of our delete `Resource` mutation. */
export type DeleteResourcePayloadResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};

/** All input for the `deleteSystemSettingByKey` mutation. */
export type DeleteSystemSettingByKeyInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
};

/** All input for the `deleteSystemSetting` mutation. */
export type DeleteSystemSettingInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `SystemSetting` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `SystemSetting` mutation. */
export type DeleteSystemSettingPayload = {
  __typename: 'DeleteSystemSettingPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedSystemSettingId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `SystemSetting` that was deleted by this mutation. */
  systemSetting: Maybe<SystemSetting>;
  /** An edge for our `SystemSetting`. May be used by Relay 1. */
  systemSettingEdge: Maybe<SystemSettingsEdge>;
};


/** The output of our delete `SystemSetting` mutation. */
export type DeleteSystemSettingPayloadSystemSettingEdgeArgs = {
  orderBy?: InputMaybe<Array<SystemSettingsOrderBy>>;
};

/** All input for the `deleteTokenMovementById` mutation. */
export type DeleteTokenMovementByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `deleteTokenMovementByIdempotencyKey` mutation. */
export type DeleteTokenMovementByIdempotencyKeyInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  idempotencyKey: Scalars['String']['input'];
};

/** All input for the `deleteTokenMovement` mutation. */
export type DeleteTokenMovementInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `TokenMovement` to be deleted. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our delete `TokenMovement` mutation. */
export type DeleteTokenMovementPayload = {
  __typename: 'DeleteTokenMovementPayload';
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByCounterpartyAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  deletedTokenMovementId: Maybe<Scalars['ID']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `TokenMovement` that was deleted by this mutation. */
  tokenMovement: Maybe<TokenMovement>;
  /** An edge for our `TokenMovement`. May be used by Relay 1. */
  tokenMovementEdge: Maybe<TokenMovementsEdge>;
};


/** The output of our delete `TokenMovement` mutation. */
export type DeleteTokenMovementPayloadTokenMovementEdgeArgs = {
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};

/** All input for the `getAccountDeliveryPreferences` mutation. */
export type GetAccountDeliveryPreferencesInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `getAccountDeliveryPreferences` mutation. */
export type GetAccountDeliveryPreferencesPayload = {
  __typename: 'GetAccountDeliveryPreferencesPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  results: Maybe<Array<Maybe<GetAccountDeliveryPreferencesRecord>>>;
};

/** The return type of our `getAccountDeliveryPreferences` mutation. */
export type GetAccountDeliveryPreferencesRecord = {
  __typename: 'GetAccountDeliveryPreferencesRecord';
  deliveryStrategy: Maybe<Scalars['String']['output']>;
  eventCategory: Maybe<Scalars['String']['output']>;
  summaryFrequencyDays: Maybe<Scalars['Int']['output']>;
};

/** A connection to a list of `GetGrantForClaimRecord` values. */
export type GetGrantForClaimConnection = {
  __typename: 'GetGrantForClaimConnection';
  /** A list of edges which contains the `GetGrantForClaimRecord` and cursor to aid in pagination. */
  edges: Array<GetGrantForClaimEdge>;
  /** A list of `GetGrantForClaimRecord` objects. */
  nodes: Array<GetGrantForClaimRecord>;
  /** The count of *all* `GetGrantForClaimRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `GetGrantForClaimRecord` edge in the connection. */
export type GetGrantForClaimEdge = {
  __typename: 'GetGrantForClaimEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `GetGrantForClaimRecord` at the end of the edge. */
  node: GetGrantForClaimRecord;
};

/** The return type of our `getGrantForClaim` query. */
export type GetGrantForClaimRecord = {
  __typename: 'GetGrantForClaimRecord';
  awardedTokenAmount: Maybe<Scalars['Int']['output']>;
  description: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  linkedCampaignId: Maybe<Scalars['UUID']['output']>;
  maxSuccessfulClaimCount: Maybe<Scalars['Int']['output']>;
  title: Maybe<Scalars['String']['output']>;
};

/** All input for the `giftTokens` mutation. */
export type GiftTokensInput = {
  amount?: InputMaybe<Scalars['Int']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `giftTokens` mutation. */
export type GiftTokensPayload = {
  __typename: 'GiftTokensPayload';
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByCounterpartyAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  tokenMovement: Maybe<TokenMovement>;
  /** An edge for our `TokenMovement`. May be used by Relay 1. */
  tokenMovementEdge: Maybe<TokenMovementsEdge>;
};


/** The output of our `giftTokens` mutation. */
export type GiftTokensPayloadTokenMovementEdgeArgs = {
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};

/** Per-account successful claim records for grants, enforcing one successful award per grant/account. */
export type GrantClaim = Node & {
  __typename: 'GrantClaim';
  /** Reads a single `Account` that is related to this `GrantClaim`. */
  accountByAccountId: Maybe<Account>;
  accountId: Scalars['UUID']['output'];
  awardedAt: Scalars['Datetime']['output'];
  awardedTokenAmount: Scalars['Int']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** Reads a single `GrantDefinition` that is related to this `GrantClaim`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  grantId: Scalars['UUID']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads a single `TokenMovement` that is related to this `GrantClaim`. */
  tokenMovementByTokenMovementId: Maybe<TokenMovement>;
  tokenMovementId: Maybe<Scalars['UUID']['output']>;
};

/**
 * A condition to be used against `GrantClaim` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type GrantClaimCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `grantId` field. */
  grantId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `tokenMovementId` field. */
  tokenMovementId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `GrantClaim` */
export type GrantClaimInput = {
  accountId: Scalars['UUID']['input'];
  awardedAt?: InputMaybe<Scalars['Datetime']['input']>;
  awardedTokenAmount: Scalars['Int']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId: Scalars['UUID']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  tokenMovementId?: InputMaybe<Scalars['UUID']['input']>;
};

/** Represents an update to a `GrantClaim`. Fields that are set will be updated. */
export type GrantClaimPatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  awardedAt?: InputMaybe<Scalars['Datetime']['input']>;
  awardedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId?: InputMaybe<Scalars['UUID']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  tokenMovementId?: InputMaybe<Scalars['UUID']['input']>;
};

/** Result of an atomic grant claim attempt: outcome_code plus awarded amount and claim id on success. */
export type GrantClaimResult = {
  __typename: 'GrantClaimResult';
  claimedAmount: Maybe<Scalars['Int']['output']>;
  grantClaimId: Maybe<Scalars['UUID']['output']>;
  outcomeCode: Maybe<Scalars['String']['output']>;
};

/** A connection to a list of `GrantClaim` values. */
export type GrantClaimsConnection = {
  __typename: 'GrantClaimsConnection';
  /** A list of edges which contains the `GrantClaim` and cursor to aid in pagination. */
  edges: Array<GrantClaimsEdge>;
  /** A list of `GrantClaim` objects. */
  nodes: Array<GrantClaim>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `GrantClaim` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `GrantClaim` edge in the connection. */
export type GrantClaimsEdge = {
  __typename: 'GrantClaimsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `GrantClaim` at the end of the edge. */
  node: GrantClaim;
};

/** Methods to use when ordering `GrantClaim`. */
export enum GrantClaimsOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  GrantIdAsc = 'GRANT_ID_ASC',
  GrantIdDesc = 'GRANT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  TokenMovementIdAsc = 'TOKEN_MOVEMENT_ID_ASC',
  TokenMovementIdDesc = 'TOKEN_MOVEMENT_ID_DESC'
}

/** Administrator-defined token seeding grants with optional targeting and campaign criteria. */
export type GrantDefinition = Node & {
  __typename: 'GrantDefinition';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  archivedAt: Maybe<Scalars['Datetime']['output']>;
  awardedTokenAmount: Scalars['Int']['output'];
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  createdAt: Scalars['Datetime']['output'];
  createdByAccountId: Scalars['UUID']['output'];
  description: Scalars['String']['output'];
  expiresAt: Scalars['Datetime']['output'];
  /** Reads and enables pagination through a set of `GrantClaim`. */
  grantClaimsByGrantId: GrantClaimsConnection;
  /** Reads and enables pagination through a set of `GrantTargetAccount`. */
  grantTargetAccountsByGrantId: GrantTargetAccountsConnection;
  /** Reads and enables pagination through a set of `GrantTargetEmail`. */
  grantTargetEmailsByGrantId: GrantTargetEmailsConnection;
  id: Scalars['UUID']['output'];
  linkedCampaignId: Maybe<Scalars['UUID']['output']>;
  maxSuccessfulClaimCount: Maybe<Scalars['Int']['output']>;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Datetime']['output'];
};


/** Administrator-defined token seeding grants with optional targeting and campaign criteria. */
export type GrantDefinitionGrantClaimsByGrantIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};


/** Administrator-defined token seeding grants with optional targeting and campaign criteria. */
export type GrantDefinitionGrantTargetAccountsByGrantIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantTargetAccountCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};


/** Administrator-defined token seeding grants with optional targeting and campaign criteria. */
export type GrantDefinitionGrantTargetEmailsByGrantIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantTargetEmailCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantTargetEmailsOrderBy>>;
};

/**
 * A condition to be used against `GrantDefinition` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type GrantDefinitionCondition = {
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `createdByAccountId` field. */
  createdByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `linkedCampaignId` field. */
  linkedCampaignId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `GrantDefinition` */
export type GrantDefinitionInput = {
  archivedAt?: InputMaybe<Scalars['Datetime']['input']>;
  awardedTokenAmount: Scalars['Int']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  createdByAccountId: Scalars['UUID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt: Scalars['Datetime']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  linkedCampaignId?: InputMaybe<Scalars['UUID']['input']>;
  maxSuccessfulClaimCount?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Represents an update to a `GrantDefinition`. Fields that are set will be updated. */
export type GrantDefinitionPatch = {
  archivedAt?: InputMaybe<Scalars['Datetime']['input']>;
  awardedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  createdByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  linkedCampaignId?: InputMaybe<Scalars['UUID']['input']>;
  maxSuccessfulClaimCount?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `GrantDefinition` values. */
export type GrantDefinitionsConnection = {
  __typename: 'GrantDefinitionsConnection';
  /** A list of edges which contains the `GrantDefinition` and cursor to aid in pagination. */
  edges: Array<GrantDefinitionsEdge>;
  /** A list of `GrantDefinition` objects. */
  nodes: Array<GrantDefinition>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `GrantDefinition` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `GrantDefinition` edge in the connection. */
export type GrantDefinitionsEdge = {
  __typename: 'GrantDefinitionsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `GrantDefinition` at the end of the edge. */
  node: GrantDefinition;
};

/** Methods to use when ordering `GrantDefinition`. */
export enum GrantDefinitionsOrderBy {
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  CreatedByAccountIdAsc = 'CREATED_BY_ACCOUNT_ID_ASC',
  CreatedByAccountIdDesc = 'CREATED_BY_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  LinkedCampaignIdAsc = 'LINKED_CAMPAIGN_ID_ASC',
  LinkedCampaignIdDesc = 'LINKED_CAMPAIGN_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Per-grant account-id targeting criteria. Empty set means no account-id restriction. */
export type GrantTargetAccount = Node & {
  __typename: 'GrantTargetAccount';
  /** Reads a single `Account` that is related to this `GrantTargetAccount`. */
  accountByAccountId: Maybe<Account>;
  accountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetAccount`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  grantId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};

/**
 * A condition to be used against `GrantTargetAccount` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type GrantTargetAccountCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `grantId` field. */
  grantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `GrantTargetAccount` */
export type GrantTargetAccountInput = {
  accountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId: Scalars['UUID']['input'];
};

/** Represents an update to a `GrantTargetAccount`. Fields that are set will be updated. */
export type GrantTargetAccountPatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `GrantTargetAccount` values. */
export type GrantTargetAccountsConnection = {
  __typename: 'GrantTargetAccountsConnection';
  /** A list of edges which contains the `GrantTargetAccount` and cursor to aid in pagination. */
  edges: Array<GrantTargetAccountsEdge>;
  /** A list of `GrantTargetAccount` objects. */
  nodes: Array<GrantTargetAccount>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `GrantTargetAccount` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `GrantTargetAccount` edge in the connection. */
export type GrantTargetAccountsEdge = {
  __typename: 'GrantTargetAccountsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `GrantTargetAccount` at the end of the edge. */
  node: GrantTargetAccount;
};

/** Methods to use when ordering `GrantTargetAccount`. */
export enum GrantTargetAccountsOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  GrantIdAsc = 'GRANT_ID_ASC',
  GrantIdDesc = 'GRANT_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Per-grant email targeting criteria using canonical lower-trimmed email values. */
export type GrantTargetEmail = Node & {
  __typename: 'GrantTargetEmail';
  createdAt: Scalars['Datetime']['output'];
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetEmail`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  grantId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  targetEmail: Scalars['String']['output'];
  targetEmailNormalized: Scalars['String']['output'];
};

/**
 * A condition to be used against `GrantTargetEmail` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type GrantTargetEmailCondition = {
  /** Checks for equality with the object’s `grantId` field. */
  grantId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `targetEmailNormalized` field. */
  targetEmailNormalized?: InputMaybe<Scalars['String']['input']>;
};

/** An input for mutations affecting `GrantTargetEmail` */
export type GrantTargetEmailInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId: Scalars['UUID']['input'];
  targetEmail: Scalars['String']['input'];
  targetEmailNormalized: Scalars['String']['input'];
};

/** Represents an update to a `GrantTargetEmail`. Fields that are set will be updated. */
export type GrantTargetEmailPatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  grantId?: InputMaybe<Scalars['UUID']['input']>;
  targetEmail?: InputMaybe<Scalars['String']['input']>;
  targetEmailNormalized?: InputMaybe<Scalars['String']['input']>;
};

/** A connection to a list of `GrantTargetEmail` values. */
export type GrantTargetEmailsConnection = {
  __typename: 'GrantTargetEmailsConnection';
  /** A list of edges which contains the `GrantTargetEmail` and cursor to aid in pagination. */
  edges: Array<GrantTargetEmailsEdge>;
  /** A list of `GrantTargetEmail` objects. */
  nodes: Array<GrantTargetEmail>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `GrantTargetEmail` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `GrantTargetEmail` edge in the connection. */
export type GrantTargetEmailsEdge = {
  __typename: 'GrantTargetEmailsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `GrantTargetEmail` at the end of the edge. */
  node: GrantTargetEmail;
};

/** Methods to use when ordering `GrantTargetEmail`. */
export enum GrantTargetEmailsOrderBy {
  GrantIdAsc = 'GRANT_ID_ASC',
  GrantIdDesc = 'GRANT_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  TargetEmailNormalizedAsc = 'TARGET_EMAIL_NORMALIZED_ASC',
  TargetEmailNormalizedDesc = 'TARGET_EMAIL_NORMALIZED_DESC'
}

/** All input for the `linkAccountExternalIdentity` mutation. */
export type LinkAccountExternalIdentityInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pMetadata?: InputMaybe<Scalars['JSON']['input']>;
  pProvider?: InputMaybe<Scalars['String']['input']>;
  pProviderEmail?: InputMaybe<Scalars['String']['input']>;
  pProviderEmailVerified?: InputMaybe<Scalars['Boolean']['input']>;
  pProviderSubject?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `linkAccountExternalIdentity` mutation. */
export type LinkAccountExternalIdentityPayload = {
  __typename: 'LinkAccountExternalIdentityPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  string: Maybe<Scalars['String']['output']>;
};

/** A `ListChatConversationsRecord` edge in the connection. */
export type ListChatConversationEdge = {
  __typename: 'ListChatConversationEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ListChatConversationsRecord` at the end of the edge. */
  node: ListChatConversationsRecord;
};

/** A connection to a list of `ListChatConversationsRecord` values. */
export type ListChatConversationsConnection = {
  __typename: 'ListChatConversationsConnection';
  /** A list of edges which contains the `ListChatConversationsRecord` and cursor to aid in pagination. */
  edges: Array<ListChatConversationEdge>;
  /** A list of `ListChatConversationsRecord` objects. */
  nodes: Array<ListChatConversationsRecord>;
  /** The count of *all* `ListChatConversationsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `listChatConversations` query. */
export type ListChatConversationsRecord = {
  __typename: 'ListChatConversationsRecord';
  contextId: Maybe<Scalars['UUID']['output']>;
  contextTitle: Maybe<Scalars['String']['output']>;
  conversationId: Maybe<Scalars['UUID']['output']>;
  conversationKind: Maybe<ChatContextKind>;
  lastActivityAt: Maybe<Scalars['Datetime']['output']>;
  lastMessagePreview: Maybe<Scalars['String']['output']>;
  otherAccountDisplayName: Maybe<Scalars['String']['output']>;
  otherAccountId: Maybe<Scalars['UUID']['output']>;
  unreadCount: Maybe<Scalars['Int']['output']>;
};

/** A connection to a list of `ListResourceCategoriesRecord` values. */
export type ListResourceCategoriesConnection = {
  __typename: 'ListResourceCategoriesConnection';
  /** A list of edges which contains the `ListResourceCategoriesRecord` and cursor to aid in pagination. */
  edges: Array<ListResourceCategoryEdge>;
  /** A list of `ListResourceCategoriesRecord` objects. */
  nodes: Array<ListResourceCategoriesRecord>;
  /** The count of *all* `ListResourceCategoriesRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `listResourceCategories` query. */
export type ListResourceCategoriesRecord = {
  __typename: 'ListResourceCategoriesRecord';
  code: Maybe<Scalars['Int']['output']>;
  label: Maybe<Scalars['String']['output']>;
  labelFr: Maybe<Scalars['String']['output']>;
  slug: Maybe<Scalars['String']['output']>;
  sortOrder: Maybe<Scalars['Int']['output']>;
};

/** A `ListResourceCategoriesRecord` edge in the connection. */
export type ListResourceCategoryEdge = {
  __typename: 'ListResourceCategoryEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ListResourceCategoriesRecord` at the end of the edge. */
  node: ListResourceCategoriesRecord;
};

export type ListenPayload = {
  __typename: 'ListenPayload';
  /** Our root query field type. Allows us to run any query from our subscription payload. */
  query: Maybe<Query>;
  relatedNode: Maybe<Node>;
  relatedNodeId: Maybe<Scalars['ID']['output']>;
};

/** All input for the `markAccountNotificationRead` mutation. */
export type MarkAccountNotificationReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  notificationId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `markAccountNotificationRead` mutation. */
export type MarkAccountNotificationReadPayload = {
  __typename: 'MarkAccountNotificationReadPayload';
  /** Reads a single `Account` that is related to this `AccountNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  accountNotification: Maybe<AccountNotification>;
  /** An edge for our `AccountNotification`. May be used by Relay 1. */
  accountNotificationEdge: Maybe<AccountNotificationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `markAccountNotificationRead` mutation. */
export type MarkAccountNotificationReadPayloadAccountNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};

/** All input for the `markAllNotificationsRead` mutation. */
export type MarkAllNotificationsReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `markAllNotificationsRead` mutation. */
export type MarkAllNotificationsReadPayload = {
  __typename: 'MarkAllNotificationsReadPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `markClaimMessagesRead` mutation. */
export type MarkClaimMessagesReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `markClaimMessagesRead` mutation. */
export type MarkClaimMessagesReadPayload = {
  __typename: 'MarkClaimMessagesReadPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `markNeedClaimNotificationRead` mutation. */
export type MarkNeedClaimNotificationReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  notificationId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `markNeedClaimNotificationRead` mutation. */
export type MarkNeedClaimNotificationReadPayload = {
  __typename: 'MarkNeedClaimNotificationReadPayload';
  /** Reads a single `Account` that is related to this `NeedClaimNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimNotification`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  needClaimNotification: Maybe<NeedClaimNotification>;
  /** An edge for our `NeedClaimNotification`. May be used by Relay 1. */
  needClaimNotificationEdge: Maybe<NeedClaimNotificationsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `markNeedClaimNotificationRead` mutation. */
export type MarkNeedClaimNotificationReadPayloadNeedClaimNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};

/** All input for the `markResourceBidNotificationRead` mutation. */
export type MarkResourceBidNotificationReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  notificationId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `markResourceBidNotificationRead` mutation. */
export type MarkResourceBidNotificationReadPayload = {
  __typename: 'MarkResourceBidNotificationReadPayload';
  /** Reads a single `Account` that is related to this `ResourceBidNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceBidNotification`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  resourceBidNotification: Maybe<ResourceBidNotification>;
  /** An edge for our `ResourceBidNotification`. May be used by Relay 1. */
  resourceBidNotificationEdge: Maybe<ResourceBidNotificationsEdge>;
};


/** The output of our `markResourceBidNotificationRead` mutation. */
export type MarkResourceBidNotificationReadPayloadResourceBidNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};

/** All input for the `markResourceMessagesRead` mutation. */
export type MarkResourceMessagesReadInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pConversationId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `markResourceMessagesRead` mutation. */
export type MarkResourceMessagesReadPayload = {
  __typename: 'MarkResourceMessagesReadPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** The root mutation type which contains root level fields which mutate data. */
export type Mutation = {
  __typename: 'Mutation';
  acceptCampaignNeed: Maybe<AcceptCampaignNeedPayload>;
  addCampaignModerationNote: Maybe<AddCampaignModerationNotePayload>;
  /** Returns the stored HTML body of a mail outbox entry. Admin only. */
  adminGetMailContent: Maybe<AdminGetMailContentPayload>;
  /** Resets a mail outbox entry to pending for re-delivery via the same scheduled mailing routine. Admin only. */
  adminResendMail: Maybe<AdminResendMailPayload>;
  approveCampaign: Maybe<ApproveCampaignPayload>;
  /** Archives a grant definition so it no longer appears in the claim flow. Admin only. */
  archiveGrant: Maybe<ArchiveGrantPayload>;
  authChangePassword: Maybe<AuthChangePasswordPayload>;
  authLogin: Maybe<AuthLoginPayload>;
  authLogout: Maybe<AuthLogoutPayload>;
  cancelNeedClaim: Maybe<CancelNeedClaimPayload>;
  cancelResourceBid: Maybe<CancelResourceBidPayload>;
  /**
   * Atomically evaluates all grant criteria for the authenticated account and, if satisfied,
   * issues a token award and returns outcome_code = 'success'. On failure returns a safe denial
   * reason code: not_authenticated | grant_unavailable | expired | already_claimed | cap_reached |
   * not_targeted | campaign_criterion_not_satisfied.
   */
  claimGrant: Maybe<ClaimGrantPayload>;
  claimNeed: Maybe<ClaimNeedPayload>;
  cleanupOperationalLogs: Maybe<CleanupOperationalLogsPayload>;
  cleanupReadNotifications: Maybe<CleanupReadNotificationsPayload>;
  confirmEmailVerification: Maybe<ConfirmEmailVerificationPayload>;
  confirmPasswordReset: Maybe<ConfirmPasswordResetPayload>;
  confirmPasswordResetWithPassword: Maybe<ConfirmPasswordResetWithPasswordPayload>;
  /** Creates a single `Account`. */
  createAccount: Maybe<CreateAccountPayload>;
  /** Creates a single `AccountDeliveryPreference`. */
  createAccountDeliveryPreference: Maybe<CreateAccountDeliveryPreferencePayload>;
  /** Creates a single `AccountNotification`. */
  createAccountNotification: Maybe<CreateAccountNotificationPayload>;
  createCampaign: Maybe<CreateCampaignPayload>;
  /** Creates a single `CampaignModerationAuditEvent`. */
  createCampaignModerationAuditEvent: Maybe<CreateCampaignModerationAuditEventPayload>;
  /** Creates a single `CampaignModerationNote`. */
  createCampaignModerationNote: Maybe<CreateCampaignModerationNotePayload>;
  /** Creates a single `CampaignNeed`. */
  createCampaignNeed: Maybe<CreateCampaignNeedPayload>;
  /** Creates a single `CampaignResource`. */
  createCampaignResource: Maybe<CreateCampaignResourcePayload>;
  /** Creates a single `ChatTypingPresence`. */
  createChatTypingPresence: Maybe<CreateChatTypingPresencePayload>;
  /** Creates a single `ClaimConversation`. */
  createClaimConversation: Maybe<CreateClaimConversationPayload>;
  /** Creates a single `ClaimMessage`. */
  createClaimMessage: Maybe<CreateClaimMessagePayload>;
  /** Creates a single `ClaimMessageImage`. */
  createClaimMessageImage: Maybe<CreateClaimMessageImagePayload>;
  /** Creates a single `GrantClaim`. */
  createGrantClaim: Maybe<CreateGrantClaimPayload>;
  /** Creates a single `GrantDefinition`. */
  createGrantDefinition: Maybe<CreateGrantDefinitionPayload>;
  /** Creates a single `GrantTargetAccount`. */
  createGrantTargetAccount: Maybe<CreateGrantTargetAccountPayload>;
  /** Creates a single `GrantTargetEmail`. */
  createGrantTargetEmail: Maybe<CreateGrantTargetEmailPayload>;
  createNeed: Maybe<CreateNeedPayload>;
  /** Creates a single `NeedClaim`. */
  createNeedClaim: Maybe<CreateNeedClaimPayload>;
  /** Creates a single `NeedClaimNotification`. */
  createNeedClaimNotification: Maybe<CreateNeedClaimNotificationPayload>;
  /** Creates a single `NeedClaimSettlementEvent`. */
  createNeedClaimSettlementEvent: Maybe<CreateNeedClaimSettlementEventPayload>;
  /** Creates a single `OperationalLog`. */
  createOperationalLog: Maybe<CreateOperationalLogPayload>;
  /** Creates a single `Resource`. */
  createResource: Maybe<CreateResourcePayload>;
  /** Creates a single `ResourceBid`. */
  createResourceBid: Maybe<CreateResourceBidPayload>;
  /** Creates a single `ResourceBidNotification`. */
  createResourceBidNotification: Maybe<CreateResourceBidNotificationPayload>;
  /** Creates a single `ResourceCategory`. */
  createResourceCategory: Maybe<CreateResourceCategoryPayload>;
  /** Creates a single `ResourceCategoryAssignment`. */
  createResourceCategoryAssignment: Maybe<CreateResourceCategoryAssignmentPayload>;
  /** Creates a single `ResourceConversation`. */
  createResourceConversation: Maybe<CreateResourceConversationPayload>;
  /** Creates a single `ResourceMessage`. */
  createResourceMessage: Maybe<CreateResourceMessagePayload>;
  /** Creates a single `ResourceMessageImage`. */
  createResourceMessageImage: Maybe<CreateResourceMessageImagePayload>;
  /** Creates a single `SystemSetting`. */
  createSystemSetting: Maybe<CreateSystemSettingPayload>;
  /** Creates a single `TokenMovement`. */
  createTokenMovement: Maybe<CreateTokenMovementPayload>;
  declineNeedClaim: Maybe<DeclineNeedClaimPayload>;
  /** Deletes a single `Account` using its globally unique id. */
  deleteAccount: Maybe<DeleteAccountPayload>;
  /** Deletes a single `Account` using a unique key. */
  deleteAccountByExternalSubject: Maybe<DeleteAccountPayload>;
  /** Deletes a single `Account` using a unique key. */
  deleteAccountById: Maybe<DeleteAccountPayload>;
  /** Deletes a single `AccountDeliveryPreference` using its globally unique id. */
  deleteAccountDeliveryPreference: Maybe<DeleteAccountDeliveryPreferencePayload>;
  /** Deletes a single `AccountDeliveryPreference` using a unique key. */
  deleteAccountDeliveryPreferenceByAccountIdAndEventCategory: Maybe<DeleteAccountDeliveryPreferencePayload>;
  /** Deletes a single `AccountNotification` using its globally unique id. */
  deleteAccountNotification: Maybe<DeleteAccountNotificationPayload>;
  /** Deletes a single `AccountNotification` using a unique key. */
  deleteAccountNotificationById: Maybe<DeleteAccountNotificationPayload>;
  /** Deletes a single `Campaign` using its globally unique id. */
  deleteCampaign: Maybe<DeleteCampaignPayload>;
  /** Deletes a single `Campaign` using a unique key. */
  deleteCampaignById: Maybe<DeleteCampaignPayload>;
  /** Deletes a single `CampaignModerationAuditEvent` using its globally unique id. */
  deleteCampaignModerationAuditEvent: Maybe<DeleteCampaignModerationAuditEventPayload>;
  /** Deletes a single `CampaignModerationAuditEvent` using a unique key. */
  deleteCampaignModerationAuditEventById: Maybe<DeleteCampaignModerationAuditEventPayload>;
  /** Deletes a single `CampaignModerationNote` using its globally unique id. */
  deleteCampaignModerationNote: Maybe<DeleteCampaignModerationNotePayload>;
  /** Deletes a single `CampaignModerationNote` using a unique key. */
  deleteCampaignModerationNoteById: Maybe<DeleteCampaignModerationNotePayload>;
  /** Deletes a single `CampaignNeed` using its globally unique id. */
  deleteCampaignNeed: Maybe<DeleteCampaignNeedPayload>;
  /** Deletes a single `CampaignNeed` using a unique key. */
  deleteCampaignNeedByCampaignIdAndNeedId: Maybe<DeleteCampaignNeedPayload>;
  /** Deletes a single `CampaignResource` using its globally unique id. */
  deleteCampaignResource: Maybe<DeleteCampaignResourcePayload>;
  /** Deletes a single `CampaignResource` using a unique key. */
  deleteCampaignResourceByCampaignIdAndResourceId: Maybe<DeleteCampaignResourcePayload>;
  /** Deletes a single `ChatTypingPresence` using its globally unique id. */
  deleteChatTypingPresence: Maybe<DeleteChatTypingPresencePayload>;
  /** Deletes a single `ChatTypingPresence` using a unique key. */
  deleteChatTypingPresenceByConversationKindAndConversationIdAndAccountId: Maybe<DeleteChatTypingPresencePayload>;
  /** Deletes a single `ClaimConversation` using its globally unique id. */
  deleteClaimConversation: Maybe<DeleteClaimConversationPayload>;
  /** Deletes a single `ClaimConversation` using a unique key. */
  deleteClaimConversationById: Maybe<DeleteClaimConversationPayload>;
  /** Deletes a single `ClaimConversation` using a unique key. */
  deleteClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: Maybe<DeleteClaimConversationPayload>;
  /** Deletes a single `ClaimMessage` using its globally unique id. */
  deleteClaimMessage: Maybe<DeleteClaimMessagePayload>;
  /** Deletes a single `ClaimMessage` using a unique key. */
  deleteClaimMessageById: Maybe<DeleteClaimMessagePayload>;
  /** Deletes a single `ClaimMessageImage` using its globally unique id. */
  deleteClaimMessageImage: Maybe<DeleteClaimMessageImagePayload>;
  /** Deletes a single `ClaimMessageImage` using a unique key. */
  deleteClaimMessageImageById: Maybe<DeleteClaimMessageImagePayload>;
  /** Deletes a single `GrantClaim` using its globally unique id. */
  deleteGrantClaim: Maybe<DeleteGrantClaimPayload>;
  /** Deletes a single `GrantClaim` using a unique key. */
  deleteGrantClaimByGrantIdAndAccountId: Maybe<DeleteGrantClaimPayload>;
  /** Deletes a single `GrantClaim` using a unique key. */
  deleteGrantClaimById: Maybe<DeleteGrantClaimPayload>;
  /** Deletes a single `GrantDefinition` using its globally unique id. */
  deleteGrantDefinition: Maybe<DeleteGrantDefinitionPayload>;
  /** Deletes a single `GrantDefinition` using a unique key. */
  deleteGrantDefinitionById: Maybe<DeleteGrantDefinitionPayload>;
  /** Deletes a single `GrantTargetAccount` using its globally unique id. */
  deleteGrantTargetAccount: Maybe<DeleteGrantTargetAccountPayload>;
  /** Deletes a single `GrantTargetAccount` using a unique key. */
  deleteGrantTargetAccountByGrantIdAndAccountId: Maybe<DeleteGrantTargetAccountPayload>;
  /** Deletes a single `GrantTargetEmail` using its globally unique id. */
  deleteGrantTargetEmail: Maybe<DeleteGrantTargetEmailPayload>;
  /** Deletes a single `GrantTargetEmail` using a unique key. */
  deleteGrantTargetEmailByGrantIdAndTargetEmailNormalized: Maybe<DeleteGrantTargetEmailPayload>;
  /** Deletes a single `Need` using its globally unique id. */
  deleteNeed: Maybe<DeleteNeedPayload>;
  /** Deletes a single `Need` using a unique key. */
  deleteNeedById: Maybe<DeleteNeedPayload>;
  /** Deletes a single `NeedClaim` using its globally unique id. */
  deleteNeedClaim: Maybe<DeleteNeedClaimPayload>;
  /** Deletes a single `NeedClaim` using a unique key. */
  deleteNeedClaimById: Maybe<DeleteNeedClaimPayload>;
  /** Deletes a single `NeedClaim` using a unique key. */
  deleteNeedClaimByNeedIdAndClaimerAccountId: Maybe<DeleteNeedClaimPayload>;
  /** Deletes a single `NeedClaimNotification` using its globally unique id. */
  deleteNeedClaimNotification: Maybe<DeleteNeedClaimNotificationPayload>;
  /** Deletes a single `NeedClaimNotification` using a unique key. */
  deleteNeedClaimNotificationById: Maybe<DeleteNeedClaimNotificationPayload>;
  /** Deletes a single `NeedClaimSettlementEvent` using its globally unique id. */
  deleteNeedClaimSettlementEvent: Maybe<DeleteNeedClaimSettlementEventPayload>;
  /** Deletes a single `NeedClaimSettlementEvent` using a unique key. */
  deleteNeedClaimSettlementEventById: Maybe<DeleteNeedClaimSettlementEventPayload>;
  /** Deletes a single `NeedClaimSettlementEvent` using a unique key. */
  deleteNeedClaimSettlementEventByNeedClaimId: Maybe<DeleteNeedClaimSettlementEventPayload>;
  /** Deletes a single `OperationalLog` using its globally unique id. */
  deleteOperationalLog: Maybe<DeleteOperationalLogPayload>;
  /** Deletes a single `OperationalLog` using a unique key. */
  deleteOperationalLogById: Maybe<DeleteOperationalLogPayload>;
  /** Deletes a single `Resource` using its globally unique id. */
  deleteResource: Maybe<DeleteResourcePayload>;
  /** Deletes a single `ResourceBid` using its globally unique id. */
  deleteResourceBid: Maybe<DeleteResourceBidPayload>;
  /** Deletes a single `ResourceBid` using a unique key. */
  deleteResourceBidById: Maybe<DeleteResourceBidPayload>;
  /** Deletes a single `ResourceBid` using a unique key. */
  deleteResourceBidByResourceIdAndBidderAccountId: Maybe<DeleteResourceBidPayload>;
  /** Deletes a single `ResourceBidNotification` using its globally unique id. */
  deleteResourceBidNotification: Maybe<DeleteResourceBidNotificationPayload>;
  /** Deletes a single `ResourceBidNotification` using a unique key. */
  deleteResourceBidNotificationById: Maybe<DeleteResourceBidNotificationPayload>;
  /** Deletes a single `Resource` using a unique key. */
  deleteResourceById: Maybe<DeleteResourcePayload>;
  /** Deletes a single `ResourceCategory` using its globally unique id. */
  deleteResourceCategory: Maybe<DeleteResourceCategoryPayload>;
  /** Deletes a single `ResourceCategoryAssignment` using its globally unique id. */
  deleteResourceCategoryAssignment: Maybe<DeleteResourceCategoryAssignmentPayload>;
  /** Deletes a single `ResourceCategoryAssignment` using a unique key. */
  deleteResourceCategoryAssignmentByResourceIdAndCategoryCode: Maybe<DeleteResourceCategoryAssignmentPayload>;
  /** Deletes a single `ResourceCategory` using a unique key. */
  deleteResourceCategoryByCode: Maybe<DeleteResourceCategoryPayload>;
  /** Deletes a single `ResourceCategory` using a unique key. */
  deleteResourceCategoryBySlug: Maybe<DeleteResourceCategoryPayload>;
  /** Deletes a single `ResourceConversation` using its globally unique id. */
  deleteResourceConversation: Maybe<DeleteResourceConversationPayload>;
  /** Deletes a single `ResourceConversation` using a unique key. */
  deleteResourceConversationById: Maybe<DeleteResourceConversationPayload>;
  /** Deletes a single `ResourceConversation` using a unique key. */
  deleteResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: Maybe<DeleteResourceConversationPayload>;
  /** Deletes a single `ResourceMessage` using its globally unique id. */
  deleteResourceMessage: Maybe<DeleteResourceMessagePayload>;
  /** Deletes a single `ResourceMessage` using a unique key. */
  deleteResourceMessageById: Maybe<DeleteResourceMessagePayload>;
  /** Deletes a single `ResourceMessageImage` using its globally unique id. */
  deleteResourceMessageImage: Maybe<DeleteResourceMessageImagePayload>;
  /** Deletes a single `ResourceMessageImage` using a unique key. */
  deleteResourceMessageImageById: Maybe<DeleteResourceMessageImagePayload>;
  /** Deletes a single `SystemSetting` using its globally unique id. */
  deleteSystemSetting: Maybe<DeleteSystemSettingPayload>;
  /** Deletes a single `SystemSetting` using a unique key. */
  deleteSystemSettingByKey: Maybe<DeleteSystemSettingPayload>;
  /** Deletes a single `TokenMovement` using its globally unique id. */
  deleteTokenMovement: Maybe<DeleteTokenMovementPayload>;
  /** Deletes a single `TokenMovement` using a unique key. */
  deleteTokenMovementById: Maybe<DeleteTokenMovementPayload>;
  /** Deletes a single `TokenMovement` using a unique key. */
  deleteTokenMovementByIdempotencyKey: Maybe<DeleteTokenMovementPayload>;
  getAccountDeliveryPreferences: Maybe<GetAccountDeliveryPreferencesPayload>;
  giftTokens: Maybe<GiftTokensPayload>;
  linkAccountExternalIdentity: Maybe<LinkAccountExternalIdentityPayload>;
  markAccountNotificationRead: Maybe<MarkAccountNotificationReadPayload>;
  markAllNotificationsRead: Maybe<MarkAllNotificationsReadPayload>;
  markClaimMessagesRead: Maybe<MarkClaimMessagesReadPayload>;
  markNeedClaimNotificationRead: Maybe<MarkNeedClaimNotificationReadPayload>;
  markResourceBidNotificationRead: Maybe<MarkResourceBidNotificationReadPayload>;
  markResourceMessagesRead: Maybe<MarkResourceMessagesReadPayload>;
  publishResource: Maybe<PublishResourcePayload>;
  registerLocalAccount: Maybe<RegisterLocalAccountPayload>;
  registerLocalAccountWithPassword: Maybe<RegisterLocalAccountWithPasswordPayload>;
  rejectCampaignNeed: Maybe<RejectCampaignNeedPayload>;
  requestEmailVerification: Maybe<RequestEmailVerificationPayload>;
  requestPasswordReset: Maybe<RequestPasswordResetPayload>;
  respondToResourceBid: Maybe<RespondToResourceBidPayload>;
  searchOperationalLogs: Maybe<SearchOperationalLogsPayload>;
  sendClaimMessage: Maybe<SendClaimMessagePayload>;
  sendNeedMessage: Maybe<SendNeedMessagePayload>;
  sendResourceMessage: Maybe<SendResourceMessagePayload>;
  sendResourceMessageDirect: Maybe<SendResourceMessageDirectPayload>;
  setAccountDeliveryPreference: Maybe<SetAccountDeliveryPreferencePayload>;
  /** Replaces the full set of account-id targeting criteria for a grant. Admin only. */
  setGrantTargetAccounts: Maybe<SetGrantTargetAccountsPayload>;
  /** Replaces the full set of email targeting criteria for a grant using normalized matching. Admin only. */
  setGrantTargetEmails: Maybe<SetGrantTargetEmailsPayload>;
  settleNeedClaim: Maybe<SettleNeedClaimPayload>;
  submitResourceBid: Maybe<SubmitResourceBidPayload>;
  /** Updates a single `Account` using its globally unique id and a patch. */
  updateAccount: Maybe<UpdateAccountPayload>;
  /** Updates a single `Account` using a unique key and a patch. */
  updateAccountByExternalSubject: Maybe<UpdateAccountPayload>;
  /** Updates a single `Account` using a unique key and a patch. */
  updateAccountById: Maybe<UpdateAccountPayload>;
  /** Updates a single `AccountDeliveryPreference` using its globally unique id and a patch. */
  updateAccountDeliveryPreference: Maybe<UpdateAccountDeliveryPreferencePayload>;
  /** Updates a single `AccountDeliveryPreference` using a unique key and a patch. */
  updateAccountDeliveryPreferenceByAccountIdAndEventCategory: Maybe<UpdateAccountDeliveryPreferencePayload>;
  /** Updates a single `AccountNotification` using its globally unique id and a patch. */
  updateAccountNotification: Maybe<UpdateAccountNotificationPayload>;
  /** Updates a single `AccountNotification` using a unique key and a patch. */
  updateAccountNotificationById: Maybe<UpdateAccountNotificationPayload>;
  /** Updates a single `Campaign` using its globally unique id and a patch. */
  updateCampaign: Maybe<UpdateCampaignPayload>;
  /** Updates a single `Campaign` using a unique key and a patch. */
  updateCampaignById: Maybe<UpdateCampaignPayload>;
  updateCampaignForModeration: Maybe<UpdateCampaignForModerationPayload>;
  /** Updates a single `CampaignModerationAuditEvent` using its globally unique id and a patch. */
  updateCampaignModerationAuditEvent: Maybe<UpdateCampaignModerationAuditEventPayload>;
  /** Updates a single `CampaignModerationAuditEvent` using a unique key and a patch. */
  updateCampaignModerationAuditEventById: Maybe<UpdateCampaignModerationAuditEventPayload>;
  /** Updates a single `CampaignModerationNote` using its globally unique id and a patch. */
  updateCampaignModerationNote: Maybe<UpdateCampaignModerationNotePayload>;
  /** Updates a single `CampaignModerationNote` using a unique key and a patch. */
  updateCampaignModerationNoteById: Maybe<UpdateCampaignModerationNotePayload>;
  /** Updates a single `CampaignNeed` using its globally unique id and a patch. */
  updateCampaignNeed: Maybe<UpdateCampaignNeedPayload>;
  /** Updates a single `CampaignNeed` using a unique key and a patch. */
  updateCampaignNeedByCampaignIdAndNeedId: Maybe<UpdateCampaignNeedPayload>;
  /** Updates a single `CampaignResource` using its globally unique id and a patch. */
  updateCampaignResource: Maybe<UpdateCampaignResourcePayload>;
  /** Updates a single `CampaignResource` using a unique key and a patch. */
  updateCampaignResourceByCampaignIdAndResourceId: Maybe<UpdateCampaignResourcePayload>;
  /** Updates a single `ChatTypingPresence` using its globally unique id and a patch. */
  updateChatTypingPresence: Maybe<UpdateChatTypingPresencePayload>;
  /** Updates a single `ChatTypingPresence` using a unique key and a patch. */
  updateChatTypingPresenceByConversationKindAndConversationIdAndAccountId: Maybe<UpdateChatTypingPresencePayload>;
  /** Updates a single `ClaimConversation` using its globally unique id and a patch. */
  updateClaimConversation: Maybe<UpdateClaimConversationPayload>;
  /** Updates a single `ClaimConversation` using a unique key and a patch. */
  updateClaimConversationById: Maybe<UpdateClaimConversationPayload>;
  /** Updates a single `ClaimConversation` using a unique key and a patch. */
  updateClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: Maybe<UpdateClaimConversationPayload>;
  /** Updates a single `ClaimMessage` using its globally unique id and a patch. */
  updateClaimMessage: Maybe<UpdateClaimMessagePayload>;
  /** Updates a single `ClaimMessage` using a unique key and a patch. */
  updateClaimMessageById: Maybe<UpdateClaimMessagePayload>;
  /** Updates a single `ClaimMessageImage` using its globally unique id and a patch. */
  updateClaimMessageImage: Maybe<UpdateClaimMessageImagePayload>;
  /** Updates a single `ClaimMessageImage` using a unique key and a patch. */
  updateClaimMessageImageById: Maybe<UpdateClaimMessageImagePayload>;
  /** Updates a single `GrantClaim` using its globally unique id and a patch. */
  updateGrantClaim: Maybe<UpdateGrantClaimPayload>;
  /** Updates a single `GrantClaim` using a unique key and a patch. */
  updateGrantClaimByGrantIdAndAccountId: Maybe<UpdateGrantClaimPayload>;
  /** Updates a single `GrantClaim` using a unique key and a patch. */
  updateGrantClaimById: Maybe<UpdateGrantClaimPayload>;
  /** Updates a single `GrantDefinition` using its globally unique id and a patch. */
  updateGrantDefinition: Maybe<UpdateGrantDefinitionPayload>;
  /** Updates a single `GrantDefinition` using a unique key and a patch. */
  updateGrantDefinitionById: Maybe<UpdateGrantDefinitionPayload>;
  /** Updates a single `GrantTargetAccount` using its globally unique id and a patch. */
  updateGrantTargetAccount: Maybe<UpdateGrantTargetAccountPayload>;
  /** Updates a single `GrantTargetAccount` using a unique key and a patch. */
  updateGrantTargetAccountByGrantIdAndAccountId: Maybe<UpdateGrantTargetAccountPayload>;
  /** Updates a single `GrantTargetEmail` using its globally unique id and a patch. */
  updateGrantTargetEmail: Maybe<UpdateGrantTargetEmailPayload>;
  /** Updates a single `GrantTargetEmail` using a unique key and a patch. */
  updateGrantTargetEmailByGrantIdAndTargetEmailNormalized: Maybe<UpdateGrantTargetEmailPayload>;
  /** Updates a single `Need` using its globally unique id and a patch. */
  updateNeed: Maybe<UpdateNeedPayload>;
  /** Updates a single `Need` using a unique key and a patch. */
  updateNeedById: Maybe<UpdateNeedPayload>;
  /** Updates a single `NeedClaim` using its globally unique id and a patch. */
  updateNeedClaim: Maybe<UpdateNeedClaimPayload>;
  /** Updates a single `NeedClaim` using a unique key and a patch. */
  updateNeedClaimById: Maybe<UpdateNeedClaimPayload>;
  /** Updates a single `NeedClaim` using a unique key and a patch. */
  updateNeedClaimByNeedIdAndClaimerAccountId: Maybe<UpdateNeedClaimPayload>;
  /** Updates a single `NeedClaimNotification` using its globally unique id and a patch. */
  updateNeedClaimNotification: Maybe<UpdateNeedClaimNotificationPayload>;
  /** Updates a single `NeedClaimNotification` using a unique key and a patch. */
  updateNeedClaimNotificationById: Maybe<UpdateNeedClaimNotificationPayload>;
  /** Updates a single `NeedClaimSettlementEvent` using its globally unique id and a patch. */
  updateNeedClaimSettlementEvent: Maybe<UpdateNeedClaimSettlementEventPayload>;
  /** Updates a single `NeedClaimSettlementEvent` using a unique key and a patch. */
  updateNeedClaimSettlementEventById: Maybe<UpdateNeedClaimSettlementEventPayload>;
  /** Updates a single `NeedClaimSettlementEvent` using a unique key and a patch. */
  updateNeedClaimSettlementEventByNeedClaimId: Maybe<UpdateNeedClaimSettlementEventPayload>;
  /** Updates a single `OperationalLog` using its globally unique id and a patch. */
  updateOperationalLog: Maybe<UpdateOperationalLogPayload>;
  /** Updates a single `OperationalLog` using a unique key and a patch. */
  updateOperationalLogById: Maybe<UpdateOperationalLogPayload>;
  /** Updates a single `Resource` using its globally unique id and a patch. */
  updateResource: Maybe<UpdateResourcePayload>;
  /** Updates a single `ResourceBid` using its globally unique id and a patch. */
  updateResourceBid: Maybe<UpdateResourceBidPayload>;
  /** Updates a single `ResourceBid` using a unique key and a patch. */
  updateResourceBidById: Maybe<UpdateResourceBidPayload>;
  /** Updates a single `ResourceBid` using a unique key and a patch. */
  updateResourceBidByResourceIdAndBidderAccountId: Maybe<UpdateResourceBidPayload>;
  /** Updates a single `ResourceBidNotification` using its globally unique id and a patch. */
  updateResourceBidNotification: Maybe<UpdateResourceBidNotificationPayload>;
  /** Updates a single `ResourceBidNotification` using a unique key and a patch. */
  updateResourceBidNotificationById: Maybe<UpdateResourceBidNotificationPayload>;
  /** Updates a single `Resource` using a unique key and a patch. */
  updateResourceById: Maybe<UpdateResourcePayload>;
  /** Updates a single `ResourceCategory` using its globally unique id and a patch. */
  updateResourceCategory: Maybe<UpdateResourceCategoryPayload>;
  /** Updates a single `ResourceCategoryAssignment` using its globally unique id and a patch. */
  updateResourceCategoryAssignment: Maybe<UpdateResourceCategoryAssignmentPayload>;
  /** Updates a single `ResourceCategoryAssignment` using a unique key and a patch. */
  updateResourceCategoryAssignmentByResourceIdAndCategoryCode: Maybe<UpdateResourceCategoryAssignmentPayload>;
  /** Updates a single `ResourceCategory` using a unique key and a patch. */
  updateResourceCategoryByCode: Maybe<UpdateResourceCategoryPayload>;
  /** Updates a single `ResourceCategory` using a unique key and a patch. */
  updateResourceCategoryBySlug: Maybe<UpdateResourceCategoryPayload>;
  /** Updates a single `ResourceConversation` using its globally unique id and a patch. */
  updateResourceConversation: Maybe<UpdateResourceConversationPayload>;
  /** Updates a single `ResourceConversation` using a unique key and a patch. */
  updateResourceConversationById: Maybe<UpdateResourceConversationPayload>;
  /** Updates a single `ResourceConversation` using a unique key and a patch. */
  updateResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: Maybe<UpdateResourceConversationPayload>;
  /** Updates a single `ResourceMessage` using its globally unique id and a patch. */
  updateResourceMessage: Maybe<UpdateResourceMessagePayload>;
  /** Updates a single `ResourceMessage` using a unique key and a patch. */
  updateResourceMessageById: Maybe<UpdateResourceMessagePayload>;
  /** Updates a single `ResourceMessageImage` using its globally unique id and a patch. */
  updateResourceMessageImage: Maybe<UpdateResourceMessageImagePayload>;
  /** Updates a single `ResourceMessageImage` using a unique key and a patch. */
  updateResourceMessageImageById: Maybe<UpdateResourceMessageImagePayload>;
  /** Updates a single `SystemSetting` using its globally unique id and a patch. */
  updateSystemSetting: Maybe<UpdateSystemSettingPayload>;
  /** Updates a single `SystemSetting` using a unique key and a patch. */
  updateSystemSettingByKey: Maybe<UpdateSystemSettingPayload>;
  /** Updates a single `TokenMovement` using its globally unique id and a patch. */
  updateTokenMovement: Maybe<UpdateTokenMovementPayload>;
  /** Updates a single `TokenMovement` using a unique key and a patch. */
  updateTokenMovementById: Maybe<UpdateTokenMovementPayload>;
  /** Updates a single `TokenMovement` using a unique key and a patch. */
  updateTokenMovementByIdempotencyKey: Maybe<UpdateTokenMovementPayload>;
  upsertChatTypingPresence: Maybe<UpsertChatTypingPresencePayload>;
  /** Creates a new grant definition when p_grant_id is null, or updates an existing one. Admin only. */
  upsertGrant: Maybe<UpsertGrantPayload>;
  writeOperationalLog: Maybe<WriteOperationalLogPayload>;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAcceptCampaignNeedArgs = {
  input: AcceptCampaignNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAddCampaignModerationNoteArgs = {
  input: AddCampaignModerationNoteInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAdminGetMailContentArgs = {
  input: AdminGetMailContentInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAdminResendMailArgs = {
  input: AdminResendMailInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationApproveCampaignArgs = {
  input: ApproveCampaignInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationArchiveGrantArgs = {
  input: ArchiveGrantInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAuthChangePasswordArgs = {
  input: AuthChangePasswordInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAuthLoginArgs = {
  input: AuthLoginInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationAuthLogoutArgs = {
  input: AuthLogoutInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCancelNeedClaimArgs = {
  input: CancelNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCancelResourceBidArgs = {
  input: CancelResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationClaimGrantArgs = {
  input: ClaimGrantInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationClaimNeedArgs = {
  input: ClaimNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCleanupOperationalLogsArgs = {
  input: CleanupOperationalLogsInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCleanupReadNotificationsArgs = {
  input: CleanupReadNotificationsInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationConfirmEmailVerificationArgs = {
  input: ConfirmEmailVerificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationConfirmPasswordResetArgs = {
  input: ConfirmPasswordResetInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationConfirmPasswordResetWithPasswordArgs = {
  input: ConfirmPasswordResetWithPasswordInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateAccountArgs = {
  input: CreateAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateAccountDeliveryPreferenceArgs = {
  input: CreateAccountDeliveryPreferenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateAccountNotificationArgs = {
  input: CreateAccountNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateCampaignArgs = {
  input: CreateCampaignInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateCampaignModerationAuditEventArgs = {
  input: CreateCampaignModerationAuditEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateCampaignModerationNoteArgs = {
  input: CreateCampaignModerationNoteInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateCampaignNeedArgs = {
  input: CreateCampaignNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateCampaignResourceArgs = {
  input: CreateCampaignResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateChatTypingPresenceArgs = {
  input: CreateChatTypingPresenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateClaimConversationArgs = {
  input: CreateClaimConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateClaimMessageArgs = {
  input: CreateClaimMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateClaimMessageImageArgs = {
  input: CreateClaimMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateGrantClaimArgs = {
  input: CreateGrantClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateGrantDefinitionArgs = {
  input: CreateGrantDefinitionInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateGrantTargetAccountArgs = {
  input: CreateGrantTargetAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateGrantTargetEmailArgs = {
  input: CreateGrantTargetEmailInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateNeedArgs = {
  input: CreateNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateNeedClaimArgs = {
  input: CreateNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateNeedClaimNotificationArgs = {
  input: CreateNeedClaimNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateNeedClaimSettlementEventArgs = {
  input: CreateNeedClaimSettlementEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateOperationalLogArgs = {
  input: CreateOperationalLogInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceArgs = {
  input: CreateResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceBidArgs = {
  input: CreateResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceBidNotificationArgs = {
  input: CreateResourceBidNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceCategoryArgs = {
  input: CreateResourceCategoryInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceCategoryAssignmentArgs = {
  input: CreateResourceCategoryAssignmentInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceConversationArgs = {
  input: CreateResourceConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceMessageArgs = {
  input: CreateResourceMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateResourceMessageImageArgs = {
  input: CreateResourceMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateSystemSettingArgs = {
  input: CreateSystemSettingInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationCreateTokenMovementArgs = {
  input: CreateTokenMovementInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeclineNeedClaimArgs = {
  input: DeclineNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountArgs = {
  input: DeleteAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountByExternalSubjectArgs = {
  input: DeleteAccountByExternalSubjectInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountByIdArgs = {
  input: DeleteAccountByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountDeliveryPreferenceArgs = {
  input: DeleteAccountDeliveryPreferenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountDeliveryPreferenceByAccountIdAndEventCategoryArgs = {
  input: DeleteAccountDeliveryPreferenceByAccountIdAndEventCategoryInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountNotificationArgs = {
  input: DeleteAccountNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteAccountNotificationByIdArgs = {
  input: DeleteAccountNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignArgs = {
  input: DeleteCampaignInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignByIdArgs = {
  input: DeleteCampaignByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignModerationAuditEventArgs = {
  input: DeleteCampaignModerationAuditEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignModerationAuditEventByIdArgs = {
  input: DeleteCampaignModerationAuditEventByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignModerationNoteArgs = {
  input: DeleteCampaignModerationNoteInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignModerationNoteByIdArgs = {
  input: DeleteCampaignModerationNoteByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignNeedArgs = {
  input: DeleteCampaignNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignNeedByCampaignIdAndNeedIdArgs = {
  input: DeleteCampaignNeedByCampaignIdAndNeedIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignResourceArgs = {
  input: DeleteCampaignResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteCampaignResourceByCampaignIdAndResourceIdArgs = {
  input: DeleteCampaignResourceByCampaignIdAndResourceIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteChatTypingPresenceArgs = {
  input: DeleteChatTypingPresenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteChatTypingPresenceByConversationKindAndConversationIdAndAccountIdArgs = {
  input: DeleteChatTypingPresenceByConversationKindAndConversationIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimConversationArgs = {
  input: DeleteClaimConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimConversationByIdArgs = {
  input: DeleteClaimConversationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdArgs = {
  input: DeleteClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimMessageArgs = {
  input: DeleteClaimMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimMessageByIdArgs = {
  input: DeleteClaimMessageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimMessageImageArgs = {
  input: DeleteClaimMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteClaimMessageImageByIdArgs = {
  input: DeleteClaimMessageImageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantClaimArgs = {
  input: DeleteGrantClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantClaimByGrantIdAndAccountIdArgs = {
  input: DeleteGrantClaimByGrantIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantClaimByIdArgs = {
  input: DeleteGrantClaimByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantDefinitionArgs = {
  input: DeleteGrantDefinitionInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantDefinitionByIdArgs = {
  input: DeleteGrantDefinitionByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantTargetAccountArgs = {
  input: DeleteGrantTargetAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantTargetAccountByGrantIdAndAccountIdArgs = {
  input: DeleteGrantTargetAccountByGrantIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantTargetEmailArgs = {
  input: DeleteGrantTargetEmailInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteGrantTargetEmailByGrantIdAndTargetEmailNormalizedArgs = {
  input: DeleteGrantTargetEmailByGrantIdAndTargetEmailNormalizedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedArgs = {
  input: DeleteNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedByIdArgs = {
  input: DeleteNeedByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimArgs = {
  input: DeleteNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimByIdArgs = {
  input: DeleteNeedClaimByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimByNeedIdAndClaimerAccountIdArgs = {
  input: DeleteNeedClaimByNeedIdAndClaimerAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimNotificationArgs = {
  input: DeleteNeedClaimNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimNotificationByIdArgs = {
  input: DeleteNeedClaimNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimSettlementEventArgs = {
  input: DeleteNeedClaimSettlementEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimSettlementEventByIdArgs = {
  input: DeleteNeedClaimSettlementEventByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteNeedClaimSettlementEventByNeedClaimIdArgs = {
  input: DeleteNeedClaimSettlementEventByNeedClaimIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteOperationalLogArgs = {
  input: DeleteOperationalLogInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteOperationalLogByIdArgs = {
  input: DeleteOperationalLogByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceArgs = {
  input: DeleteResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceBidArgs = {
  input: DeleteResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceBidByIdArgs = {
  input: DeleteResourceBidByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceBidByResourceIdAndBidderAccountIdArgs = {
  input: DeleteResourceBidByResourceIdAndBidderAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceBidNotificationArgs = {
  input: DeleteResourceBidNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceBidNotificationByIdArgs = {
  input: DeleteResourceBidNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceByIdArgs = {
  input: DeleteResourceByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceCategoryArgs = {
  input: DeleteResourceCategoryInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceCategoryAssignmentArgs = {
  input: DeleteResourceCategoryAssignmentInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceCategoryAssignmentByResourceIdAndCategoryCodeArgs = {
  input: DeleteResourceCategoryAssignmentByResourceIdAndCategoryCodeInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceCategoryByCodeArgs = {
  input: DeleteResourceCategoryByCodeInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceCategoryBySlugArgs = {
  input: DeleteResourceCategoryBySlugInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceConversationArgs = {
  input: DeleteResourceConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceConversationByIdArgs = {
  input: DeleteResourceConversationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdArgs = {
  input: DeleteResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceMessageArgs = {
  input: DeleteResourceMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceMessageByIdArgs = {
  input: DeleteResourceMessageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceMessageImageArgs = {
  input: DeleteResourceMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteResourceMessageImageByIdArgs = {
  input: DeleteResourceMessageImageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteSystemSettingArgs = {
  input: DeleteSystemSettingInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteSystemSettingByKeyArgs = {
  input: DeleteSystemSettingByKeyInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteTokenMovementArgs = {
  input: DeleteTokenMovementInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteTokenMovementByIdArgs = {
  input: DeleteTokenMovementByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationDeleteTokenMovementByIdempotencyKeyArgs = {
  input: DeleteTokenMovementByIdempotencyKeyInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationGetAccountDeliveryPreferencesArgs = {
  input: GetAccountDeliveryPreferencesInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationGiftTokensArgs = {
  input: GiftTokensInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationLinkAccountExternalIdentityArgs = {
  input: LinkAccountExternalIdentityInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkAccountNotificationReadArgs = {
  input: MarkAccountNotificationReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkAllNotificationsReadArgs = {
  input: MarkAllNotificationsReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkClaimMessagesReadArgs = {
  input: MarkClaimMessagesReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkNeedClaimNotificationReadArgs = {
  input: MarkNeedClaimNotificationReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkResourceBidNotificationReadArgs = {
  input: MarkResourceBidNotificationReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationMarkResourceMessagesReadArgs = {
  input: MarkResourceMessagesReadInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationPublishResourceArgs = {
  input: PublishResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRegisterLocalAccountArgs = {
  input: RegisterLocalAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRegisterLocalAccountWithPasswordArgs = {
  input: RegisterLocalAccountWithPasswordInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRejectCampaignNeedArgs = {
  input: RejectCampaignNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRequestEmailVerificationArgs = {
  input: RequestEmailVerificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRequestPasswordResetArgs = {
  input: RequestPasswordResetInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationRespondToResourceBidArgs = {
  input: RespondToResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSearchOperationalLogsArgs = {
  input: SearchOperationalLogsInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSendClaimMessageArgs = {
  input: SendClaimMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSendNeedMessageArgs = {
  input: SendNeedMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSendResourceMessageArgs = {
  input: SendResourceMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSendResourceMessageDirectArgs = {
  input: SendResourceMessageDirectInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSetAccountDeliveryPreferenceArgs = {
  input: SetAccountDeliveryPreferenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSetGrantTargetAccountsArgs = {
  input: SetGrantTargetAccountsInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSetGrantTargetEmailsArgs = {
  input: SetGrantTargetEmailsInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSettleNeedClaimArgs = {
  input: SettleNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationSubmitResourceBidArgs = {
  input: SubmitResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountArgs = {
  input: UpdateAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountByExternalSubjectArgs = {
  input: UpdateAccountByExternalSubjectInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountByIdArgs = {
  input: UpdateAccountByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountDeliveryPreferenceArgs = {
  input: UpdateAccountDeliveryPreferenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryArgs = {
  input: UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountNotificationArgs = {
  input: UpdateAccountNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateAccountNotificationByIdArgs = {
  input: UpdateAccountNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignArgs = {
  input: UpdateCampaignInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignByIdArgs = {
  input: UpdateCampaignByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignForModerationArgs = {
  input: UpdateCampaignForModerationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignModerationAuditEventArgs = {
  input: UpdateCampaignModerationAuditEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignModerationAuditEventByIdArgs = {
  input: UpdateCampaignModerationAuditEventByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignModerationNoteArgs = {
  input: UpdateCampaignModerationNoteInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignModerationNoteByIdArgs = {
  input: UpdateCampaignModerationNoteByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignNeedArgs = {
  input: UpdateCampaignNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignNeedByCampaignIdAndNeedIdArgs = {
  input: UpdateCampaignNeedByCampaignIdAndNeedIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignResourceArgs = {
  input: UpdateCampaignResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateCampaignResourceByCampaignIdAndResourceIdArgs = {
  input: UpdateCampaignResourceByCampaignIdAndResourceIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateChatTypingPresenceArgs = {
  input: UpdateChatTypingPresenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateChatTypingPresenceByConversationKindAndConversationIdAndAccountIdArgs = {
  input: UpdateChatTypingPresenceByConversationKindAndConversationIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimConversationArgs = {
  input: UpdateClaimConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimConversationByIdArgs = {
  input: UpdateClaimConversationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdArgs = {
  input: UpdateClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimMessageArgs = {
  input: UpdateClaimMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimMessageByIdArgs = {
  input: UpdateClaimMessageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimMessageImageArgs = {
  input: UpdateClaimMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateClaimMessageImageByIdArgs = {
  input: UpdateClaimMessageImageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantClaimArgs = {
  input: UpdateGrantClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantClaimByGrantIdAndAccountIdArgs = {
  input: UpdateGrantClaimByGrantIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantClaimByIdArgs = {
  input: UpdateGrantClaimByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantDefinitionArgs = {
  input: UpdateGrantDefinitionInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantDefinitionByIdArgs = {
  input: UpdateGrantDefinitionByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantTargetAccountArgs = {
  input: UpdateGrantTargetAccountInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantTargetAccountByGrantIdAndAccountIdArgs = {
  input: UpdateGrantTargetAccountByGrantIdAndAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantTargetEmailArgs = {
  input: UpdateGrantTargetEmailInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateGrantTargetEmailByGrantIdAndTargetEmailNormalizedArgs = {
  input: UpdateGrantTargetEmailByGrantIdAndTargetEmailNormalizedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedArgs = {
  input: UpdateNeedInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedByIdArgs = {
  input: UpdateNeedByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimArgs = {
  input: UpdateNeedClaimInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimByIdArgs = {
  input: UpdateNeedClaimByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimByNeedIdAndClaimerAccountIdArgs = {
  input: UpdateNeedClaimByNeedIdAndClaimerAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimNotificationArgs = {
  input: UpdateNeedClaimNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimNotificationByIdArgs = {
  input: UpdateNeedClaimNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimSettlementEventArgs = {
  input: UpdateNeedClaimSettlementEventInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimSettlementEventByIdArgs = {
  input: UpdateNeedClaimSettlementEventByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateNeedClaimSettlementEventByNeedClaimIdArgs = {
  input: UpdateNeedClaimSettlementEventByNeedClaimIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateOperationalLogArgs = {
  input: UpdateOperationalLogInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateOperationalLogByIdArgs = {
  input: UpdateOperationalLogByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceArgs = {
  input: UpdateResourceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceBidArgs = {
  input: UpdateResourceBidInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceBidByIdArgs = {
  input: UpdateResourceBidByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceBidByResourceIdAndBidderAccountIdArgs = {
  input: UpdateResourceBidByResourceIdAndBidderAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceBidNotificationArgs = {
  input: UpdateResourceBidNotificationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceBidNotificationByIdArgs = {
  input: UpdateResourceBidNotificationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceByIdArgs = {
  input: UpdateResourceByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceCategoryArgs = {
  input: UpdateResourceCategoryInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceCategoryAssignmentArgs = {
  input: UpdateResourceCategoryAssignmentInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceCategoryAssignmentByResourceIdAndCategoryCodeArgs = {
  input: UpdateResourceCategoryAssignmentByResourceIdAndCategoryCodeInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceCategoryByCodeArgs = {
  input: UpdateResourceCategoryByCodeInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceCategoryBySlugArgs = {
  input: UpdateResourceCategoryBySlugInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceConversationArgs = {
  input: UpdateResourceConversationInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceConversationByIdArgs = {
  input: UpdateResourceConversationByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdArgs = {
  input: UpdateResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceMessageArgs = {
  input: UpdateResourceMessageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceMessageByIdArgs = {
  input: UpdateResourceMessageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceMessageImageArgs = {
  input: UpdateResourceMessageImageInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateResourceMessageImageByIdArgs = {
  input: UpdateResourceMessageImageByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateSystemSettingArgs = {
  input: UpdateSystemSettingInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateSystemSettingByKeyArgs = {
  input: UpdateSystemSettingByKeyInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateTokenMovementArgs = {
  input: UpdateTokenMovementInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateTokenMovementByIdArgs = {
  input: UpdateTokenMovementByIdInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpdateTokenMovementByIdempotencyKeyArgs = {
  input: UpdateTokenMovementByIdempotencyKeyInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpsertChatTypingPresenceArgs = {
  input: UpsertChatTypingPresenceInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationUpsertGrantArgs = {
  input: UpsertGrantInput;
};


/** The root mutation type which contains root level fields which mutate data. */
export type MutationWriteOperationalLogArgs = {
  input: WriteOperationalLogInput;
};

/** Need published by authenticated accounts with optional campaign link and moderation-aware constraints. */
export type Need = Node & {
  __typename: 'Need';
  /** Reads a single `Account` that is related to this `Need`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** Reads and enables pagination through a set of `CampaignNeed`. */
  campaignNeedsByNeedId: CampaignNeedsConnection;
  /** Reads and enables pagination through a set of `ClaimConversation`. */
  claimConversationsByNeedId: ClaimConversationsConnection;
  competenceRequired: Scalars['Boolean']['output'];
  createdAt: Scalars['Datetime']['output'];
  creatorAccountId: Scalars['UUID']['output'];
  description: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  intensity: NeedIntensity;
  isActive: Scalars['Boolean']['output'];
  latitude: Scalars['BigFloat']['output'];
  location: Scalars['String']['output'];
  longitude: Scalars['BigFloat']['output'];
  multiplePeopleRequired: Scalars['Boolean']['output'];
  /** Reads and enables pagination through a set of `NeedClaimSettlementEvent`. */
  needClaimSettlementEventsByNeedId: NeedClaimSettlementEventsConnection;
  /** Reads and enables pagination through a set of `NeedClaim`. */
  needClaimsByNeedId: NeedClaimsConnection;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  objectRequired: Scalars['Boolean']['output'];
  proposedTopesAmount: Maybe<Scalars['Int']['output']>;
  requiredCompetenceText: Maybe<Scalars['String']['output']>;
  requiredPeopleCount: Maybe<Scalars['Int']['output']>;
  requiredToolingText: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  toolingRequired: Scalars['Boolean']['output'];
  updatedAt: Scalars['Datetime']['output'];
};


/** Need published by authenticated accounts with optional campaign link and moderation-aware constraints. */
export type NeedCampaignNeedsByNeedIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignNeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};


/** Need published by authenticated accounts with optional campaign link and moderation-aware constraints. */
export type NeedClaimConversationsByNeedIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};


/** Need published by authenticated accounts with optional campaign link and moderation-aware constraints. */
export type NeedNeedClaimSettlementEventsByNeedIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimSettlementEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};


/** Need published by authenticated accounts with optional campaign link and moderation-aware constraints. */
export type NeedNeedClaimsByNeedIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** Claims made by authenticated accounts on active needs. */
export type NeedClaim = Node & {
  __typename: 'NeedClaim';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /** Reads and enables pagination through a set of `ClaimConversation`. */
  claimConversationsByNeedClaimId: ClaimConversationsConnection;
  claimerAccountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  message: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  /** Reads and enables pagination through a set of `NeedClaimNotification`. */
  needClaimNotificationsByNeedClaimId: NeedClaimNotificationsConnection;
  /** Reads a single `NeedClaimSettlementEvent` that is related to this `NeedClaim`. */
  needClaimSettlementEventByNeedClaimId: Maybe<NeedClaimSettlementEvent>;
  /**
   * Reads and enables pagination through a set of `NeedClaimSettlementEvent`.
   * @deprecated Please use needClaimSettlementEventByNeedClaimId instead
   */
  needClaimSettlementEventsByNeedClaimId: NeedClaimSettlementEventsConnection;
  needId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  settledAt: Maybe<Scalars['Datetime']['output']>;
  settledByAccountId: Maybe<Scalars['UUID']['output']>;
  status: NeedClaimStatus;
  updatedAt: Scalars['Datetime']['output'];
};


/** Claims made by authenticated accounts on active needs. */
export type NeedClaimClaimConversationsByNeedClaimIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};


/** Claims made by authenticated accounts on active needs. */
export type NeedClaimNeedClaimNotificationsByNeedClaimIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};


/** Claims made by authenticated accounts on active needs. */
export type NeedClaimNeedClaimSettlementEventsByNeedClaimIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimSettlementEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};

/**
 * A condition to be used against `NeedClaim` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type NeedClaimCondition = {
  /** Checks for equality with the object’s `claimerAccountId` field. */
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needId` field. */
  needId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `settledByAccountId` field. */
  settledByAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `NeedClaim` */
export type NeedClaimInput = {
  claimerAccountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  needId: Scalars['UUID']['input'];
  settledAt?: InputMaybe<Scalars['Datetime']['input']>;
  settledByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<NeedClaimStatus>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Notification events emitted when claim lifecycle changes occur. */
export type NeedClaimNotification = Node & {
  __typename: 'NeedClaimNotification';
  /** Reads a single `Account` that is related to this `NeedClaimNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  createdAt: Scalars['Datetime']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  /** Reads a single `NeedClaim` that is related to this `NeedClaimNotification`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  needClaimId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  readAt: Maybe<Scalars['Datetime']['output']>;
  recipientAccountId: Scalars['UUID']['output'];
};

/**
 * A condition to be used against `NeedClaimNotification` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type NeedClaimNotificationCondition = {
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needClaimId` field. */
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `recipientAccountId` field. */
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `NeedClaimNotification` */
export type NeedClaimNotificationInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId: Scalars['UUID']['input'];
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId: Scalars['UUID']['input'];
};

/** Represents an update to a `NeedClaimNotification`. Fields that are set will be updated. */
export type NeedClaimNotificationPatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `NeedClaimNotification` values. */
export type NeedClaimNotificationsConnection = {
  __typename: 'NeedClaimNotificationsConnection';
  /** A list of edges which contains the `NeedClaimNotification` and cursor to aid in pagination. */
  edges: Array<NeedClaimNotificationsEdge>;
  /** A list of `NeedClaimNotification` objects. */
  nodes: Array<NeedClaimNotification>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `NeedClaimNotification` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `NeedClaimNotification` edge in the connection. */
export type NeedClaimNotificationsEdge = {
  __typename: 'NeedClaimNotificationsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `NeedClaimNotification` at the end of the edge. */
  node: NeedClaimNotification;
};

/** Methods to use when ordering `NeedClaimNotification`. */
export enum NeedClaimNotificationsOrderBy {
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  NeedClaimIdAsc = 'NEED_CLAIM_ID_ASC',
  NeedClaimIdDesc = 'NEED_CLAIM_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  RecipientAccountIdAsc = 'RECIPIENT_ACCOUNT_ID_ASC',
  RecipientAccountIdDesc = 'RECIPIENT_ACCOUNT_ID_DESC'
}

/** Represents an update to a `NeedClaim`. Fields that are set will be updated. */
export type NeedClaimPatch = {
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
  settledAt?: InputMaybe<Scalars['Datetime']['input']>;
  settledByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<NeedClaimStatus>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Recorded settlement and Topes transfer summary for a settled claim. */
export type NeedClaimSettlementEvent = Node & {
  __typename: 'NeedClaimSettlementEvent';
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountBySettledByAccountId: Maybe<Account>;
  claimerAccountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** Reads a single `Need` that is related to this `NeedClaimSettlementEvent`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimSettlementEvent`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  needClaimId: Scalars['UUID']['output'];
  needId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  settledByAccountId: Scalars['UUID']['output'];
  topesAmount: Scalars['Int']['output'];
};

/**
 * A condition to be used against `NeedClaimSettlementEvent` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type NeedClaimSettlementEventCondition = {
  /** Checks for equality with the object’s `claimerAccountId` field. */
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needClaimId` field. */
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `needId` field. */
  needId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `settledByAccountId` field. */
  settledByAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `NeedClaimSettlementEvent` */
export type NeedClaimSettlementEventInput = {
  claimerAccountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
  settledByAccountId: Scalars['UUID']['input'];
  topesAmount?: InputMaybe<Scalars['Int']['input']>;
};

/** Represents an update to a `NeedClaimSettlementEvent`. Fields that are set will be updated. */
export type NeedClaimSettlementEventPatch = {
  claimerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
  settledByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  topesAmount?: InputMaybe<Scalars['Int']['input']>;
};

/** A connection to a list of `NeedClaimSettlementEvent` values. */
export type NeedClaimSettlementEventsConnection = {
  __typename: 'NeedClaimSettlementEventsConnection';
  /** A list of edges which contains the `NeedClaimSettlementEvent` and cursor to aid in pagination. */
  edges: Array<NeedClaimSettlementEventsEdge>;
  /** A list of `NeedClaimSettlementEvent` objects. */
  nodes: Array<NeedClaimSettlementEvent>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `NeedClaimSettlementEvent` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `NeedClaimSettlementEvent` edge in the connection. */
export type NeedClaimSettlementEventsEdge = {
  __typename: 'NeedClaimSettlementEventsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `NeedClaimSettlementEvent` at the end of the edge. */
  node: NeedClaimSettlementEvent;
};

/** Methods to use when ordering `NeedClaimSettlementEvent`. */
export enum NeedClaimSettlementEventsOrderBy {
  ClaimerAccountIdAsc = 'CLAIMER_ACCOUNT_ID_ASC',
  ClaimerAccountIdDesc = 'CLAIMER_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  NeedClaimIdAsc = 'NEED_CLAIM_ID_ASC',
  NeedClaimIdDesc = 'NEED_CLAIM_ID_DESC',
  NeedIdAsc = 'NEED_ID_ASC',
  NeedIdDesc = 'NEED_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SettledByAccountIdAsc = 'SETTLED_BY_ACCOUNT_ID_ASC',
  SettledByAccountIdDesc = 'SETTLED_BY_ACCOUNT_ID_DESC'
}

export enum NeedClaimStatus {
  Declined = 'DECLINED',
  Expired = 'EXPIRED',
  Open = 'OPEN',
  Settled = 'SETTLED',
  Withdrawn = 'WITHDRAWN'
}

/** A connection to a list of `NeedClaim` values. */
export type NeedClaimsConnection = {
  __typename: 'NeedClaimsConnection';
  /** A list of edges which contains the `NeedClaim` and cursor to aid in pagination. */
  edges: Array<NeedClaimsEdge>;
  /** A list of `NeedClaim` objects. */
  nodes: Array<NeedClaim>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `NeedClaim` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `NeedClaim` edge in the connection. */
export type NeedClaimsEdge = {
  __typename: 'NeedClaimsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `NeedClaim` at the end of the edge. */
  node: NeedClaim;
};

/** Methods to use when ordering `NeedClaim`. */
export enum NeedClaimsOrderBy {
  ClaimerAccountIdAsc = 'CLAIMER_ACCOUNT_ID_ASC',
  ClaimerAccountIdDesc = 'CLAIMER_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  NeedIdAsc = 'NEED_ID_ASC',
  NeedIdDesc = 'NEED_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SettledByAccountIdAsc = 'SETTLED_BY_ACCOUNT_ID_ASC',
  SettledByAccountIdDesc = 'SETTLED_BY_ACCOUNT_ID_DESC'
}

/** A condition to be used against `Need` object types. All fields are tested for equality and combined with a logical ‘and.’ */
export type NeedCondition = {
  /** Checks for equality with the object’s `creatorAccountId` field. */
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `isActive` field. */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum NeedIntensity {
  Commitment = 'COMMITMENT',
  LegUp = 'LEG_UP',
  RareContribution = 'RARE_CONTRIBUTION',
  Sharing = 'SHARING'
}

/** Represents an update to a `Need`. Fields that are set will be updated. */
export type NeedPatch = {
  competenceRequired?: InputMaybe<Scalars['Boolean']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  intensity?: InputMaybe<NeedIntensity>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  multiplePeopleRequired?: InputMaybe<Scalars['Boolean']['input']>;
  objectRequired?: InputMaybe<Scalars['Boolean']['input']>;
  proposedTopesAmount?: InputMaybe<Scalars['Int']['input']>;
  requiredCompetenceText?: InputMaybe<Scalars['String']['input']>;
  requiredPeopleCount?: InputMaybe<Scalars['Int']['input']>;
  requiredToolingText?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  toolingRequired?: InputMaybe<Scalars['Boolean']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `Need` values. */
export type NeedsConnection = {
  __typename: 'NeedsConnection';
  /** A list of edges which contains the `Need` and cursor to aid in pagination. */
  edges: Array<NeedsEdge>;
  /** A list of `Need` objects. */
  nodes: Array<Need>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Need` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `Need` edge in the connection. */
export type NeedsEdge = {
  __typename: 'NeedsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `Need` at the end of the edge. */
  node: Need;
};

/** Methods to use when ordering `Need`. */
export enum NeedsOrderBy {
  CreatorAccountIdAsc = 'CREATOR_ACCOUNT_ID_ASC',
  CreatorAccountIdDesc = 'CREATOR_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  IsActiveAsc = 'IS_ACTIVE_ASC',
  IsActiveDesc = 'IS_ACTIVE_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** An object with a globally unique `ID`. */
export type Node = {
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};

/** Unified operational log sink for mobile app, backoffice web, web API, and worker jobs. */
export type OperationalLog = Node & {
  __typename: 'OperationalLog';
  /** Reads a single `Account` that is related to this `OperationalLog`. */
  accountByAccountId: Maybe<Account>;
  accountId: Maybe<Scalars['UUID']['output']>;
  component: Scalars['String']['output'];
  context: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  level: Scalars['String']['output'];
  message: Scalars['String']['output'];
  metadata: Scalars['JSON']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
};

/**
 * A condition to be used against `OperationalLog` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type OperationalLogCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `component` field. */
  component?: InputMaybe<Scalars['String']['input']>;
  /** Checks for equality with the object’s `createdAt` field. */
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `level` field. */
  level?: InputMaybe<Scalars['String']['input']>;
};

/** An input for mutations affecting `OperationalLog` */
export type OperationalLogInput = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  component: Scalars['String']['input'];
  context?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  level: Scalars['String']['input'];
  message: Scalars['String']['input'];
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

/** Represents an update to a `OperationalLog`. Fields that are set will be updated. */
export type OperationalLogPatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  component?: InputMaybe<Scalars['String']['input']>;
  context?: InputMaybe<Scalars['String']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  level?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
};

/** A connection to a list of `OperationalLog` values. */
export type OperationalLogsConnection = {
  __typename: 'OperationalLogsConnection';
  /** A list of edges which contains the `OperationalLog` and cursor to aid in pagination. */
  edges: Array<OperationalLogsEdge>;
  /** A list of `OperationalLog` objects. */
  nodes: Array<OperationalLog>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `OperationalLog` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `OperationalLog` edge in the connection. */
export type OperationalLogsEdge = {
  __typename: 'OperationalLogsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `OperationalLog` at the end of the edge. */
  node: OperationalLog;
};

/** Methods to use when ordering `OperationalLog`. */
export enum OperationalLogsOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  ComponentAsc = 'COMPONENT_ASC',
  ComponentDesc = 'COMPONENT_DESC',
  CreatedAtAsc = 'CREATED_AT_ASC',
  CreatedAtDesc = 'CREATED_AT_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  LevelAsc = 'LEVEL_ASC',
  LevelDesc = 'LEVEL_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor: Maybe<Scalars['Cursor']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor: Maybe<Scalars['Cursor']['output']>;
};

/** All input for the `publishResource` mutation. */
export type PublishResourceInput = {
  canBeDelivered?: InputMaybe<Scalars['Boolean']['input']>;
  canBeExchanged?: InputMaybe<Scalars['Boolean']['input']>;
  canBeGiven?: InputMaybe<Scalars['Boolean']['input']>;
  canBeTakenAway?: InputMaybe<Scalars['Boolean']['input']>;
  categoryCodes?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  defaultTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  intensity?: InputMaybe<NeedIntensity>;
  isProduct?: InputMaybe<Scalars['Boolean']['input']>;
  isService?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `publishResource` mutation. */
export type PublishResourcePayload = {
  __typename: 'PublishResourcePayload';
  /** Reads a single `Account` that is related to this `Resource`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  resource: Maybe<Resource>;
  /** An edge for our `Resource`. May be used by Relay 1. */
  resourceEdge: Maybe<ResourcesEdge>;
};


/** The output of our `publishResource` mutation. */
export type PublishResourcePayloadResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};

/** The root query type which gives access points into the data universe. */
export type Query = Node & {
  __typename: 'Query';
  /** Reads a single `Account` using its globally unique `ID`. */
  account: Maybe<Account>;
  accountByExternalSubject: Maybe<Account>;
  accountById: Maybe<Account>;
  /** Reads a single `AccountDeliveryPreference` using its globally unique `ID`. */
  accountDeliveryPreference: Maybe<AccountDeliveryPreference>;
  accountDeliveryPreferenceByAccountIdAndEventCategory: Maybe<AccountDeliveryPreference>;
  /** Reads a single `AccountNotification` using its globally unique `ID`. */
  accountNotification: Maybe<AccountNotification>;
  accountNotificationById: Maybe<AccountNotification>;
  adminListAccounts: Maybe<AdminListAccountsConnection>;
  adminListBids: Maybe<AdminListBidsConnection>;
  adminListCampaigns: Maybe<AdminListCampaignsConnection>;
  adminListGrants: Maybe<AdminListGrantsConnection>;
  adminListLogs: Maybe<AdminListLogsConnection>;
  adminListMails: Maybe<AdminListMailsConnection>;
  adminListNotifications: Maybe<AdminListNotificationsConnection>;
  adminListResources: Maybe<AdminListResourcesConnection>;
  /** Reads and enables pagination through a set of `AccountDeliveryPreference`. */
  allAccountDeliveryPreferences: Maybe<AccountDeliveryPreferencesConnection>;
  /** Reads and enables pagination through a set of `AccountNotification`. */
  allAccountNotifications: Maybe<AccountNotificationsConnection>;
  /** Reads and enables pagination through a set of `Account`. */
  allAccounts: Maybe<AccountsConnection>;
  /** Reads and enables pagination through a set of `CampaignModerationAuditEvent`. */
  allCampaignModerationAuditEvents: Maybe<CampaignModerationAuditEventsConnection>;
  /** Reads and enables pagination through a set of `CampaignModerationNote`. */
  allCampaignModerationNotes: Maybe<CampaignModerationNotesConnection>;
  /** Reads and enables pagination through a set of `CampaignNeed`. */
  allCampaignNeeds: Maybe<CampaignNeedsConnection>;
  /** Reads and enables pagination through a set of `CampaignResource`. */
  allCampaignResources: Maybe<CampaignResourcesConnection>;
  /** Reads and enables pagination through a set of `Campaign`. */
  allCampaigns: Maybe<CampaignsConnection>;
  /** Reads and enables pagination through a set of `ChatConversationSummary`. */
  allChatConversationSummaries: Maybe<ChatConversationSummariesConnection>;
  /** Reads and enables pagination through a set of `ChatTypingPresence`. */
  allChatTypingPresences: Maybe<ChatTypingPresencesConnection>;
  /** Reads and enables pagination through a set of `ClaimConversation`. */
  allClaimConversations: Maybe<ClaimConversationsConnection>;
  /** Reads and enables pagination through a set of `ClaimMessageImage`. */
  allClaimMessageImages: Maybe<ClaimMessageImagesConnection>;
  /** Reads and enables pagination through a set of `ClaimMessage`. */
  allClaimMessages: Maybe<ClaimMessagesConnection>;
  /** Reads and enables pagination through a set of `GrantClaim`. */
  allGrantClaims: Maybe<GrantClaimsConnection>;
  /** Reads and enables pagination through a set of `GrantDefinition`. */
  allGrantDefinitions: Maybe<GrantDefinitionsConnection>;
  /** Reads and enables pagination through a set of `GrantTargetAccount`. */
  allGrantTargetAccounts: Maybe<GrantTargetAccountsConnection>;
  /** Reads and enables pagination through a set of `GrantTargetEmail`. */
  allGrantTargetEmails: Maybe<GrantTargetEmailsConnection>;
  /** Reads and enables pagination through a set of `NeedClaimNotification`. */
  allNeedClaimNotifications: Maybe<NeedClaimNotificationsConnection>;
  /** Reads and enables pagination through a set of `NeedClaimSettlementEvent`. */
  allNeedClaimSettlementEvents: Maybe<NeedClaimSettlementEventsConnection>;
  /** Reads and enables pagination through a set of `NeedClaim`. */
  allNeedClaims: Maybe<NeedClaimsConnection>;
  /** Reads and enables pagination through a set of `Need`. */
  allNeeds: Maybe<NeedsConnection>;
  /** Reads and enables pagination through a set of `OperationalLog`. */
  allOperationalLogs: Maybe<OperationalLogsConnection>;
  /** Reads and enables pagination through a set of `ResourceBidNotification`. */
  allResourceBidNotifications: Maybe<ResourceBidNotificationsConnection>;
  /** Reads and enables pagination through a set of `ResourceBid`. */
  allResourceBids: Maybe<ResourceBidsConnection>;
  /** Reads and enables pagination through a set of `ResourceCategory`. */
  allResourceCategories: Maybe<ResourceCategoriesConnection>;
  /** Reads and enables pagination through a set of `ResourceCategoryAssignment`. */
  allResourceCategoryAssignments: Maybe<ResourceCategoryAssignmentsConnection>;
  /** Reads and enables pagination through a set of `ResourceConversation`. */
  allResourceConversations: Maybe<ResourceConversationsConnection>;
  /** Reads and enables pagination through a set of `ResourceMessageImage`. */
  allResourceMessageImages: Maybe<ResourceMessageImagesConnection>;
  /** Reads and enables pagination through a set of `ResourceMessage`. */
  allResourceMessages: Maybe<ResourceMessagesConnection>;
  /** Reads and enables pagination through a set of `Resource`. */
  allResources: Maybe<ResourcesConnection>;
  /** Reads and enables pagination through a set of `SystemSetting`. */
  allSystemSettings: Maybe<SystemSettingsConnection>;
  /** Reads and enables pagination through a set of `TokenMovement`. */
  allTokenMovements: Maybe<TokenMovementsConnection>;
  authSession: AuthSessionPayload;
  /** Reads a single `Campaign` using its globally unique `ID`. */
  campaign: Maybe<Campaign>;
  campaignById: Maybe<Campaign>;
  /** Reads a single `CampaignModerationAuditEvent` using its globally unique `ID`. */
  campaignModerationAuditEvent: Maybe<CampaignModerationAuditEvent>;
  campaignModerationAuditEventById: Maybe<CampaignModerationAuditEvent>;
  campaignModerationEvents: Maybe<CampaignModerationEventsConnection>;
  /** Reads a single `CampaignModerationNote` using its globally unique `ID`. */
  campaignModerationNote: Maybe<CampaignModerationNote>;
  campaignModerationNoteById: Maybe<CampaignModerationNote>;
  /** Reads a single `CampaignNeed` using its globally unique `ID`. */
  campaignNeed: Maybe<CampaignNeed>;
  campaignNeedByCampaignIdAndNeedId: Maybe<CampaignNeed>;
  /** Reads a single `CampaignResource` using its globally unique `ID`. */
  campaignResource: Maybe<CampaignResource>;
  campaignResourceByCampaignIdAndResourceId: Maybe<CampaignResource>;
  /** Reads a single `ChatTypingPresence` using its globally unique `ID`. */
  chatTypingPresence: Maybe<ChatTypingPresence>;
  chatTypingPresenceByConversationKindAndConversationIdAndAccountId: Maybe<ChatTypingPresence>;
  /** Reads a single `ClaimConversation` using its globally unique `ID`. */
  claimConversation: Maybe<ClaimConversation>;
  claimConversationById: Maybe<ClaimConversation>;
  claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: Maybe<ClaimConversation>;
  /** Reads a single `ClaimMessage` using its globally unique `ID`. */
  claimMessage: Maybe<ClaimMessage>;
  claimMessageById: Maybe<ClaimMessage>;
  /** Reads a single `ClaimMessageImage` using its globally unique `ID`. */
  claimMessageImage: Maybe<ClaimMessageImage>;
  claimMessageImageById: Maybe<ClaimMessageImage>;
  countChatConversations: Maybe<Scalars['Int']['output']>;
  currentTokenBalance: Maybe<Scalars['Int']['output']>;
  getGrantForClaim: Maybe<GetGrantForClaimConnection>;
  getOperationalLogRetentionDays: Maybe<Scalars['Int']['output']>;
  /** Reads a single `GrantClaim` using its globally unique `ID`. */
  grantClaim: Maybe<GrantClaim>;
  grantClaimByGrantIdAndAccountId: Maybe<GrantClaim>;
  grantClaimById: Maybe<GrantClaim>;
  /** Reads a single `GrantDefinition` using its globally unique `ID`. */
  grantDefinition: Maybe<GrantDefinition>;
  grantDefinitionById: Maybe<GrantDefinition>;
  /** Reads a single `GrantTargetAccount` using its globally unique `ID`. */
  grantTargetAccount: Maybe<GrantTargetAccount>;
  grantTargetAccountByGrantIdAndAccountId: Maybe<GrantTargetAccount>;
  /** Reads a single `GrantTargetEmail` using its globally unique `ID`. */
  grantTargetEmail: Maybe<GrantTargetEmail>;
  grantTargetEmailByGrantIdAndTargetEmailNormalized: Maybe<GrantTargetEmail>;
  listChatConversations: Maybe<ListChatConversationsConnection>;
  listResourceCategories: Maybe<ListResourceCategoriesConnection>;
  /** Reads a single `Need` using its globally unique `ID`. */
  need: Maybe<Need>;
  needById: Maybe<Need>;
  /** Reads a single `NeedClaim` using its globally unique `ID`. */
  needClaim: Maybe<NeedClaim>;
  needClaimById: Maybe<NeedClaim>;
  needClaimByNeedIdAndClaimerAccountId: Maybe<NeedClaim>;
  /** Reads a single `NeedClaimNotification` using its globally unique `ID`. */
  needClaimNotification: Maybe<NeedClaimNotification>;
  needClaimNotificationById: Maybe<NeedClaimNotification>;
  /** Reads a single `NeedClaimSettlementEvent` using its globally unique `ID`. */
  needClaimSettlementEvent: Maybe<NeedClaimSettlementEvent>;
  needClaimSettlementEventById: Maybe<NeedClaimSettlementEvent>;
  needClaimSettlementEventByNeedClaimId: Maybe<NeedClaimSettlementEvent>;
  /** Fetches an object given its globally unique `ID`. */
  node: Maybe<Node>;
  /** The root query type must be a `Node` to work well with Relay 1 mutations. This just resolves to `query`. */
  nodeId: Scalars['ID']['output'];
  /** Reads a single `OperationalLog` using its globally unique `ID`. */
  operationalLog: Maybe<OperationalLog>;
  operationalLogById: Maybe<OperationalLog>;
  /**
   * Exposes the root query type nested one level down. This is helpful for Relay 1
   * which can only query top level fields if they are in a particular form.
   */
  query: Query;
  /** Reads and enables pagination through a set of `ResourceBid`. */
  receivedResourceBids: Maybe<ResourceBidsConnection>;
  /** Reads a single `Resource` using its globally unique `ID`. */
  resource: Maybe<Resource>;
  /** Reads a single `ResourceBid` using its globally unique `ID`. */
  resourceBid: Maybe<ResourceBid>;
  resourceBidById: Maybe<ResourceBid>;
  resourceBidByResourceIdAndBidderAccountId: Maybe<ResourceBid>;
  /** Reads a single `ResourceBidNotification` using its globally unique `ID`. */
  resourceBidNotification: Maybe<ResourceBidNotification>;
  resourceBidNotificationById: Maybe<ResourceBidNotification>;
  resourceById: Maybe<Resource>;
  /** Reads a single `ResourceCategory` using its globally unique `ID`. */
  resourceCategory: Maybe<ResourceCategory>;
  /** Reads a single `ResourceCategoryAssignment` using its globally unique `ID`. */
  resourceCategoryAssignment: Maybe<ResourceCategoryAssignment>;
  resourceCategoryAssignmentByResourceIdAndCategoryCode: Maybe<ResourceCategoryAssignment>;
  resourceCategoryByCode: Maybe<ResourceCategory>;
  resourceCategoryBySlug: Maybe<ResourceCategory>;
  /** Reads a single `ResourceConversation` using its globally unique `ID`. */
  resourceConversation: Maybe<ResourceConversation>;
  resourceConversationById: Maybe<ResourceConversation>;
  resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: Maybe<ResourceConversation>;
  /** Reads a single `ResourceMessage` using its globally unique `ID`. */
  resourceMessage: Maybe<ResourceMessage>;
  resourceMessageById: Maybe<ResourceMessage>;
  /** Reads a single `ResourceMessageImage` using its globally unique `ID`. */
  resourceMessageImage: Maybe<ResourceMessageImage>;
  resourceMessageImageById: Maybe<ResourceMessageImage>;
  searchNeeds: Maybe<SearchNeedsConnection>;
  searchResources: Maybe<SearchResourcesConnection>;
  /** Reads and enables pagination through a set of `ResourceBid`. */
  sentResourceBids: Maybe<ResourceBidsConnection>;
  /** Reads a single `SystemSetting` using its globally unique `ID`. */
  systemSetting: Maybe<SystemSetting>;
  systemSettingByKey: Maybe<SystemSetting>;
  /** Reads a single `TokenMovement` using its globally unique `ID`. */
  tokenMovement: Maybe<TokenMovement>;
  tokenMovementById: Maybe<TokenMovement>;
  tokenMovementByIdempotencyKey: Maybe<TokenMovement>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountByExternalSubjectArgs = {
  externalSubject: Scalars['String']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountDeliveryPreferenceArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountDeliveryPreferenceByAccountIdAndEventCategoryArgs = {
  accountId: Scalars['UUID']['input'];
  eventCategory: Scalars['String']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountNotificationArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAccountNotificationByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListAccountsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListBidsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListCampaignsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pStatus?: InputMaybe<CampaignModerationStatus>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListGrantsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListLogsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListMailsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListNotificationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAdminListResourcesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllAccountDeliveryPreferencesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<AccountDeliveryPreferenceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllAccountNotificationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<AccountNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllAccountsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<AccountCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<AccountsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllCampaignModerationAuditEventsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationAuditEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllCampaignModerationNotesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignModerationNoteCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllCampaignNeedsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignNeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllCampaignResourcesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllCampaignsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllChatConversationSummariesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ChatConversationSummariesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllChatTypingPresencesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ChatTypingPresenceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllClaimConversationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllClaimMessageImagesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimMessageImageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimMessageImagesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllClaimMessagesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ClaimMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllGrantClaimsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllGrantDefinitionsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantDefinitionCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllGrantTargetAccountsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantTargetAccountCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllGrantTargetEmailsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantTargetEmailCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantTargetEmailsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllNeedClaimNotificationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllNeedClaimSettlementEventsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimSettlementEventCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllNeedClaimsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllNeedsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<NeedCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<NeedsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllOperationalLogsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<OperationalLogCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<OperationalLogsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceBidNotificationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceBidsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceCategoriesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCategoryCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceCategoriesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceCategoryAssignmentsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCategoryAssignmentCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceConversationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceMessageImagesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceMessageImageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceMessageImagesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourceMessagesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllResourcesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllSystemSettingsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<SystemSettingCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<SystemSettingsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryAllTokenMovementsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<TokenMovementCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignModerationAuditEventArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignModerationAuditEventByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignModerationEventsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pCampaignId?: InputMaybe<Scalars['UUID']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignModerationNoteArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignModerationNoteByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignNeedArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignNeedByCampaignIdAndNeedIdArgs = {
  campaignId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignResourceArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCampaignResourceByCampaignIdAndResourceIdArgs = {
  campaignId: Scalars['UUID']['input'];
  resourceId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryChatTypingPresenceArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryChatTypingPresenceByConversationKindAndConversationIdAndAccountIdArgs = {
  accountId: Scalars['UUID']['input'];
  conversationId: Scalars['UUID']['input'];
  conversationKind: ChatContextKind;
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimConversationArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimConversationByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdArgs = {
  claimerAccountId: Scalars['UUID']['input'];
  creatorAccountId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimMessageArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimMessageByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimMessageImageArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryClaimMessageImageByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryCountChatConversationsArgs = {
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryGetGrantForClaimArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantClaimArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantClaimByGrantIdAndAccountIdArgs = {
  accountId: Scalars['UUID']['input'];
  grantId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantClaimByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantDefinitionArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantDefinitionByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantTargetAccountArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantTargetAccountByGrantIdAndAccountIdArgs = {
  accountId: Scalars['UUID']['input'];
  grantId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantTargetEmailArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryGrantTargetEmailByGrantIdAndTargetEmailNormalizedArgs = {
  grantId: Scalars['UUID']['input'];
  targetEmailNormalized: Scalars['String']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryListChatConversationsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
  pSearch?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryListResourceCategoriesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimByNeedIdAndClaimerAccountIdArgs = {
  claimerAccountId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimNotificationArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimNotificationByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimSettlementEventArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimSettlementEventByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNeedClaimSettlementEventByNeedClaimIdArgs = {
  needClaimId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryNodeArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryOperationalLogArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryOperationalLogByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryReceivedResourceBidsArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceBidArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceBidByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceBidByResourceIdAndBidderAccountIdArgs = {
  bidderAccountId: Scalars['UUID']['input'];
  resourceId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceBidNotificationArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceBidNotificationByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceCategoryArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceCategoryAssignmentArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceCategoryAssignmentByResourceIdAndCategoryCodeArgs = {
  categoryCode: Scalars['Int']['input'];
  resourceId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceCategoryByCodeArgs = {
  code: Scalars['Int']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceCategoryBySlugArgs = {
  slug: Scalars['String']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceConversationArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceConversationByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdArgs = {
  bidderAccountId: Scalars['UUID']['input'];
  ownerAccountId: Scalars['UUID']['input'];
  resourceId: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceMessageArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceMessageByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceMessageImageArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryResourceMessageImageByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QuerySearchNeedsArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  browserLatitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLongitude?: InputMaybe<Scalars['BigFloat']['input']>;
  competenceRequired?: InputMaybe<TriStateFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  multiplePeopleRequired?: InputMaybe<TriStateFilter>;
  objectRequired?: InputMaybe<TriStateFilter>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  searchText?: InputMaybe<Scalars['String']['input']>;
  toolingRequired?: InputMaybe<TriStateFilter>;
};


/** The root query type which gives access points into the data universe. */
export type QuerySearchResourcesArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  browserLatitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLongitude?: InputMaybe<Scalars['BigFloat']['input']>;
  canBeDelivered?: InputMaybe<TriStateFilter>;
  canBeExchanged?: InputMaybe<TriStateFilter>;
  canBeGiven?: InputMaybe<TriStateFilter>;
  canBeTakenAway?: InputMaybe<TriStateFilter>;
  categoryCodes?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isProduct?: InputMaybe<TriStateFilter>;
  isService?: InputMaybe<TriStateFilter>;
  last?: InputMaybe<Scalars['Int']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  searchText?: InputMaybe<Scalars['String']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QuerySentResourceBidsArgs = {
  activeOnly?: InputMaybe<Scalars['Boolean']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** The root query type which gives access points into the data universe. */
export type QuerySystemSettingArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QuerySystemSettingByKeyArgs = {
  key: Scalars['String']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryTokenMovementArgs = {
  nodeId: Scalars['ID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryTokenMovementByIdArgs = {
  id: Scalars['UUID']['input'];
};


/** The root query type which gives access points into the data universe. */
export type QueryTokenMovementByIdempotencyKeyArgs = {
  idempotencyKey: Scalars['String']['input'];
};

/** All input for the `registerLocalAccount` mutation. */
export type RegisterLocalAccountInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  passwordHash?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  verificationTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
};

/** The output of our `registerLocalAccount` mutation. */
export type RegisterLocalAccountPayload = {
  __typename: 'RegisterLocalAccountPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `registerLocalAccountWithPassword` mutation. */
export type RegisterLocalAccountWithPasswordInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
  verificationTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
};

/** The output of our `registerLocalAccountWithPassword` mutation. */
export type RegisterLocalAccountWithPasswordPayload = {
  __typename: 'RegisterLocalAccountWithPasswordPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `rejectCampaignNeed` mutation. */
export type RejectCampaignNeedInput = {
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `rejectCampaignNeed` mutation. */
export type RejectCampaignNeedPayload = {
  __typename: 'RejectCampaignNeedPayload';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  campaignNeed: Maybe<CampaignNeed>;
  /** An edge for our `CampaignNeed`. May be used by Relay 1. */
  campaignNeedEdge: Maybe<CampaignNeedsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `rejectCampaignNeed` mutation. */
export type RejectCampaignNeedPayloadCampaignNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};

/** All input for the `requestEmailVerification` mutation. */
export type RequestEmailVerificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  throttleMs?: InputMaybe<Scalars['BigInt']['input']>;
  verificationTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
};

/** The output of our `requestEmailVerification` mutation. */
export type RequestEmailVerificationPayload = {
  __typename: 'RequestEmailVerificationPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `requestPasswordReset` mutation. */
export type RequestPasswordResetInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  resetTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
  throttleMs?: InputMaybe<Scalars['BigInt']['input']>;
};

/** The output of our `requestPasswordReset` mutation. */
export type RequestPasswordResetPayload = {
  __typename: 'RequestPasswordResetPayload';
  boolean: Maybe<Scalars['Boolean']['output']>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

export type Resource = Node & {
  __typename: 'Resource';
  /** Reads a single `Account` that is related to this `Resource`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** Reads and enables pagination through a set of `CampaignResource`. */
  campaignResourcesByResourceId: CampaignResourcesConnection;
  canBeDelivered: Scalars['Boolean']['output'];
  canBeExchanged: Scalars['Boolean']['output'];
  canBeGiven: Scalars['Boolean']['output'];
  canBeTakenAway: Scalars['Boolean']['output'];
  categoryLabels: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  createdAt: Scalars['Datetime']['output'];
  creatorAccountId: Scalars['UUID']['output'];
  defaultTokenAmount: Maybe<Scalars['Int']['output']>;
  description: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['Datetime']['output']>;
  id: Scalars['UUID']['output'];
  imageUrls: Array<Maybe<Scalars['String']['output']>>;
  intensity: NeedIntensity;
  isActive: Scalars['Boolean']['output'];
  isProduct: Scalars['Boolean']['output'];
  isService: Scalars['Boolean']['output'];
  latitude: Scalars['BigFloat']['output'];
  location: Scalars['String']['output'];
  longitude: Scalars['BigFloat']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads and enables pagination through a set of `ResourceBid`. */
  resourceBidsByResourceId: ResourceBidsConnection;
  /** Reads and enables pagination through a set of `ResourceCategoryAssignment`. */
  resourceCategoryAssignmentsByResourceId: ResourceCategoryAssignmentsConnection;
  /** Reads and enables pagination through a set of `ResourceConversation`. */
  resourceConversationsByResourceId: ResourceConversationsConnection;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Datetime']['output'];
};


export type ResourceCampaignResourcesByResourceIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<CampaignResourceCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};


export type ResourceResourceBidsByResourceIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};


export type ResourceResourceCategoryAssignmentsByResourceIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCategoryAssignmentCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};


export type ResourceResourceConversationsByResourceIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};

/** Responses and negotiations created by interested accounts on resources. */
export type ResourceBid = Node & {
  __typename: 'ResourceBid';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  bidderAccountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Maybe<Scalars['Boolean']['output']>;
  message: Maybe<Scalars['String']['output']>;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  proposedTokenAmount: Maybe<Scalars['Int']['output']>;
  /** Reads and enables pagination through a set of `ResourceBidNotification`. */
  resourceBidNotificationsByResourceBidId: ResourceBidNotificationsConnection;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
  /** Reads and enables pagination through a set of `ResourceConversation`. */
  resourceConversationsByResourceBidId: ResourceConversationsConnection;
  resourceId: Scalars['UUID']['output'];
  respondedAt: Maybe<Scalars['Datetime']['output']>;
  respondedByAccountId: Maybe<Scalars['UUID']['output']>;
  status: ResourceBidStatus;
  updatedAt: Scalars['Datetime']['output'];
  validUntil: Scalars['Datetime']['output'];
};


/** Responses and negotiations created by interested accounts on resources. */
export type ResourceBidResourceBidNotificationsByResourceBidIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceBidNotificationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};


/** Responses and negotiations created by interested accounts on resources. */
export type ResourceBidResourceConversationsByResourceBidIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceConversationCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};

/**
 * A condition to be used against `ResourceBid` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type ResourceBidCondition = {
  /** Checks for equality with the object’s `bidderAccountId` field. */
  bidderAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `resourceId` field. */
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `respondedByAccountId` field. */
  respondedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `status` field. */
  status?: InputMaybe<ResourceBidStatus>;
};

/** An input for mutations affecting `ResourceBid` */
export type ResourceBidInput = {
  bidderAccountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  proposedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  resourceId: Scalars['UUID']['input'];
  respondedAt?: InputMaybe<Scalars['Datetime']['input']>;
  respondedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<ResourceBidStatus>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
  validUntil?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Notification events emitted when resource bid lifecycle changes occur. */
export type ResourceBidNotification = Node & {
  __typename: 'ResourceBidNotification';
  /** Reads a single `Account` that is related to this `ResourceBidNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  createdAt: Scalars['Datetime']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  readAt: Maybe<Scalars['Datetime']['output']>;
  recipientAccountId: Scalars['UUID']['output'];
  /** Reads a single `ResourceBid` that is related to this `ResourceBidNotification`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  resourceBidId: Scalars['UUID']['output'];
};

/**
 * A condition to be used against `ResourceBidNotification` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type ResourceBidNotificationCondition = {
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `recipientAccountId` field. */
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `resourceBidId` field. */
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ResourceBidNotification` */
export type ResourceBidNotificationInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId: Scalars['UUID']['input'];
  resourceBidId: Scalars['UUID']['input'];
};

/** Represents an update to a `ResourceBidNotification`. Fields that are set will be updated. */
export type ResourceBidNotificationPatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  recipientAccountId?: InputMaybe<Scalars['UUID']['input']>;
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `ResourceBidNotification` values. */
export type ResourceBidNotificationsConnection = {
  __typename: 'ResourceBidNotificationsConnection';
  /** A list of edges which contains the `ResourceBidNotification` and cursor to aid in pagination. */
  edges: Array<ResourceBidNotificationsEdge>;
  /** A list of `ResourceBidNotification` objects. */
  nodes: Array<ResourceBidNotification>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceBidNotification` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceBidNotification` edge in the connection. */
export type ResourceBidNotificationsEdge = {
  __typename: 'ResourceBidNotificationsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceBidNotification` at the end of the edge. */
  node: ResourceBidNotification;
};

/** Methods to use when ordering `ResourceBidNotification`. */
export enum ResourceBidNotificationsOrderBy {
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  RecipientAccountIdAsc = 'RECIPIENT_ACCOUNT_ID_ASC',
  RecipientAccountIdDesc = 'RECIPIENT_ACCOUNT_ID_DESC',
  ResourceBidIdAsc = 'RESOURCE_BID_ID_ASC',
  ResourceBidIdDesc = 'RESOURCE_BID_ID_DESC'
}

/** Represents an update to a `ResourceBid`. Fields that are set will be updated. */
export type ResourceBidPatch = {
  bidderAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  proposedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  respondedAt?: InputMaybe<Scalars['Datetime']['input']>;
  respondedByAccountId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<ResourceBidStatus>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
  validUntil?: InputMaybe<Scalars['Datetime']['input']>;
};

export enum ResourceBidStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Expired = 'EXPIRED',
  Open = 'OPEN',
  Withdrawn = 'WITHDRAWN'
}

/** A connection to a list of `ResourceBid` values. */
export type ResourceBidsConnection = {
  __typename: 'ResourceBidsConnection';
  /** A list of edges which contains the `ResourceBid` and cursor to aid in pagination. */
  edges: Array<ResourceBidsEdge>;
  /** A list of `ResourceBid` objects. */
  nodes: Array<ResourceBid>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceBid` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceBid` edge in the connection. */
export type ResourceBidsEdge = {
  __typename: 'ResourceBidsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceBid` at the end of the edge. */
  node: ResourceBid;
};

/** Methods to use when ordering `ResourceBid`. */
export enum ResourceBidsOrderBy {
  BidderAccountIdAsc = 'BIDDER_ACCOUNT_ID_ASC',
  BidderAccountIdDesc = 'BIDDER_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ResourceIdAsc = 'RESOURCE_ID_ASC',
  ResourceIdDesc = 'RESOURCE_ID_DESC',
  RespondedByAccountIdAsc = 'RESPONDED_BY_ACCOUNT_ID_ASC',
  RespondedByAccountIdDesc = 'RESPONDED_BY_ACCOUNT_ID_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC'
}

/** A connection to a list of `ResourceCategory` values. */
export type ResourceCategoriesConnection = {
  __typename: 'ResourceCategoriesConnection';
  /** A list of edges which contains the `ResourceCategory` and cursor to aid in pagination. */
  edges: Array<ResourceCategoriesEdge>;
  /** A list of `ResourceCategory` objects. */
  nodes: Array<ResourceCategory>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceCategory` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceCategory` edge in the connection. */
export type ResourceCategoriesEdge = {
  __typename: 'ResourceCategoriesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceCategory` at the end of the edge. */
  node: ResourceCategory;
};

/** Methods to use when ordering `ResourceCategory`. */
export enum ResourceCategoriesOrderBy {
  CodeAsc = 'CODE_ASC',
  CodeDesc = 'CODE_DESC',
  IsActiveAsc = 'IS_ACTIVE_ASC',
  IsActiveDesc = 'IS_ACTIVE_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SlugAsc = 'SLUG_ASC',
  SlugDesc = 'SLUG_DESC'
}

export type ResourceCategory = Node & {
  __typename: 'ResourceCategory';
  code: Scalars['Int']['output'];
  createdAt: Scalars['Datetime']['output'];
  isActive: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  labelFr: Scalars['String']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads and enables pagination through a set of `ResourceCategoryAssignment`. */
  resourceCategoryAssignmentsByCategoryCode: ResourceCategoryAssignmentsConnection;
  slug: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
  updatedAt: Scalars['Datetime']['output'];
};


export type ResourceCategoryResourceCategoryAssignmentsByCategoryCodeArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceCategoryAssignmentCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};

export type ResourceCategoryAssignment = Node & {
  __typename: 'ResourceCategoryAssignment';
  categoryCode: Scalars['Int']['output'];
  createdAt: Scalars['Datetime']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads a single `Resource` that is related to this `ResourceCategoryAssignment`. */
  resourceByResourceId: Maybe<Resource>;
  /** Reads a single `ResourceCategory` that is related to this `ResourceCategoryAssignment`. */
  resourceCategoryByCategoryCode: Maybe<ResourceCategory>;
  resourceId: Scalars['UUID']['output'];
};

/**
 * A condition to be used against `ResourceCategoryAssignment` object types. All
 * fields are tested for equality and combined with a logical ‘and.’
 */
export type ResourceCategoryAssignmentCondition = {
  /** Checks for equality with the object’s `categoryCode` field. */
  categoryCode?: InputMaybe<Scalars['Int']['input']>;
  /** Checks for equality with the object’s `resourceId` field. */
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ResourceCategoryAssignment` */
export type ResourceCategoryAssignmentInput = {
  categoryCode: Scalars['Int']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  resourceId: Scalars['UUID']['input'];
};

/** Represents an update to a `ResourceCategoryAssignment`. Fields that are set will be updated. */
export type ResourceCategoryAssignmentPatch = {
  categoryCode?: InputMaybe<Scalars['Int']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `ResourceCategoryAssignment` values. */
export type ResourceCategoryAssignmentsConnection = {
  __typename: 'ResourceCategoryAssignmentsConnection';
  /** A list of edges which contains the `ResourceCategoryAssignment` and cursor to aid in pagination. */
  edges: Array<ResourceCategoryAssignmentsEdge>;
  /** A list of `ResourceCategoryAssignment` objects. */
  nodes: Array<ResourceCategoryAssignment>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceCategoryAssignment` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceCategoryAssignment` edge in the connection. */
export type ResourceCategoryAssignmentsEdge = {
  __typename: 'ResourceCategoryAssignmentsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceCategoryAssignment` at the end of the edge. */
  node: ResourceCategoryAssignment;
};

/** Methods to use when ordering `ResourceCategoryAssignment`. */
export enum ResourceCategoryAssignmentsOrderBy {
  CategoryCodeAsc = 'CATEGORY_CODE_ASC',
  CategoryCodeDesc = 'CATEGORY_CODE_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ResourceIdAsc = 'RESOURCE_ID_ASC',
  ResourceIdDesc = 'RESOURCE_ID_DESC'
}

/**
 * A condition to be used against `ResourceCategory` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ResourceCategoryCondition = {
  /** Checks for equality with the object’s `code` field. */
  code?: InputMaybe<Scalars['Int']['input']>;
  /** Checks for equality with the object’s `isActive` field. */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Checks for equality with the object’s `slug` field. */
  slug?: InputMaybe<Scalars['String']['input']>;
};

/** An input for mutations affecting `ResourceCategory` */
export type ResourceCategoryInput = {
  code: Scalars['Int']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label: Scalars['String']['input'];
  labelFr: Scalars['String']['input'];
  slug: Scalars['String']['input'];
  sortOrder: Scalars['Int']['input'];
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Represents an update to a `ResourceCategory`. Fields that are set will be updated. */
export type ResourceCategoryPatch = {
  code?: InputMaybe<Scalars['Int']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  labelFr?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/**
 * A condition to be used against `Resource` object types. All fields are tested
 * for equality and combined with a logical ‘and.’
 */
export type ResourceCondition = {
  /** Checks for equality with the object’s `creatorAccountId` field. */
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `isActive` field. */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

/** One private conversation channel per (resource, participant-pair). Attached to a resource_bid once one is submitted. */
export type ResourceConversation = Node & {
  __typename: 'ResourceConversation';
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByOwnerAccountId: Maybe<Account>;
  bidderAccountId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  ownerAccountId: Scalars['UUID']['output'];
  /** Reads a single `ResourceBid` that is related to this `ResourceConversation`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  resourceBidId: Maybe<Scalars['UUID']['output']>;
  /** Reads a single `Resource` that is related to this `ResourceConversation`. */
  resourceByResourceId: Maybe<Resource>;
  resourceId: Scalars['UUID']['output'];
  /** Reads and enables pagination through a set of `ResourceMessage`. */
  resourceMessagesByConversationId: ResourceMessagesConnection;
  updatedAt: Scalars['Datetime']['output'];
};


/** One private conversation channel per (resource, participant-pair). Attached to a resource_bid once one is submitted. */
export type ResourceConversationResourceMessagesByConversationIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceMessageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/**
 * A condition to be used against `ResourceConversation` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type ResourceConversationCondition = {
  /** Checks for equality with the object’s `bidderAccountId` field. */
  bidderAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `ownerAccountId` field. */
  ownerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `resourceBidId` field. */
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `resourceId` field. */
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ResourceConversation` */
export type ResourceConversationInput = {
  bidderAccountId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ownerAccountId: Scalars['UUID']['input'];
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
  resourceId: Scalars['UUID']['input'];
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** Represents an update to a `ResourceConversation`. Fields that are set will be updated. */
export type ResourceConversationPatch = {
  bidderAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  ownerAccountId?: InputMaybe<Scalars['UUID']['input']>;
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `ResourceConversation` values. */
export type ResourceConversationsConnection = {
  __typename: 'ResourceConversationsConnection';
  /** A list of edges which contains the `ResourceConversation` and cursor to aid in pagination. */
  edges: Array<ResourceConversationsEdge>;
  /** A list of `ResourceConversation` objects. */
  nodes: Array<ResourceConversation>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceConversation` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceConversation` edge in the connection. */
export type ResourceConversationsEdge = {
  __typename: 'ResourceConversationsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceConversation` at the end of the edge. */
  node: ResourceConversation;
};

/** Methods to use when ordering `ResourceConversation`. */
export enum ResourceConversationsOrderBy {
  BidderAccountIdAsc = 'BIDDER_ACCOUNT_ID_ASC',
  BidderAccountIdDesc = 'BIDDER_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  OwnerAccountIdAsc = 'OWNER_ACCOUNT_ID_ASC',
  OwnerAccountIdDesc = 'OWNER_ACCOUNT_ID_DESC',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ResourceBidIdAsc = 'RESOURCE_BID_ID_ASC',
  ResourceBidIdDesc = 'RESOURCE_BID_ID_DESC',
  ResourceIdAsc = 'RESOURCE_ID_ASC',
  ResourceIdDesc = 'RESOURCE_ID_DESC'
}

/** An input for mutations affecting `Resource` */
export type ResourceInput = {
  canBeDelivered?: InputMaybe<Scalars['Boolean']['input']>;
  canBeExchanged?: InputMaybe<Scalars['Boolean']['input']>;
  canBeGiven?: InputMaybe<Scalars['Boolean']['input']>;
  canBeTakenAway?: InputMaybe<Scalars['Boolean']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId: Scalars['UUID']['input'];
  defaultTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  intensity: NeedIntensity;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isProduct?: InputMaybe<Scalars['Boolean']['input']>;
  isService?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location: Scalars['String']['input'];
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  title: Scalars['String']['input'];
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

export type ResourceMessage = Node & {
  __typename: 'ResourceMessage';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  body: Scalars['String']['output'];
  conversationId: Scalars['UUID']['output'];
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  readAt: Maybe<Scalars['Datetime']['output']>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  /** Reads and enables pagination through a set of `ResourceMessageImage`. */
  resourceMessageImagesByMessageId: ResourceMessageImagesConnection;
  senderAccountId: Scalars['UUID']['output'];
};


export type ResourceMessageResourceMessageImagesByMessageIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<ResourceMessageImageCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<ResourceMessageImagesOrderBy>>;
};

/**
 * A condition to be used against `ResourceMessage` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type ResourceMessageCondition = {
  /** Checks for equality with the object’s `conversationId` field. */
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `senderAccountId` field. */
  senderAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

export type ResourceMessageImage = Node & {
  __typename: 'ResourceMessageImage';
  createdAt: Scalars['Datetime']['output'];
  id: Scalars['UUID']['output'];
  imageUrl: Scalars['String']['output'];
  messageId: Scalars['UUID']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  /** Reads a single `ResourceMessage` that is related to this `ResourceMessageImage`. */
  resourceMessageByMessageId: Maybe<ResourceMessage>;
  sortOrder: Scalars['Int']['output'];
};

/**
 * A condition to be used against `ResourceMessageImage` object types. All fields
 * are tested for equality and combined with a logical ‘and.’
 */
export type ResourceMessageImageCondition = {
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `messageId` field. */
  messageId?: InputMaybe<Scalars['UUID']['input']>;
};

/** An input for mutations affecting `ResourceMessageImage` */
export type ResourceMessageImageInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrl: Scalars['String']['input'];
  messageId: Scalars['UUID']['input'];
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** Represents an update to a `ResourceMessageImage`. Fields that are set will be updated. */
export type ResourceMessageImagePatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  messageId?: InputMaybe<Scalars['UUID']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** A connection to a list of `ResourceMessageImage` values. */
export type ResourceMessageImagesConnection = {
  __typename: 'ResourceMessageImagesConnection';
  /** A list of edges which contains the `ResourceMessageImage` and cursor to aid in pagination. */
  edges: Array<ResourceMessageImagesEdge>;
  /** A list of `ResourceMessageImage` objects. */
  nodes: Array<ResourceMessageImage>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceMessageImage` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceMessageImage` edge in the connection. */
export type ResourceMessageImagesEdge = {
  __typename: 'ResourceMessageImagesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceMessageImage` at the end of the edge. */
  node: ResourceMessageImage;
};

/** Methods to use when ordering `ResourceMessageImage`. */
export enum ResourceMessageImagesOrderBy {
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  MessageIdAsc = 'MESSAGE_ID_ASC',
  MessageIdDesc = 'MESSAGE_ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** An input for mutations affecting `ResourceMessage` */
export type ResourceMessageInput = {
  body: Scalars['String']['input'];
  conversationId: Scalars['UUID']['input'];
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  senderAccountId: Scalars['UUID']['input'];
};

/** Represents an update to a `ResourceMessage`. Fields that are set will be updated. */
export type ResourceMessagePatch = {
  body?: InputMaybe<Scalars['String']['input']>;
  conversationId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  readAt?: InputMaybe<Scalars['Datetime']['input']>;
  senderAccountId?: InputMaybe<Scalars['UUID']['input']>;
};

/** A connection to a list of `ResourceMessage` values. */
export type ResourceMessagesConnection = {
  __typename: 'ResourceMessagesConnection';
  /** A list of edges which contains the `ResourceMessage` and cursor to aid in pagination. */
  edges: Array<ResourceMessagesEdge>;
  /** A list of `ResourceMessage` objects. */
  nodes: Array<ResourceMessage>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `ResourceMessage` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `ResourceMessage` edge in the connection. */
export type ResourceMessagesEdge = {
  __typename: 'ResourceMessagesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `ResourceMessage` at the end of the edge. */
  node: ResourceMessage;
};

/** Methods to use when ordering `ResourceMessage`. */
export enum ResourceMessagesOrderBy {
  ConversationIdAsc = 'CONVERSATION_ID_ASC',
  ConversationIdDesc = 'CONVERSATION_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  SenderAccountIdAsc = 'SENDER_ACCOUNT_ID_ASC',
  SenderAccountIdDesc = 'SENDER_ACCOUNT_ID_DESC'
}

/** Represents an update to a `Resource`. Fields that are set will be updated. */
export type ResourcePatch = {
  canBeDelivered?: InputMaybe<Scalars['Boolean']['input']>;
  canBeExchanged?: InputMaybe<Scalars['Boolean']['input']>;
  canBeGiven?: InputMaybe<Scalars['Boolean']['input']>;
  canBeTakenAway?: InputMaybe<Scalars['Boolean']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  creatorAccountId?: InputMaybe<Scalars['UUID']['input']>;
  defaultTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  intensity?: InputMaybe<NeedIntensity>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isProduct?: InputMaybe<Scalars['Boolean']['input']>;
  isService?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
};

/** A connection to a list of `Resource` values. */
export type ResourcesConnection = {
  __typename: 'ResourcesConnection';
  /** A list of edges which contains the `Resource` and cursor to aid in pagination. */
  edges: Array<ResourcesEdge>;
  /** A list of `Resource` objects. */
  nodes: Array<Resource>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `Resource` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `Resource` edge in the connection. */
export type ResourcesEdge = {
  __typename: 'ResourcesEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `Resource` at the end of the edge. */
  node: Resource;
};

/** Methods to use when ordering `Resource`. */
export enum ResourcesOrderBy {
  CreatorAccountIdAsc = 'CREATOR_ACCOUNT_ID_ASC',
  CreatorAccountIdDesc = 'CREATOR_ACCOUNT_ID_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  IsActiveAsc = 'IS_ACTIVE_ASC',
  IsActiveDesc = 'IS_ACTIVE_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** All input for the `respondToResourceBid` mutation. */
export type RespondToResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<ResourceBidStatus>;
};

/** The output of our `respondToResourceBid` mutation. */
export type RespondToResourceBidPayload = {
  __typename: 'RespondToResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our `respondToResourceBid` mutation. */
export type RespondToResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

/** A `SearchNeedsRecord` edge in the connection. */
export type SearchNeedEdge = {
  __typename: 'SearchNeedEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `SearchNeedsRecord` at the end of the edge. */
  node: SearchNeedsRecord;
};

/** A connection to a list of `SearchNeedsRecord` values. */
export type SearchNeedsConnection = {
  __typename: 'SearchNeedsConnection';
  /** A list of edges which contains the `SearchNeedsRecord` and cursor to aid in pagination. */
  edges: Array<SearchNeedEdge>;
  /** A list of `SearchNeedsRecord` objects. */
  nodes: Array<SearchNeedsRecord>;
  /** The count of *all* `SearchNeedsRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `searchNeeds` query. */
export type SearchNeedsRecord = {
  __typename: 'SearchNeedsRecord';
  closenessScore: Maybe<Scalars['BigFloat']['output']>;
  competenceRequired: Maybe<Scalars['Boolean']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  creatorAccountId: Maybe<Scalars['UUID']['output']>;
  creatorDisplayName: Maybe<Scalars['String']['output']>;
  description: Maybe<Scalars['String']['output']>;
  easeOfSetupScore: Maybe<Scalars['BigFloat']['output']>;
  expirationScore: Maybe<Scalars['BigFloat']['output']>;
  expiresAt: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  intensity: Maybe<NeedIntensity>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  latitude: Maybe<Scalars['BigFloat']['output']>;
  location: Maybe<Scalars['String']['output']>;
  longitude: Maybe<Scalars['BigFloat']['output']>;
  multiplePeopleRequired: Maybe<Scalars['Boolean']['output']>;
  objectRequired: Maybe<Scalars['Boolean']['output']>;
  proposedTopesAmount: Maybe<Scalars['Int']['output']>;
  queryLatitude: Maybe<Scalars['BigFloat']['output']>;
  queryLongitude: Maybe<Scalars['BigFloat']['output']>;
  requiredCompetenceText: Maybe<Scalars['String']['output']>;
  requiredPeopleCount: Maybe<Scalars['Int']['output']>;
  requiredToolingText: Maybe<Scalars['String']['output']>;
  title: Maybe<Scalars['String']['output']>;
  toolingRequired: Maybe<Scalars['Boolean']['output']>;
  updatedAt: Maybe<Scalars['Datetime']['output']>;
  weightedScore: Maybe<Scalars['BigFloat']['output']>;
};

/** All input for the `searchOperationalLogs` mutation. */
export type SearchOperationalLogsInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pAccountId?: InputMaybe<Scalars['UUID']['input']>;
  pComponent?: InputMaybe<Scalars['String']['input']>;
  pContext?: InputMaybe<Scalars['String']['input']>;
  pLevel?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
};

/** The output of our `searchOperationalLogs` mutation. */
export type SearchOperationalLogsPayload = {
  __typename: 'SearchOperationalLogsPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  results: Maybe<Array<Maybe<SearchOperationalLogsRecord>>>;
};

/** The return type of our `searchOperationalLogs` mutation. */
export type SearchOperationalLogsRecord = {
  __typename: 'SearchOperationalLogsRecord';
  accountId: Maybe<Scalars['UUID']['output']>;
  component: Maybe<Scalars['String']['output']>;
  context: Maybe<Scalars['String']['output']>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  level: Maybe<Scalars['String']['output']>;
  message: Maybe<Scalars['String']['output']>;
  metadata: Maybe<Scalars['JSON']['output']>;
};

/** A `SearchResourcesRecord` edge in the connection. */
export type SearchResourceEdge = {
  __typename: 'SearchResourceEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `SearchResourcesRecord` at the end of the edge. */
  node: SearchResourcesRecord;
};

/** A connection to a list of `SearchResourcesRecord` values. */
export type SearchResourcesConnection = {
  __typename: 'SearchResourcesConnection';
  /** A list of edges which contains the `SearchResourcesRecord` and cursor to aid in pagination. */
  edges: Array<SearchResourceEdge>;
  /** A list of `SearchResourcesRecord` objects. */
  nodes: Array<SearchResourcesRecord>;
  /** The count of *all* `SearchResourcesRecord` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** The return type of our `searchResources` query. */
export type SearchResourcesRecord = {
  __typename: 'SearchResourcesRecord';
  canBeDelivered: Maybe<Scalars['Boolean']['output']>;
  canBeExchanged: Maybe<Scalars['Boolean']['output']>;
  canBeGiven: Maybe<Scalars['Boolean']['output']>;
  canBeTakenAway: Maybe<Scalars['Boolean']['output']>;
  categoryLabels: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  createdAt: Maybe<Scalars['Datetime']['output']>;
  creatorAccountId: Maybe<Scalars['UUID']['output']>;
  creatorDisplayName: Maybe<Scalars['String']['output']>;
  defaultTokenAmount: Maybe<Scalars['Int']['output']>;
  description: Maybe<Scalars['String']['output']>;
  distanceKm: Maybe<Scalars['BigFloat']['output']>;
  expiresAt: Maybe<Scalars['Datetime']['output']>;
  id: Maybe<Scalars['UUID']['output']>;
  imageUrls: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  intensity: Maybe<NeedIntensity>;
  isActive: Maybe<Scalars['Boolean']['output']>;
  isProduct: Maybe<Scalars['Boolean']['output']>;
  isService: Maybe<Scalars['Boolean']['output']>;
  latitude: Maybe<Scalars['BigFloat']['output']>;
  location: Maybe<Scalars['String']['output']>;
  longitude: Maybe<Scalars['BigFloat']['output']>;
  queryLatitude: Maybe<Scalars['BigFloat']['output']>;
  queryLongitude: Maybe<Scalars['BigFloat']['output']>;
  title: Maybe<Scalars['String']['output']>;
  updatedAt: Maybe<Scalars['Datetime']['output']>;
};

/** All input for the `sendClaimMessage` mutation. */
export type SendClaimMessageInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `sendClaimMessage` mutation. */
export type SendClaimMessagePayload = {
  __typename: 'SendClaimMessagePayload';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  claimMessage: Maybe<ClaimMessage>;
  /** An edge for our `ClaimMessage`. May be used by Relay 1. */
  claimMessageEdge: Maybe<ClaimMessagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `sendClaimMessage` mutation. */
export type SendClaimMessagePayloadClaimMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/** All input for the `sendNeedMessage` mutation. */
export type SendNeedMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pBody?: InputMaybe<Scalars['String']['input']>;
  pImageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pNeedId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `sendNeedMessage` mutation. */
export type SendNeedMessagePayload = {
  __typename: 'SendNeedMessagePayload';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  claimMessage: Maybe<ClaimMessage>;
  /** An edge for our `ClaimMessage`. May be used by Relay 1. */
  claimMessageEdge: Maybe<ClaimMessagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `sendNeedMessage` mutation. */
export type SendNeedMessagePayloadClaimMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/** All input for the `sendResourceMessageDirect` mutation. */
export type SendResourceMessageDirectInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pBody?: InputMaybe<Scalars['String']['input']>;
  pImageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pOtherAccountId?: InputMaybe<Scalars['UUID']['input']>;
  pResourceId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `sendResourceMessageDirect` mutation. */
export type SendResourceMessageDirectPayload = {
  __typename: 'SendResourceMessageDirectPayload';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  resourceMessage: Maybe<ResourceMessage>;
  /** An edge for our `ResourceMessage`. May be used by Relay 1. */
  resourceMessageEdge: Maybe<ResourceMessagesEdge>;
};


/** The output of our `sendResourceMessageDirect` mutation. */
export type SendResourceMessageDirectPayloadResourceMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/** All input for the `sendResourceMessage` mutation. */
export type SendResourceMessageInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  resourceBidId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `sendResourceMessage` mutation. */
export type SendResourceMessagePayload = {
  __typename: 'SendResourceMessagePayload';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  resourceMessage: Maybe<ResourceMessage>;
  /** An edge for our `ResourceMessage`. May be used by Relay 1. */
  resourceMessageEdge: Maybe<ResourceMessagesEdge>;
};


/** The output of our `sendResourceMessage` mutation. */
export type SendResourceMessagePayloadResourceMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/** All input for the `setAccountDeliveryPreference` mutation. */
export type SetAccountDeliveryPreferenceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pDeliveryStrategy?: InputMaybe<Scalars['String']['input']>;
  pEventCategory?: InputMaybe<Scalars['String']['input']>;
  pSummaryFrequencyDays?: InputMaybe<Scalars['Int']['input']>;
};

/** The output of our `setAccountDeliveryPreference` mutation. */
export type SetAccountDeliveryPreferencePayload = {
  __typename: 'SetAccountDeliveryPreferencePayload';
  /** Reads a single `Account` that is related to this `AccountDeliveryPreference`. */
  accountByAccountId: Maybe<Account>;
  accountDeliveryPreference: Maybe<AccountDeliveryPreference>;
  /** An edge for our `AccountDeliveryPreference`. May be used by Relay 1. */
  accountDeliveryPreferenceEdge: Maybe<AccountDeliveryPreferencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `setAccountDeliveryPreference` mutation. */
export type SetAccountDeliveryPreferencePayloadAccountDeliveryPreferenceEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};

/** All input for the `setGrantTargetAccounts` mutation. */
export type SetGrantTargetAccountsInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pAccountIds?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `setGrantTargetAccounts` mutation. */
export type SetGrantTargetAccountsPayload = {
  __typename: 'SetGrantTargetAccountsPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `setGrantTargetEmails` mutation. */
export type SetGrantTargetEmailsInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pEmails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `setGrantTargetEmails` mutation. */
export type SetGrantTargetEmailsPayload = {
  __typename: 'SetGrantTargetEmailsPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  integer: Maybe<Scalars['Int']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};

/** All input for the `settleNeedClaim` mutation. */
export type SettleNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needClaimId?: InputMaybe<Scalars['UUID']['input']>;
};

/** The output of our `settleNeedClaim` mutation. */
export type SettleNeedClaimPayload = {
  __typename: 'SettleNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `settleNeedClaim` mutation. */
export type SettleNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `submitResourceBid` mutation. */
export type SubmitResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  proposedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  validHours?: InputMaybe<Scalars['Int']['input']>;
};

/** The output of our `submitResourceBid` mutation. */
export type SubmitResourceBidPayload = {
  __typename: 'SubmitResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our `submitResourceBid` mutation. */
export type SubmitResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

/** The root subscription type: contains realtime events you can subscribe to with the `subscription` operation. */
export type Subscription = {
  __typename: 'Subscription';
  listen: ListenPayload;
};


/** The root subscription type: contains realtime events you can subscribe to with the `subscription` operation. */
export type SubscriptionListenArgs = {
  initialEvent?: Scalars['Boolean']['input'];
  topic: Scalars['String']['input'];
};

/** SQL-owned system configuration values used for operational controls such as retention windows. */
export type SystemSetting = Node & {
  __typename: 'SystemSetting';
  createdAt: Scalars['Datetime']['output'];
  key: Scalars['String']['output'];
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  updatedAt: Scalars['Datetime']['output'];
  valueText: Scalars['String']['output'];
};

/**
 * A condition to be used against `SystemSetting` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type SystemSettingCondition = {
  /** Checks for equality with the object’s `key` field. */
  key?: InputMaybe<Scalars['String']['input']>;
};

/** An input for mutations affecting `SystemSetting` */
export type SystemSettingInput = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  key: Scalars['String']['input'];
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
  valueText: Scalars['String']['input'];
};

/** Represents an update to a `SystemSetting`. Fields that are set will be updated. */
export type SystemSettingPatch = {
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  updatedAt?: InputMaybe<Scalars['Datetime']['input']>;
  valueText?: InputMaybe<Scalars['String']['input']>;
};

/** A connection to a list of `SystemSetting` values. */
export type SystemSettingsConnection = {
  __typename: 'SystemSettingsConnection';
  /** A list of edges which contains the `SystemSetting` and cursor to aid in pagination. */
  edges: Array<SystemSettingsEdge>;
  /** A list of `SystemSetting` objects. */
  nodes: Array<SystemSetting>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `SystemSetting` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `SystemSetting` edge in the connection. */
export type SystemSettingsEdge = {
  __typename: 'SystemSettingsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `SystemSetting` at the end of the edge. */
  node: SystemSetting;
};

/** Methods to use when ordering `SystemSetting`. */
export enum SystemSettingsOrderBy {
  KeyAsc = 'KEY_ASC',
  KeyDesc = 'KEY_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC'
}

/** Auditable Topes ledger entries for all positive and negative account movements. */
export type TokenMovement = Node & {
  __typename: 'TokenMovement';
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByCounterpartyAccountId: Maybe<Account>;
  accountId: Scalars['UUID']['output'];
  amountDelta: Scalars['Int']['output'];
  counterpartyAccountId: Maybe<Scalars['UUID']['output']>;
  createdAt: Scalars['Datetime']['output'];
  eventType: Scalars['String']['output'];
  /** Reads and enables pagination through a set of `GrantClaim`. */
  grantClaimsByTokenMovementId: GrantClaimsConnection;
  id: Scalars['UUID']['output'];
  idempotencyKey: Maybe<Scalars['String']['output']>;
  /** A globally unique identifier. Can be used in various places throughout the system to identify this single value. */
  nodeId: Scalars['ID']['output'];
  payload: Scalars['JSON']['output'];
  referenceId: Maybe<Scalars['UUID']['output']>;
  referenceType: Maybe<Scalars['String']['output']>;
};


/** Auditable Topes ledger entries for all positive and negative account movements. */
export type TokenMovementGrantClaimsByTokenMovementIdArgs = {
  after?: InputMaybe<Scalars['Cursor']['input']>;
  before?: InputMaybe<Scalars['Cursor']['input']>;
  condition?: InputMaybe<GrantClaimCondition>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};

/**
 * A condition to be used against `TokenMovement` object types. All fields are
 * tested for equality and combined with a logical ‘and.’
 */
export type TokenMovementCondition = {
  /** Checks for equality with the object’s `accountId` field. */
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `counterpartyAccountId` field. */
  counterpartyAccountId?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `id` field. */
  id?: InputMaybe<Scalars['UUID']['input']>;
  /** Checks for equality with the object’s `idempotencyKey` field. */
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  /** Checks for equality with the object’s `referenceType` field. */
  referenceType?: InputMaybe<Scalars['String']['input']>;
};

/** An input for mutations affecting `TokenMovement` */
export type TokenMovementInput = {
  accountId: Scalars['UUID']['input'];
  amountDelta: Scalars['Int']['input'];
  counterpartyAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType: Scalars['String']['input'];
  id?: InputMaybe<Scalars['UUID']['input']>;
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  referenceId?: InputMaybe<Scalars['UUID']['input']>;
  referenceType?: InputMaybe<Scalars['String']['input']>;
};

/** Represents an update to a `TokenMovement`. Fields that are set will be updated. */
export type TokenMovementPatch = {
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  amountDelta?: InputMaybe<Scalars['Int']['input']>;
  counterpartyAccountId?: InputMaybe<Scalars['UUID']['input']>;
  createdAt?: InputMaybe<Scalars['Datetime']['input']>;
  eventType?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['UUID']['input']>;
  idempotencyKey?: InputMaybe<Scalars['String']['input']>;
  payload?: InputMaybe<Scalars['JSON']['input']>;
  referenceId?: InputMaybe<Scalars['UUID']['input']>;
  referenceType?: InputMaybe<Scalars['String']['input']>;
};

/** A connection to a list of `TokenMovement` values. */
export type TokenMovementsConnection = {
  __typename: 'TokenMovementsConnection';
  /** A list of edges which contains the `TokenMovement` and cursor to aid in pagination. */
  edges: Array<TokenMovementsEdge>;
  /** A list of `TokenMovement` objects. */
  nodes: Array<TokenMovement>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** The count of *all* `TokenMovement` you could get from the connection. */
  totalCount: Scalars['Int']['output'];
};

/** A `TokenMovement` edge in the connection. */
export type TokenMovementsEdge = {
  __typename: 'TokenMovementsEdge';
  /** A cursor for use in pagination. */
  cursor: Maybe<Scalars['Cursor']['output']>;
  /** The `TokenMovement` at the end of the edge. */
  node: TokenMovement;
};

/** Methods to use when ordering `TokenMovement`. */
export enum TokenMovementsOrderBy {
  AccountIdAsc = 'ACCOUNT_ID_ASC',
  AccountIdDesc = 'ACCOUNT_ID_DESC',
  CounterpartyAccountIdAsc = 'COUNTERPARTY_ACCOUNT_ID_ASC',
  CounterpartyAccountIdDesc = 'COUNTERPARTY_ACCOUNT_ID_DESC',
  IdempotencyKeyAsc = 'IDEMPOTENCY_KEY_ASC',
  IdempotencyKeyDesc = 'IDEMPOTENCY_KEY_DESC',
  IdAsc = 'ID_ASC',
  IdDesc = 'ID_DESC',
  Natural = 'NATURAL',
  PrimaryKeyAsc = 'PRIMARY_KEY_ASC',
  PrimaryKeyDesc = 'PRIMARY_KEY_DESC',
  ReferenceTypeAsc = 'REFERENCE_TYPE_ASC',
  ReferenceTypeDesc = 'REFERENCE_TYPE_DESC'
}

export enum TriStateFilter {
  Neutral = 'NEUTRAL',
  Set = 'SET',
  Unset = 'UNSET'
}

/** All input for the `updateAccountByExternalSubject` mutation. */
export type UpdateAccountByExternalSubjectInput = {
  /** An object where the defined keys will be set on the `Account` being updated. */
  accountPatch: AccountPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  externalSubject: Scalars['String']['input'];
};

/** All input for the `updateAccountById` mutation. */
export type UpdateAccountByIdInput = {
  /** An object where the defined keys will be set on the `Account` being updated. */
  accountPatch: AccountPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateAccountDeliveryPreferenceByAccountIdAndEventCategory` mutation. */
export type UpdateAccountDeliveryPreferenceByAccountIdAndEventCategoryInput = {
  /** An object where the defined keys will be set on the `AccountDeliveryPreference` being updated. */
  accountDeliveryPreferencePatch: AccountDeliveryPreferencePatch;
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** Managed event category key: new_resource_added, new_need_added, unread_notifications, new_chat_message_received. */
  eventCategory: Scalars['String']['input'];
};

/** All input for the `updateAccountDeliveryPreference` mutation. */
export type UpdateAccountDeliveryPreferenceInput = {
  /** An object where the defined keys will be set on the `AccountDeliveryPreference` being updated. */
  accountDeliveryPreferencePatch: AccountDeliveryPreferencePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `AccountDeliveryPreference` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `AccountDeliveryPreference` mutation. */
export type UpdateAccountDeliveryPreferencePayload = {
  __typename: 'UpdateAccountDeliveryPreferencePayload';
  /** Reads a single `Account` that is related to this `AccountDeliveryPreference`. */
  accountByAccountId: Maybe<Account>;
  /** The `AccountDeliveryPreference` that was updated by this mutation. */
  accountDeliveryPreference: Maybe<AccountDeliveryPreference>;
  /** An edge for our `AccountDeliveryPreference`. May be used by Relay 1. */
  accountDeliveryPreferenceEdge: Maybe<AccountDeliveryPreferencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `AccountDeliveryPreference` mutation. */
export type UpdateAccountDeliveryPreferencePayloadAccountDeliveryPreferenceEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountDeliveryPreferencesOrderBy>>;
};

/** All input for the `updateAccount` mutation. */
export type UpdateAccountInput = {
  /** An object where the defined keys will be set on the `Account` being updated. */
  accountPatch: AccountPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Account` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `updateAccountNotificationById` mutation. */
export type UpdateAccountNotificationByIdInput = {
  /** An object where the defined keys will be set on the `AccountNotification` being updated. */
  accountNotificationPatch: AccountNotificationPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateAccountNotification` mutation. */
export type UpdateAccountNotificationInput = {
  /** An object where the defined keys will be set on the `AccountNotification` being updated. */
  accountNotificationPatch: AccountNotificationPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `AccountNotification` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `AccountNotification` mutation. */
export type UpdateAccountNotificationPayload = {
  __typename: 'UpdateAccountNotificationPayload';
  /** Reads a single `Account` that is related to this `AccountNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /** The `AccountNotification` that was updated by this mutation. */
  accountNotification: Maybe<AccountNotification>;
  /** An edge for our `AccountNotification`. May be used by Relay 1. */
  accountNotificationEdge: Maybe<AccountNotificationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `AccountNotification` mutation. */
export type UpdateAccountNotificationPayloadAccountNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountNotificationsOrderBy>>;
};

/** The output of our update `Account` mutation. */
export type UpdateAccountPayload = {
  __typename: 'UpdateAccountPayload';
  /** The `Account` that was updated by this mutation. */
  account: Maybe<Account>;
  /** An edge for our `Account`. May be used by Relay 1. */
  accountEdge: Maybe<AccountsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `Account` mutation. */
export type UpdateAccountPayloadAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<AccountsOrderBy>>;
};

/** All input for the `updateCampaignById` mutation. */
export type UpdateCampaignByIdInput = {
  /** An object where the defined keys will be set on the `Campaign` being updated. */
  campaignPatch: CampaignPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateCampaignForModeration` mutation. */
export type UpdateCampaignForModerationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pAirdropAmount?: InputMaybe<Scalars['Int']['input']>;
  pAirdropAt?: InputMaybe<Scalars['Datetime']['input']>;
  pCampaignId?: InputMaybe<Scalars['UUID']['input']>;
  pEndAt?: InputMaybe<Scalars['Datetime']['input']>;
  pManagerNoteFromCreator?: InputMaybe<Scalars['String']['input']>;
  pRewardsMultiplier?: InputMaybe<Scalars['Int']['input']>;
  pStartAt?: InputMaybe<Scalars['Datetime']['input']>;
  pTheme?: InputMaybe<Scalars['String']['input']>;
  pTitle?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `updateCampaignForModeration` mutation. */
export type UpdateCampaignForModerationPayload = {
  __typename: 'UpdateCampaignForModerationPayload';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  campaign: Maybe<Campaign>;
  /** An edge for our `Campaign`. May be used by Relay 1. */
  campaignEdge: Maybe<CampaignsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `updateCampaignForModeration` mutation. */
export type UpdateCampaignForModerationPayloadCampaignEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};

/** All input for the `updateCampaign` mutation. */
export type UpdateCampaignInput = {
  /** An object where the defined keys will be set on the `Campaign` being updated. */
  campaignPatch: CampaignPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Campaign` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `updateCampaignModerationAuditEventById` mutation. */
export type UpdateCampaignModerationAuditEventByIdInput = {
  /** An object where the defined keys will be set on the `CampaignModerationAuditEvent` being updated. */
  campaignModerationAuditEventPatch: CampaignModerationAuditEventPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateCampaignModerationAuditEvent` mutation. */
export type UpdateCampaignModerationAuditEventInput = {
  /** An object where the defined keys will be set on the `CampaignModerationAuditEvent` being updated. */
  campaignModerationAuditEventPatch: CampaignModerationAuditEventPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignModerationAuditEvent` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `CampaignModerationAuditEvent` mutation. */
export type UpdateCampaignModerationAuditEventPayload = {
  __typename: 'UpdateCampaignModerationAuditEventPayload';
  /** Reads a single `Account` that is related to this `CampaignModerationAuditEvent`. */
  accountByActorAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationAuditEvent`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationAuditEvent` that was updated by this mutation. */
  campaignModerationAuditEvent: Maybe<CampaignModerationAuditEvent>;
  /** An edge for our `CampaignModerationAuditEvent`. May be used by Relay 1. */
  campaignModerationAuditEventEdge: Maybe<CampaignModerationAuditEventsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `CampaignModerationAuditEvent` mutation. */
export type UpdateCampaignModerationAuditEventPayloadCampaignModerationAuditEventEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationAuditEventsOrderBy>>;
};

/** All input for the `updateCampaignModerationNoteById` mutation. */
export type UpdateCampaignModerationNoteByIdInput = {
  /** An object where the defined keys will be set on the `CampaignModerationNote` being updated. */
  campaignModerationNotePatch: CampaignModerationNotePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateCampaignModerationNote` mutation. */
export type UpdateCampaignModerationNoteInput = {
  /** An object where the defined keys will be set on the `CampaignModerationNote` being updated. */
  campaignModerationNotePatch: CampaignModerationNotePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignModerationNote` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `CampaignModerationNote` mutation. */
export type UpdateCampaignModerationNotePayload = {
  __typename: 'UpdateCampaignModerationNotePayload';
  /** Reads a single `Account` that is related to this `CampaignModerationNote`. */
  accountByManagerAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignModerationNote`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignModerationNote` that was updated by this mutation. */
  campaignModerationNote: Maybe<CampaignModerationNote>;
  /** An edge for our `CampaignModerationNote`. May be used by Relay 1. */
  campaignModerationNoteEdge: Maybe<CampaignModerationNotesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `CampaignModerationNote` mutation. */
export type UpdateCampaignModerationNotePayloadCampaignModerationNoteEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignModerationNotesOrderBy>>;
};

/** All input for the `updateCampaignNeedByCampaignIdAndNeedId` mutation. */
export type UpdateCampaignNeedByCampaignIdAndNeedIdInput = {
  campaignId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `CampaignNeed` being updated. */
  campaignNeedPatch: CampaignNeedPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needId: Scalars['UUID']['input'];
};

/** All input for the `updateCampaignNeed` mutation. */
export type UpdateCampaignNeedInput = {
  /** An object where the defined keys will be set on the `CampaignNeed` being updated. */
  campaignNeedPatch: CampaignNeedPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignNeed` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `CampaignNeed` mutation. */
export type UpdateCampaignNeedPayload = {
  __typename: 'UpdateCampaignNeedPayload';
  /** Reads a single `Account` that is related to this `CampaignNeed`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignNeed`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignNeed` that was updated by this mutation. */
  campaignNeed: Maybe<CampaignNeed>;
  /** An edge for our `CampaignNeed`. May be used by Relay 1. */
  campaignNeedEdge: Maybe<CampaignNeedsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `CampaignNeed`. */
  needByNeedId: Maybe<Need>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `CampaignNeed` mutation. */
export type UpdateCampaignNeedPayloadCampaignNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignNeedsOrderBy>>;
};

/** The output of our update `Campaign` mutation. */
export type UpdateCampaignPayload = {
  __typename: 'UpdateCampaignPayload';
  /** Reads a single `Account` that is related to this `Campaign`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** The `Campaign` that was updated by this mutation. */
  campaign: Maybe<Campaign>;
  /** An edge for our `Campaign`. May be used by Relay 1. */
  campaignEdge: Maybe<CampaignsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `Campaign` mutation. */
export type UpdateCampaignPayloadCampaignEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignsOrderBy>>;
};

/** All input for the `updateCampaignResourceByCampaignIdAndResourceId` mutation. */
export type UpdateCampaignResourceByCampaignIdAndResourceIdInput = {
  campaignId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `CampaignResource` being updated. */
  campaignResourcePatch: CampaignResourcePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `updateCampaignResource` mutation. */
export type UpdateCampaignResourceInput = {
  /** An object where the defined keys will be set on the `CampaignResource` being updated. */
  campaignResourcePatch: CampaignResourcePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `CampaignResource` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `CampaignResource` mutation. */
export type UpdateCampaignResourcePayload = {
  __typename: 'UpdateCampaignResourcePayload';
  /** Reads a single `Account` that is related to this `CampaignResource`. */
  accountByActedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `CampaignResource`. */
  campaignByCampaignId: Maybe<Campaign>;
  /** The `CampaignResource` that was updated by this mutation. */
  campaignResource: Maybe<CampaignResource>;
  /** An edge for our `CampaignResource`. May be used by Relay 1. */
  campaignResourceEdge: Maybe<CampaignResourcesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `CampaignResource`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our update `CampaignResource` mutation. */
export type UpdateCampaignResourcePayloadCampaignResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<CampaignResourcesOrderBy>>;
};

/** All input for the `updateChatTypingPresenceByConversationKindAndConversationIdAndAccountId` mutation. */
export type UpdateChatTypingPresenceByConversationKindAndConversationIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ChatTypingPresence` being updated. */
  chatTypingPresencePatch: ChatTypingPresencePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['UUID']['input'];
  conversationKind: ChatContextKind;
};

/** All input for the `updateChatTypingPresence` mutation. */
export type UpdateChatTypingPresenceInput = {
  /** An object where the defined keys will be set on the `ChatTypingPresence` being updated. */
  chatTypingPresencePatch: ChatTypingPresencePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ChatTypingPresence` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `ChatTypingPresence` mutation. */
export type UpdateChatTypingPresencePayload = {
  __typename: 'UpdateChatTypingPresencePayload';
  /** Reads a single `Account` that is related to this `ChatTypingPresence`. */
  accountByAccountId: Maybe<Account>;
  /** The `ChatTypingPresence` that was updated by this mutation. */
  chatTypingPresence: Maybe<ChatTypingPresence>;
  /** An edge for our `ChatTypingPresence`. May be used by Relay 1. */
  chatTypingPresenceEdge: Maybe<ChatTypingPresencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `ChatTypingPresence` mutation. */
export type UpdateChatTypingPresencePayloadChatTypingPresenceEdgeArgs = {
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};

/** All input for the `updateClaimConversationById` mutation. */
export type UpdateClaimConversationByIdInput = {
  /** An object where the defined keys will be set on the `ClaimConversation` being updated. */
  claimConversationPatch: ClaimConversationPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId` mutation. */
export type UpdateClaimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountIdInput = {
  /** An object where the defined keys will be set on the `ClaimConversation` being updated. */
  claimConversationPatch: ClaimConversationPatch;
  claimerAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  creatorAccountId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
};

/** All input for the `updateClaimConversation` mutation. */
export type UpdateClaimConversationInput = {
  /** An object where the defined keys will be set on the `ClaimConversation` being updated. */
  claimConversationPatch: ClaimConversationPatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimConversation` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `ClaimConversation` mutation. */
export type UpdateClaimConversationPayload = {
  __typename: 'UpdateClaimConversationPayload';
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ClaimConversation`. */
  accountByCreatorAccountId: Maybe<Account>;
  /** The `ClaimConversation` that was updated by this mutation. */
  claimConversation: Maybe<ClaimConversation>;
  /** An edge for our `ClaimConversation`. May be used by Relay 1. */
  claimConversationEdge: Maybe<ClaimConversationsEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `ClaimConversation`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `ClaimConversation`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `ClaimConversation` mutation. */
export type UpdateClaimConversationPayloadClaimConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimConversationsOrderBy>>;
};

/** All input for the `updateClaimMessageById` mutation. */
export type UpdateClaimMessageByIdInput = {
  /** An object where the defined keys will be set on the `ClaimMessage` being updated. */
  claimMessagePatch: ClaimMessagePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateClaimMessageImageById` mutation. */
export type UpdateClaimMessageImageByIdInput = {
  /** An object where the defined keys will be set on the `ClaimMessageImage` being updated. */
  claimMessageImagePatch: ClaimMessageImagePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateClaimMessageImage` mutation. */
export type UpdateClaimMessageImageInput = {
  /** An object where the defined keys will be set on the `ClaimMessageImage` being updated. */
  claimMessageImagePatch: ClaimMessageImagePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimMessageImage` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `ClaimMessageImage` mutation. */
export type UpdateClaimMessageImagePayload = {
  __typename: 'UpdateClaimMessageImagePayload';
  /** Reads a single `ClaimMessage` that is related to this `ClaimMessageImage`. */
  claimMessageByMessageId: Maybe<ClaimMessage>;
  /** The `ClaimMessageImage` that was updated by this mutation. */
  claimMessageImage: Maybe<ClaimMessageImage>;
  /** An edge for our `ClaimMessageImage`. May be used by Relay 1. */
  claimMessageImageEdge: Maybe<ClaimMessageImagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `ClaimMessageImage` mutation. */
export type UpdateClaimMessageImagePayloadClaimMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessageImagesOrderBy>>;
};

/** All input for the `updateClaimMessage` mutation. */
export type UpdateClaimMessageInput = {
  /** An object where the defined keys will be set on the `ClaimMessage` being updated. */
  claimMessagePatch: ClaimMessagePatch;
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ClaimMessage` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `ClaimMessage` mutation. */
export type UpdateClaimMessagePayload = {
  __typename: 'UpdateClaimMessagePayload';
  /** Reads a single `Account` that is related to this `ClaimMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /** Reads a single `ClaimConversation` that is related to this `ClaimMessage`. */
  claimConversationByConversationId: Maybe<ClaimConversation>;
  /** The `ClaimMessage` that was updated by this mutation. */
  claimMessage: Maybe<ClaimMessage>;
  /** An edge for our `ClaimMessage`. May be used by Relay 1. */
  claimMessageEdge: Maybe<ClaimMessagesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `ClaimMessage` mutation. */
export type UpdateClaimMessagePayloadClaimMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ClaimMessagesOrderBy>>;
};

/** All input for the `updateGrantClaimByGrantIdAndAccountId` mutation. */
export type UpdateGrantClaimByGrantIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantClaim` being updated. */
  grantClaimPatch: GrantClaimPatch;
  grantId: Scalars['UUID']['input'];
};

/** All input for the `updateGrantClaimById` mutation. */
export type UpdateGrantClaimByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantClaim` being updated. */
  grantClaimPatch: GrantClaimPatch;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateGrantClaim` mutation. */
export type UpdateGrantClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantClaim` being updated. */
  grantClaimPatch: GrantClaimPatch;
  /** The globally unique `ID` which will identify a single `GrantClaim` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `GrantClaim` mutation. */
export type UpdateGrantClaimPayload = {
  __typename: 'UpdateGrantClaimPayload';
  /** Reads a single `Account` that is related to this `GrantClaim`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `GrantClaim` that was updated by this mutation. */
  grantClaim: Maybe<GrantClaim>;
  /** An edge for our `GrantClaim`. May be used by Relay 1. */
  grantClaimEdge: Maybe<GrantClaimsEdge>;
  /** Reads a single `GrantDefinition` that is related to this `GrantClaim`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `TokenMovement` that is related to this `GrantClaim`. */
  tokenMovementByTokenMovementId: Maybe<TokenMovement>;
};


/** The output of our update `GrantClaim` mutation. */
export type UpdateGrantClaimPayloadGrantClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantClaimsOrderBy>>;
};

/** All input for the `updateGrantDefinitionById` mutation. */
export type UpdateGrantDefinitionByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantDefinition` being updated. */
  grantDefinitionPatch: GrantDefinitionPatch;
  id: Scalars['UUID']['input'];
};

/** All input for the `updateGrantDefinition` mutation. */
export type UpdateGrantDefinitionInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantDefinition` being updated. */
  grantDefinitionPatch: GrantDefinitionPatch;
  /** The globally unique `ID` which will identify a single `GrantDefinition` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `GrantDefinition` mutation. */
export type UpdateGrantDefinitionPayload = {
  __typename: 'UpdateGrantDefinitionPayload';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `GrantDefinition` that was updated by this mutation. */
  grantDefinition: Maybe<GrantDefinition>;
  /** An edge for our `GrantDefinition`. May be used by Relay 1. */
  grantDefinitionEdge: Maybe<GrantDefinitionsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `GrantDefinition` mutation. */
export type UpdateGrantDefinitionPayloadGrantDefinitionEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

/** All input for the `updateGrantTargetAccountByGrantIdAndAccountId` mutation. */
export type UpdateGrantTargetAccountByGrantIdAndAccountIdInput = {
  accountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  grantId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `GrantTargetAccount` being updated. */
  grantTargetAccountPatch: GrantTargetAccountPatch;
};

/** All input for the `updateGrantTargetAccount` mutation. */
export type UpdateGrantTargetAccountInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantTargetAccount` being updated. */
  grantTargetAccountPatch: GrantTargetAccountPatch;
  /** The globally unique `ID` which will identify a single `GrantTargetAccount` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `GrantTargetAccount` mutation. */
export type UpdateGrantTargetAccountPayload = {
  __typename: 'UpdateGrantTargetAccountPayload';
  /** Reads a single `Account` that is related to this `GrantTargetAccount`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetAccount`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetAccount` that was updated by this mutation. */
  grantTargetAccount: Maybe<GrantTargetAccount>;
  /** An edge for our `GrantTargetAccount`. May be used by Relay 1. */
  grantTargetAccountEdge: Maybe<GrantTargetAccountsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `GrantTargetAccount` mutation. */
export type UpdateGrantTargetAccountPayloadGrantTargetAccountEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetAccountsOrderBy>>;
};

/** All input for the `updateGrantTargetEmailByGrantIdAndTargetEmailNormalized` mutation. */
export type UpdateGrantTargetEmailByGrantIdAndTargetEmailNormalizedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  grantId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `GrantTargetEmail` being updated. */
  grantTargetEmailPatch: GrantTargetEmailPatch;
  targetEmailNormalized: Scalars['String']['input'];
};

/** All input for the `updateGrantTargetEmail` mutation. */
export type UpdateGrantTargetEmailInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `GrantTargetEmail` being updated. */
  grantTargetEmailPatch: GrantTargetEmailPatch;
  /** The globally unique `ID` which will identify a single `GrantTargetEmail` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `GrantTargetEmail` mutation. */
export type UpdateGrantTargetEmailPayload = {
  __typename: 'UpdateGrantTargetEmailPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `GrantDefinition` that is related to this `GrantTargetEmail`. */
  grantDefinitionByGrantId: Maybe<GrantDefinition>;
  /** The `GrantTargetEmail` that was updated by this mutation. */
  grantTargetEmail: Maybe<GrantTargetEmail>;
  /** An edge for our `GrantTargetEmail`. May be used by Relay 1. */
  grantTargetEmailEdge: Maybe<GrantTargetEmailsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `GrantTargetEmail` mutation. */
export type UpdateGrantTargetEmailPayloadGrantTargetEmailEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantTargetEmailsOrderBy>>;
};

/** All input for the `updateNeedById` mutation. */
export type UpdateNeedByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `Need` being updated. */
  needPatch: NeedPatch;
};

/** All input for the `updateNeedClaimById` mutation. */
export type UpdateNeedClaimByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `NeedClaim` being updated. */
  needClaimPatch: NeedClaimPatch;
};

/** All input for the `updateNeedClaimByNeedIdAndClaimerAccountId` mutation. */
export type UpdateNeedClaimByNeedIdAndClaimerAccountIdInput = {
  claimerAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `NeedClaim` being updated. */
  needClaimPatch: NeedClaimPatch;
  needId: Scalars['UUID']['input'];
};

/** All input for the `updateNeedClaim` mutation. */
export type UpdateNeedClaimInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `NeedClaim` being updated. */
  needClaimPatch: NeedClaimPatch;
  /** The globally unique `ID` which will identify a single `NeedClaim` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** All input for the `updateNeedClaimNotificationById` mutation. */
export type UpdateNeedClaimNotificationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `NeedClaimNotification` being updated. */
  needClaimNotificationPatch: NeedClaimNotificationPatch;
};

/** All input for the `updateNeedClaimNotification` mutation. */
export type UpdateNeedClaimNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `NeedClaimNotification` being updated. */
  needClaimNotificationPatch: NeedClaimNotificationPatch;
  /** The globally unique `ID` which will identify a single `NeedClaimNotification` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `NeedClaimNotification` mutation. */
export type UpdateNeedClaimNotificationPayload = {
  __typename: 'UpdateNeedClaimNotificationPayload';
  /** Reads a single `Account` that is related to this `NeedClaimNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimNotification`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimNotification` that was updated by this mutation. */
  needClaimNotification: Maybe<NeedClaimNotification>;
  /** An edge for our `NeedClaimNotification`. May be used by Relay 1. */
  needClaimNotificationEdge: Maybe<NeedClaimNotificationsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `NeedClaimNotification` mutation. */
export type UpdateNeedClaimNotificationPayloadNeedClaimNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimNotificationsOrderBy>>;
};

/** The output of our update `NeedClaim` mutation. */
export type UpdateNeedClaimPayload = {
  __typename: 'UpdateNeedClaimPayload';
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaim`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaim`. */
  needByNeedId: Maybe<Need>;
  /** The `NeedClaim` that was updated by this mutation. */
  needClaim: Maybe<NeedClaim>;
  /** An edge for our `NeedClaim`. May be used by Relay 1. */
  needClaimEdge: Maybe<NeedClaimsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `NeedClaim` mutation. */
export type UpdateNeedClaimPayloadNeedClaimEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimsOrderBy>>;
};

/** All input for the `updateNeedClaimSettlementEventById` mutation. */
export type UpdateNeedClaimSettlementEventByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `NeedClaimSettlementEvent` being updated. */
  needClaimSettlementEventPatch: NeedClaimSettlementEventPatch;
};

/** All input for the `updateNeedClaimSettlementEventByNeedClaimId` mutation. */
export type UpdateNeedClaimSettlementEventByNeedClaimIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  needClaimId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `NeedClaimSettlementEvent` being updated. */
  needClaimSettlementEventPatch: NeedClaimSettlementEventPatch;
};

/** All input for the `updateNeedClaimSettlementEvent` mutation. */
export type UpdateNeedClaimSettlementEventInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `NeedClaimSettlementEvent` being updated. */
  needClaimSettlementEventPatch: NeedClaimSettlementEventPatch;
  /** The globally unique `ID` which will identify a single `NeedClaimSettlementEvent` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `NeedClaimSettlementEvent` mutation. */
export type UpdateNeedClaimSettlementEventPayload = {
  __typename: 'UpdateNeedClaimSettlementEventPayload';
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountByClaimerAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `NeedClaimSettlementEvent`. */
  accountBySettledByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Reads a single `Need` that is related to this `NeedClaimSettlementEvent`. */
  needByNeedId: Maybe<Need>;
  /** Reads a single `NeedClaim` that is related to this `NeedClaimSettlementEvent`. */
  needClaimByNeedClaimId: Maybe<NeedClaim>;
  /** The `NeedClaimSettlementEvent` that was updated by this mutation. */
  needClaimSettlementEvent: Maybe<NeedClaimSettlementEvent>;
  /** An edge for our `NeedClaimSettlementEvent`. May be used by Relay 1. */
  needClaimSettlementEventEdge: Maybe<NeedClaimSettlementEventsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `NeedClaimSettlementEvent` mutation. */
export type UpdateNeedClaimSettlementEventPayloadNeedClaimSettlementEventEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedClaimSettlementEventsOrderBy>>;
};

/** All input for the `updateNeed` mutation. */
export type UpdateNeedInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `Need` being updated. */
  needPatch: NeedPatch;
  /** The globally unique `ID` which will identify a single `Need` to be updated. */
  nodeId: Scalars['ID']['input'];
};

/** The output of our update `Need` mutation. */
export type UpdateNeedPayload = {
  __typename: 'UpdateNeedPayload';
  /** Reads a single `Account` that is related to this `Need`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `Need` that was updated by this mutation. */
  need: Maybe<Need>;
  /** An edge for our `Need`. May be used by Relay 1. */
  needEdge: Maybe<NeedsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `Need` mutation. */
export type UpdateNeedPayloadNeedEdgeArgs = {
  orderBy?: InputMaybe<Array<NeedsOrderBy>>;
};

/** All input for the `updateOperationalLogById` mutation. */
export type UpdateOperationalLogByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `OperationalLog` being updated. */
  operationalLogPatch: OperationalLogPatch;
};

/** All input for the `updateOperationalLog` mutation. */
export type UpdateOperationalLogInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `OperationalLog` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `OperationalLog` being updated. */
  operationalLogPatch: OperationalLogPatch;
};

/** The output of our update `OperationalLog` mutation. */
export type UpdateOperationalLogPayload = {
  __typename: 'UpdateOperationalLogPayload';
  /** Reads a single `Account` that is related to this `OperationalLog`. */
  accountByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** The `OperationalLog` that was updated by this mutation. */
  operationalLog: Maybe<OperationalLog>;
  /** An edge for our `OperationalLog`. May be used by Relay 1. */
  operationalLogEdge: Maybe<OperationalLogsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our update `OperationalLog` mutation. */
export type UpdateOperationalLogPayloadOperationalLogEdgeArgs = {
  orderBy?: InputMaybe<Array<OperationalLogsOrderBy>>;
};

/** All input for the `updateResourceBidById` mutation. */
export type UpdateResourceBidByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceBid` being updated. */
  resourceBidPatch: ResourceBidPatch;
};

/** All input for the `updateResourceBidByResourceIdAndBidderAccountId` mutation. */
export type UpdateResourceBidByResourceIdAndBidderAccountIdInput = {
  bidderAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `ResourceBid` being updated. */
  resourceBidPatch: ResourceBidPatch;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `updateResourceBid` mutation. */
export type UpdateResourceBidInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceBid` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceBid` being updated. */
  resourceBidPatch: ResourceBidPatch;
};

/** All input for the `updateResourceBidNotificationById` mutation. */
export type UpdateResourceBidNotificationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceBidNotification` being updated. */
  resourceBidNotificationPatch: ResourceBidNotificationPatch;
};

/** All input for the `updateResourceBidNotification` mutation. */
export type UpdateResourceBidNotificationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceBidNotification` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceBidNotification` being updated. */
  resourceBidNotificationPatch: ResourceBidNotificationPatch;
};

/** The output of our update `ResourceBidNotification` mutation. */
export type UpdateResourceBidNotificationPayload = {
  __typename: 'UpdateResourceBidNotificationPayload';
  /** Reads a single `Account` that is related to this `ResourceBidNotification`. */
  accountByRecipientAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceBidNotification`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** The `ResourceBidNotification` that was updated by this mutation. */
  resourceBidNotification: Maybe<ResourceBidNotification>;
  /** An edge for our `ResourceBidNotification`. May be used by Relay 1. */
  resourceBidNotificationEdge: Maybe<ResourceBidNotificationsEdge>;
};


/** The output of our update `ResourceBidNotification` mutation. */
export type UpdateResourceBidNotificationPayloadResourceBidNotificationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidNotificationsOrderBy>>;
};

/** The output of our update `ResourceBid` mutation. */
export type UpdateResourceBidPayload = {
  __typename: 'UpdateResourceBidPayload';
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceBid`. */
  accountByRespondedByAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceBid` that was updated by this mutation. */
  resourceBid: Maybe<ResourceBid>;
  /** An edge for our `ResourceBid`. May be used by Relay 1. */
  resourceBidEdge: Maybe<ResourceBidsEdge>;
  /** Reads a single `Resource` that is related to this `ResourceBid`. */
  resourceByResourceId: Maybe<Resource>;
};


/** The output of our update `ResourceBid` mutation. */
export type UpdateResourceBidPayloadResourceBidEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceBidsOrderBy>>;
};

/** All input for the `updateResourceById` mutation. */
export type UpdateResourceByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `Resource` being updated. */
  resourcePatch: ResourcePatch;
};

/** All input for the `updateResourceCategoryAssignmentByResourceIdAndCategoryCode` mutation. */
export type UpdateResourceCategoryAssignmentByResourceIdAndCategoryCodeInput = {
  categoryCode: Scalars['Int']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `ResourceCategoryAssignment` being updated. */
  resourceCategoryAssignmentPatch: ResourceCategoryAssignmentPatch;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `updateResourceCategoryAssignment` mutation. */
export type UpdateResourceCategoryAssignmentInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceCategoryAssignment` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceCategoryAssignment` being updated. */
  resourceCategoryAssignmentPatch: ResourceCategoryAssignmentPatch;
};

/** The output of our update `ResourceCategoryAssignment` mutation. */
export type UpdateResourceCategoryAssignmentPayload = {
  __typename: 'UpdateResourceCategoryAssignmentPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `Resource` that is related to this `ResourceCategoryAssignment`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceCategoryAssignment` that was updated by this mutation. */
  resourceCategoryAssignment: Maybe<ResourceCategoryAssignment>;
  /** An edge for our `ResourceCategoryAssignment`. May be used by Relay 1. */
  resourceCategoryAssignmentEdge: Maybe<ResourceCategoryAssignmentsEdge>;
  /** Reads a single `ResourceCategory` that is related to this `ResourceCategoryAssignment`. */
  resourceCategoryByCategoryCode: Maybe<ResourceCategory>;
};


/** The output of our update `ResourceCategoryAssignment` mutation. */
export type UpdateResourceCategoryAssignmentPayloadResourceCategoryAssignmentEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoryAssignmentsOrderBy>>;
};

/** All input for the `updateResourceCategoryByCode` mutation. */
export type UpdateResourceCategoryByCodeInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  code: Scalars['Int']['input'];
  /** An object where the defined keys will be set on the `ResourceCategory` being updated. */
  resourceCategoryPatch: ResourceCategoryPatch;
};

/** All input for the `updateResourceCategoryBySlug` mutation. */
export type UpdateResourceCategoryBySlugInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** An object where the defined keys will be set on the `ResourceCategory` being updated. */
  resourceCategoryPatch: ResourceCategoryPatch;
  slug: Scalars['String']['input'];
};

/** All input for the `updateResourceCategory` mutation. */
export type UpdateResourceCategoryInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceCategory` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceCategory` being updated. */
  resourceCategoryPatch: ResourceCategoryPatch;
};

/** The output of our update `ResourceCategory` mutation. */
export type UpdateResourceCategoryPayload = {
  __typename: 'UpdateResourceCategoryPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `ResourceCategory` that was updated by this mutation. */
  resourceCategory: Maybe<ResourceCategory>;
  /** An edge for our `ResourceCategory`. May be used by Relay 1. */
  resourceCategoryEdge: Maybe<ResourceCategoriesEdge>;
};


/** The output of our update `ResourceCategory` mutation. */
export type UpdateResourceCategoryPayloadResourceCategoryEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceCategoriesOrderBy>>;
};

/** All input for the `updateResourceConversationById` mutation. */
export type UpdateResourceConversationByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceConversation` being updated. */
  resourceConversationPatch: ResourceConversationPatch;
};

/** All input for the `updateResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId` mutation. */
export type UpdateResourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountIdInput = {
  bidderAccountId: Scalars['UUID']['input'];
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  ownerAccountId: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceConversation` being updated. */
  resourceConversationPatch: ResourceConversationPatch;
  resourceId: Scalars['UUID']['input'];
};

/** All input for the `updateResourceConversation` mutation. */
export type UpdateResourceConversationInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceConversation` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceConversation` being updated. */
  resourceConversationPatch: ResourceConversationPatch;
};

/** The output of our update `ResourceConversation` mutation. */
export type UpdateResourceConversationPayload = {
  __typename: 'UpdateResourceConversationPayload';
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByBidderAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `ResourceConversation`. */
  accountByOwnerAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceBid` that is related to this `ResourceConversation`. */
  resourceBidByResourceBidId: Maybe<ResourceBid>;
  /** Reads a single `Resource` that is related to this `ResourceConversation`. */
  resourceByResourceId: Maybe<Resource>;
  /** The `ResourceConversation` that was updated by this mutation. */
  resourceConversation: Maybe<ResourceConversation>;
  /** An edge for our `ResourceConversation`. May be used by Relay 1. */
  resourceConversationEdge: Maybe<ResourceConversationsEdge>;
};


/** The output of our update `ResourceConversation` mutation. */
export type UpdateResourceConversationPayloadResourceConversationEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceConversationsOrderBy>>;
};

/** All input for the `updateResource` mutation. */
export type UpdateResourceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `Resource` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `Resource` being updated. */
  resourcePatch: ResourcePatch;
};

/** All input for the `updateResourceMessageById` mutation. */
export type UpdateResourceMessageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceMessage` being updated. */
  resourceMessagePatch: ResourceMessagePatch;
};

/** All input for the `updateResourceMessageImageById` mutation. */
export type UpdateResourceMessageImageByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `ResourceMessageImage` being updated. */
  resourceMessageImagePatch: ResourceMessageImagePatch;
};

/** All input for the `updateResourceMessageImage` mutation. */
export type UpdateResourceMessageImageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceMessageImage` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceMessageImage` being updated. */
  resourceMessageImagePatch: ResourceMessageImagePatch;
};

/** The output of our update `ResourceMessageImage` mutation. */
export type UpdateResourceMessageImagePayload = {
  __typename: 'UpdateResourceMessageImagePayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceMessage` that is related to this `ResourceMessageImage`. */
  resourceMessageByMessageId: Maybe<ResourceMessage>;
  /** The `ResourceMessageImage` that was updated by this mutation. */
  resourceMessageImage: Maybe<ResourceMessageImage>;
  /** An edge for our `ResourceMessageImage`. May be used by Relay 1. */
  resourceMessageImageEdge: Maybe<ResourceMessageImagesEdge>;
};


/** The output of our update `ResourceMessageImage` mutation. */
export type UpdateResourceMessageImagePayloadResourceMessageImageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessageImagesOrderBy>>;
};

/** All input for the `updateResourceMessage` mutation. */
export type UpdateResourceMessageInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `ResourceMessage` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `ResourceMessage` being updated. */
  resourceMessagePatch: ResourceMessagePatch;
};

/** The output of our update `ResourceMessage` mutation. */
export type UpdateResourceMessagePayload = {
  __typename: 'UpdateResourceMessagePayload';
  /** Reads a single `Account` that is related to this `ResourceMessage`. */
  accountBySenderAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** Reads a single `ResourceConversation` that is related to this `ResourceMessage`. */
  resourceConversationByConversationId: Maybe<ResourceConversation>;
  /** The `ResourceMessage` that was updated by this mutation. */
  resourceMessage: Maybe<ResourceMessage>;
  /** An edge for our `ResourceMessage`. May be used by Relay 1. */
  resourceMessageEdge: Maybe<ResourceMessagesEdge>;
};


/** The output of our update `ResourceMessage` mutation. */
export type UpdateResourceMessagePayloadResourceMessageEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourceMessagesOrderBy>>;
};

/** The output of our update `Resource` mutation. */
export type UpdateResourcePayload = {
  __typename: 'UpdateResourcePayload';
  /** Reads a single `Account` that is related to this `Resource`. */
  accountByCreatorAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `Resource` that was updated by this mutation. */
  resource: Maybe<Resource>;
  /** An edge for our `Resource`. May be used by Relay 1. */
  resourceEdge: Maybe<ResourcesEdge>;
};


/** The output of our update `Resource` mutation. */
export type UpdateResourcePayloadResourceEdgeArgs = {
  orderBy?: InputMaybe<Array<ResourcesOrderBy>>;
};

/** All input for the `updateSystemSettingByKey` mutation. */
export type UpdateSystemSettingByKeyInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  key: Scalars['String']['input'];
  /** An object where the defined keys will be set on the `SystemSetting` being updated. */
  systemSettingPatch: SystemSettingPatch;
};

/** All input for the `updateSystemSetting` mutation. */
export type UpdateSystemSettingInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `SystemSetting` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `SystemSetting` being updated. */
  systemSettingPatch: SystemSettingPatch;
};

/** The output of our update `SystemSetting` mutation. */
export type UpdateSystemSettingPayload = {
  __typename: 'UpdateSystemSettingPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `SystemSetting` that was updated by this mutation. */
  systemSetting: Maybe<SystemSetting>;
  /** An edge for our `SystemSetting`. May be used by Relay 1. */
  systemSettingEdge: Maybe<SystemSettingsEdge>;
};


/** The output of our update `SystemSetting` mutation. */
export type UpdateSystemSettingPayloadSystemSettingEdgeArgs = {
  orderBy?: InputMaybe<Array<SystemSettingsOrderBy>>;
};

/** All input for the `updateTokenMovementById` mutation. */
export type UpdateTokenMovementByIdInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['UUID']['input'];
  /** An object where the defined keys will be set on the `TokenMovement` being updated. */
  tokenMovementPatch: TokenMovementPatch;
};

/** All input for the `updateTokenMovementByIdempotencyKey` mutation. */
export type UpdateTokenMovementByIdempotencyKeyInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  idempotencyKey: Scalars['String']['input'];
  /** An object where the defined keys will be set on the `TokenMovement` being updated. */
  tokenMovementPatch: TokenMovementPatch;
};

/** All input for the `updateTokenMovement` mutation. */
export type UpdateTokenMovementInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  /** The globally unique `ID` which will identify a single `TokenMovement` to be updated. */
  nodeId: Scalars['ID']['input'];
  /** An object where the defined keys will be set on the `TokenMovement` being updated. */
  tokenMovementPatch: TokenMovementPatch;
};

/** The output of our update `TokenMovement` mutation. */
export type UpdateTokenMovementPayload = {
  __typename: 'UpdateTokenMovementPayload';
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByAccountId: Maybe<Account>;
  /** Reads a single `Account` that is related to this `TokenMovement`. */
  accountByCounterpartyAccountId: Maybe<Account>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  /** The `TokenMovement` that was updated by this mutation. */
  tokenMovement: Maybe<TokenMovement>;
  /** An edge for our `TokenMovement`. May be used by Relay 1. */
  tokenMovementEdge: Maybe<TokenMovementsEdge>;
};


/** The output of our update `TokenMovement` mutation. */
export type UpdateTokenMovementPayloadTokenMovementEdgeArgs = {
  orderBy?: InputMaybe<Array<TokenMovementsOrderBy>>;
};

/** All input for the `upsertChatTypingPresence` mutation. */
export type UpsertChatTypingPresenceInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pConversationId?: InputMaybe<Scalars['UUID']['input']>;
  pConversationKind?: InputMaybe<ChatContextKind>;
};

/** The output of our `upsertChatTypingPresence` mutation. */
export type UpsertChatTypingPresencePayload = {
  __typename: 'UpsertChatTypingPresencePayload';
  /** Reads a single `Account` that is related to this `ChatTypingPresence`. */
  accountByAccountId: Maybe<Account>;
  chatTypingPresence: Maybe<ChatTypingPresence>;
  /** An edge for our `ChatTypingPresence`. May be used by Relay 1. */
  chatTypingPresenceEdge: Maybe<ChatTypingPresencesEdge>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `upsertChatTypingPresence` mutation. */
export type UpsertChatTypingPresencePayloadChatTypingPresenceEdgeArgs = {
  orderBy?: InputMaybe<Array<ChatTypingPresencesOrderBy>>;
};

/** All input for the `upsertGrant` mutation. */
export type UpsertGrantInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pArchivedAt?: InputMaybe<Scalars['Datetime']['input']>;
  pAwardedTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  pDescription?: InputMaybe<Scalars['String']['input']>;
  pExpiresAt?: InputMaybe<Scalars['Datetime']['input']>;
  pGrantId?: InputMaybe<Scalars['UUID']['input']>;
  pLinkedCampaignId?: InputMaybe<Scalars['UUID']['input']>;
  pMaxSuccessfulClaimCount?: InputMaybe<Scalars['Int']['input']>;
  pTargetAccountIds?: InputMaybe<Array<InputMaybe<Scalars['UUID']['input']>>>;
  pTargetEmails?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  pTitle?: InputMaybe<Scalars['String']['input']>;
};

/** The output of our `upsertGrant` mutation. */
export type UpsertGrantPayload = {
  __typename: 'UpsertGrantPayload';
  /** Reads a single `Account` that is related to this `GrantDefinition`. */
  accountByCreatedByAccountId: Maybe<Account>;
  /** Reads a single `Campaign` that is related to this `GrantDefinition`. */
  campaignByLinkedCampaignId: Maybe<Campaign>;
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  grantDefinition: Maybe<GrantDefinition>;
  /** An edge for our `GrantDefinition`. May be used by Relay 1. */
  grantDefinitionEdge: Maybe<GrantDefinitionsEdge>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
};


/** The output of our `upsertGrant` mutation. */
export type UpsertGrantPayloadGrantDefinitionEdgeArgs = {
  orderBy?: InputMaybe<Array<GrantDefinitionsOrderBy>>;
};

/** All input for the `writeOperationalLog` mutation. */
export type WriteOperationalLogInput = {
  /**
   * An arbitrary string value with no semantic meaning. Will be included in the
   * payload verbatim. May be used to track mutations by the client.
   */
  clientMutationId?: InputMaybe<Scalars['String']['input']>;
  pAccountId?: InputMaybe<Scalars['UUID']['input']>;
  pComponent?: InputMaybe<Scalars['String']['input']>;
  pContext?: InputMaybe<Scalars['String']['input']>;
  pLevel?: InputMaybe<Scalars['String']['input']>;
  pMessage?: InputMaybe<Scalars['String']['input']>;
  pMetadata?: InputMaybe<Scalars['JSON']['input']>;
};

/** The output of our `writeOperationalLog` mutation. */
export type WriteOperationalLogPayload = {
  __typename: 'WriteOperationalLogPayload';
  /**
   * The exact same `clientMutationId` that was provided in the mutation input,
   * unchanged and unused. May be used by a client to track mutations.
   */
  clientMutationId: Maybe<Scalars['String']['output']>;
  /** Our root query field type. Allows us to run any query from our mutation payload. */
  query: Maybe<Query>;
  uuid: Maybe<Scalars['UUID']['output']>;
};

export type AdminListAccountsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListAccountsQuery = { __typename: 'Query', adminListAccounts: { __typename: 'AdminListAccountsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListAccountsRecord', id: any | null, name: string | null, email: string | null, language: string | null, tokenAmount: number | null, createdAt: any | null, address: string | null }> } | null };

export type AdminListBidsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListBidsQuery = { __typename: 'Query', adminListBids: { __typename: 'AdminListBidsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListBidsRecord', id: any | null, bidderName: string | null, receiverName: string | null, resourceTitle: string | null, intensity: NeedIntensity | null, tokenAmount: number | null, status: ResourceBidStatus | null, createdAt: any | null, expirationDatetime: any | null }> } | null };

export type AdminListResourcesQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListResourcesQuery = { __typename: 'Query', adminListResources: { __typename: 'AdminListResourcesConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListResourcesRecord', id: any | null, title: string | null, creatorName: string | null, intensity: NeedIntensity | null, tokenAmount: number | null, imageCount: number | null, location: string | null, createdAt: any | null, expirationDatetime: any | null }> } | null };

export type AdminListNotificationsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListNotificationsQuery = { __typename: 'Query', adminListNotifications: { __typename: 'AdminListNotificationsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListNotificationsRecord', id: any | null, accountName: string | null, data: any | null, createdAt: any | null, readAt: any | null }> } | null };

export type AdminListMailsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListMailsQuery = { __typename: 'Query', adminListMails: { __typename: 'AdminListMailsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListMailsRecord', id: any | null, email: string | null, subject: string | null, recipientAccountName: string | null, createdAt: any | null }> } | null };

export type AdminListCampaignsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pStatus?: InputMaybe<CampaignModerationStatus>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListCampaignsQuery = { __typename: 'Query', adminListCampaigns: { __typename: 'AdminListCampaignsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListCampaignsRecord', id: any | null, creatorName: string | null, summary: string | null, description: string | null, moderationStatus: CampaignModerationStatus | null, airdropDatetime: any | null, airdropTokenAmount: number | null, beginDatetime: any | null, endDatetime: any | null, resourceRewardsMultiplier: number | null, createdAt: any | null }> } | null };

export type AdminListGrantsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListGrantsQuery = { __typename: 'Query', adminListGrants: { __typename: 'AdminListGrantsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListGrantsRecord', id: any | null, title: string | null, description: string | null, expirationDatetime: any | null, amountGranted: number | null, createdAt: any | null }> } | null };

export type AdminListLogsQueryVariables = Exact<{
  pSearch?: InputMaybe<Scalars['String']['input']>;
  pLimit?: InputMaybe<Scalars['Int']['input']>;
  pOffset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AdminListLogsQuery = { __typename: 'Query', adminListLogs: { __typename: 'AdminListLogsConnection', totalCount: number, nodes: Array<{ __typename: 'AdminListLogsRecord', component: string | null, severity: string | null, message: string | null, context: string | null, timestamp: any | null }> } | null };

export type AdminGetMailContentMutationVariables = Exact<{
  pMailId: Scalars['UUID']['input'];
}>;


export type AdminGetMailContentMutation = { __typename: 'Mutation', adminGetMailContent: { __typename: 'AdminGetMailContentPayload', string: string | null } | null };

export type AdminResendMailMutationVariables = Exact<{
  pMailId: Scalars['UUID']['input'];
}>;


export type AdminResendMailMutation = { __typename: 'Mutation', adminResendMail: { __typename: 'AdminResendMailPayload', clientMutationId: string | null } | null };

export type AdminCreateGrantMutationVariables = Exact<{
  pTitle: Scalars['String']['input'];
  pDescription?: InputMaybe<Scalars['String']['input']>;
  pAwardedTokenAmount: Scalars['Int']['input'];
  pMaxSuccessfulClaimCount?: InputMaybe<Scalars['Int']['input']>;
  pExpiresAt: Scalars['Datetime']['input'];
  pLinkedCampaignId?: InputMaybe<Scalars['UUID']['input']>;
  pTargetEmails?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type AdminCreateGrantMutation = { __typename: 'Mutation', upsertGrant: { __typename: 'UpsertGrantPayload', grantDefinition: { __typename: 'GrantDefinition', id: any, title: string, createdAt: any } | null } | null };

export type AuthSessionQueryVariables = Exact<{ [key: string]: never; }>;


export type AuthSessionQuery = { __typename: 'Query', authSession: { __typename: 'AuthSessionPayload', authenticated: boolean, role: string, expiresAt: string | null, account: { __typename: 'AuthSessionAccount', id: string, displayName: string | null, externalSubject: string, avatarUrl: string | null, emailVerified: boolean, preferredLanguage: string } | null } };

export type AuthLoginMutationVariables = Exact<{
  identifier: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type AuthLoginMutation = { __typename: 'Mutation', authLogin: { __typename: 'AuthLoginPayload', authSession: { __typename: 'AuthSessionPayload', authenticated: boolean, role: string, expiresAt: string | null, account: { __typename: 'AuthSessionAccount', id: string, displayName: string | null, externalSubject: string, avatarUrl: string | null, emailVerified: boolean, preferredLanguage: string } | null } } | null };

export type AuthLogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type AuthLogoutMutation = { __typename: 'Mutation', authLogout: { __typename: 'AuthLogoutPayload', authSession: { __typename: 'AuthSessionPayload', authenticated: boolean, role: string, expiresAt: string | null, account: { __typename: 'AuthSessionAccount', id: string, displayName: string | null, externalSubject: string, avatarUrl: string | null, emailVerified: boolean, preferredLanguage: string } | null } } | null };

export type AuthChangePasswordMutationVariables = Exact<{
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
}>;


export type AuthChangePasswordMutation = { __typename: 'Mutation', authChangePassword: { __typename: 'AuthChangePasswordPayload', authSession: { __typename: 'AuthSessionPayload', authenticated: boolean, role: string, expiresAt: string | null, account: { __typename: 'AuthSessionAccount', id: string, displayName: string | null, externalSubject: string, avatarUrl: string | null, emailVerified: boolean } | null } } | null };

export type RegisterLocalAccountWithPasswordMutationVariables = Exact<{
  identifier: Scalars['String']['input'];
  displayName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  verificationTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
  preferredLanguage?: InputMaybe<Scalars['String']['input']>;
}>;


export type RegisterLocalAccountWithPasswordMutation = { __typename: 'Mutation', registerLocalAccountWithPassword: { __typename: 'RegisterLocalAccountWithPasswordPayload', boolean: boolean | null } | null };

export type RequestEmailVerificationMutationVariables = Exact<{
  identifier: Scalars['String']['input'];
  verificationTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
  throttleMs?: InputMaybe<Scalars['BigInt']['input']>;
}>;


export type RequestEmailVerificationMutation = { __typename: 'Mutation', requestEmailVerification: { __typename: 'RequestEmailVerificationPayload', boolean: boolean | null } | null };

export type ConfirmEmailVerificationMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type ConfirmEmailVerificationMutation = { __typename: 'Mutation', confirmEmailVerification: { __typename: 'ConfirmEmailVerificationPayload', boolean: boolean | null } | null };

export type RequestPasswordResetMutationVariables = Exact<{
  identifier: Scalars['String']['input'];
  resetTtlMs?: InputMaybe<Scalars['BigInt']['input']>;
  throttleMs?: InputMaybe<Scalars['BigInt']['input']>;
}>;


export type RequestPasswordResetMutation = { __typename: 'Mutation', requestPasswordReset: { __typename: 'RequestPasswordResetPayload', boolean: boolean | null } | null };

export type ConfirmPasswordResetWithPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  nextPassword: Scalars['String']['input'];
}>;


export type ConfirmPasswordResetWithPasswordMutation = { __typename: 'Mutation', confirmPasswordResetWithPassword: { __typename: 'ConfirmPasswordResetWithPasswordPayload', boolean: boolean | null } | null };

export type AddCampaignModerationNoteMutationVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
  body: Scalars['String']['input'];
}>;


export type AddCampaignModerationNoteMutation = { __typename: 'Mutation', addCampaignModerationNote: { __typename: 'AddCampaignModerationNotePayload', campaignModerationNote: { __typename: 'CampaignModerationNote', id: any, campaignId: any, managerAccountId: any, body: string, createdAt: any } | null } | null };

export type CampaignModerationHistoryQueryVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
}>;


export type CampaignModerationHistoryQuery = { __typename: 'Query', campaignModerationEvents: { __typename: 'CampaignModerationEventsConnection', nodes: Array<{ __typename: 'CampaignModerationEventsRecord', eventType: string | null, body: string | null, actorAccountId: any | null, createdAt: any | null }> } | null };

export type UpdateCampaignForModerationMutationVariables = Exact<{
  pCampaignId: Scalars['UUID']['input'];
  pTitle: Scalars['String']['input'];
  pTheme: Scalars['String']['input'];
  pManagerNoteFromCreator?: InputMaybe<Scalars['String']['input']>;
  pRewardsMultiplier: Scalars['Int']['input'];
  pAirdropAmount: Scalars['Int']['input'];
  pStartAt: Scalars['Datetime']['input'];
  pAirdropAt: Scalars['Datetime']['input'];
  pEndAt: Scalars['Datetime']['input'];
}>;


export type UpdateCampaignForModerationMutation = { __typename: 'Mutation', updateCampaignForModeration: { __typename: 'UpdateCampaignForModerationPayload', campaign: { __typename: 'Campaign', id: any, title: string, theme: string, managerNoteFromCreator: string | null, rewardsMultiplier: number, airdropAmount: number, startAt: any, airdropAt: any, endAt: any, moderationStatus: CampaignModerationStatus, createdAt: any } | null } | null };

export type CampaignModerationDetailsQueryVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
}>;


export type CampaignModerationDetailsQuery = { __typename: 'Query', campaignById: { __typename: 'Campaign', id: any, title: string, theme: string, managerNoteFromCreator: string | null, rewardsMultiplier: number, airdropAmount: number, startAt: any, airdropAt: any, endAt: any, moderationStatus: CampaignModerationStatus, createdAt: any } | null };

export type CampaignNeedTriageQueryVariables = Exact<{
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
}>;


export type CampaignNeedTriageQuery = { __typename: 'Query', allCampaignNeeds: { __typename: 'CampaignNeedsConnection', nodes: Array<{ __typename: 'CampaignNeed', campaignId: any, needId: any, status: CampaignNeedStatus, createdAt: any, actedAt: any | null, actedByAccountId: any | null, campaignByCampaignId: { __typename: 'Campaign', id: any, title: string } | null, needByNeedId: { __typename: 'Need', id: any, title: string, location: string, intensity: NeedIntensity, proposedTopesAmount: number | null } | null }> } | null };

export type AcceptCampaignNeedMutationVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
}>;


export type AcceptCampaignNeedMutation = { __typename: 'Mutation', acceptCampaignNeed: { __typename: 'AcceptCampaignNeedPayload', campaignNeed: { __typename: 'CampaignNeed', campaignId: any, needId: any, status: CampaignNeedStatus, actedByAccountId: any | null, actedAt: any | null } | null } | null };

export type RejectCampaignNeedMutationVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
  needId: Scalars['UUID']['input'];
}>;


export type RejectCampaignNeedMutation = { __typename: 'Mutation', rejectCampaignNeed: { __typename: 'RejectCampaignNeedPayload', campaignNeed: { __typename: 'CampaignNeed', campaignId: any, needId: any, status: CampaignNeedStatus, actedByAccountId: any | null, actedAt: any | null } | null } | null };

export type CreateCampaignMutationVariables = Exact<{
  title: Scalars['String']['input'];
  theme: Scalars['String']['input'];
  managerNoteFromCreator?: InputMaybe<Scalars['String']['input']>;
  rewardsMultiplier: Scalars['Int']['input'];
  airdropAmount: Scalars['Int']['input'];
  startAt: Scalars['Datetime']['input'];
  airdropAt: Scalars['Datetime']['input'];
  endAt: Scalars['Datetime']['input'];
}>;


export type CreateCampaignMutation = { __typename: 'Mutation', createCampaign: { __typename: 'CreateCampaignPayload', campaign: { __typename: 'Campaign', id: any, title: string, moderationStatus: CampaignModerationStatus, startAt: any, airdropAt: any, endAt: any } | null } | null };

export type MyCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: any, title: string, moderationStatus: CampaignModerationStatus, startAt: any, endAt: any }> } | null };

export type PublicCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type PublicCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: any, title: string, theme: string, moderationStatus: CampaignModerationStatus, startAt: any, airdropAt: any, endAt: any }> } | null };

export type ApproveCampaignMutationVariables = Exact<{
  campaignId: Scalars['UUID']['input'];
}>;


export type ApproveCampaignMutation = { __typename: 'Mutation', approveCampaign: { __typename: 'ApproveCampaignPayload', campaign: { __typename: 'Campaign', id: any, moderationStatus: CampaignModerationStatus } | null } | null };

export type MyCampaignsConnectionQueryVariables = Exact<{
  creatorAccountId: Scalars['UUID']['input'];
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyCampaignsConnectionQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: any, title: string, theme: string, moderationStatus: CampaignModerationStatus, startAt: any, airdropAt: any, endAt: any, createdAt: any }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: any | null } } | null };

export type InspirationCampaignsQueryVariables = Exact<{ [key: string]: never; }>;


export type InspirationCampaignsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: any, title: string, theme: string, moderationStatus: CampaignModerationStatus, startAt: any, airdropAt: any, endAt: any, createdAt: any }> } | null };

export type ListChatConversationsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ListChatConversationsQuery = { __typename: 'Query', listChatConversations: { __typename: 'ListChatConversationsConnection', nodes: Array<{ __typename: 'ListChatConversationsRecord', conversationKind: ChatContextKind | null, conversationId: any | null, contextId: any | null, contextTitle: string | null, otherAccountId: any | null, otherAccountDisplayName: string | null, lastMessagePreview: string | null, unreadCount: number | null, lastActivityAt: any | null }> } | null };

export type CountChatConversationsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type CountChatConversationsQuery = { __typename: 'Query', countChatConversations: number | null };

export type ChatResourceConversationQueryVariables = Exact<{
  conversationId: Scalars['UUID']['input'];
}>;


export type ChatResourceConversationQuery = { __typename: 'Query', resourceConversationById: { __typename: 'ResourceConversation', id: any, resourceBidId: any | null, resourceId: any, ownerAccountId: any, bidderAccountId: any, createdAt: any, updatedAt: any, resourceByResourceId: { __typename: 'Resource', id: any, title: string } | null, resourceMessagesByConversationId: { __typename: 'ResourceMessagesConnection', nodes: Array<{ __typename: 'ResourceMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any, readAt: any | null, resourceMessageImagesByMessageId: { __typename: 'ResourceMessageImagesConnection', nodes: Array<{ __typename: 'ResourceMessageImage', id: any, imageUrl: string, sortOrder: number }> } }> } } | null };

export type ResourceConversationLookupQueryVariables = Exact<{
  resourceId: Scalars['UUID']['input'];
  ownerAccountId: Scalars['UUID']['input'];
  bidderAccountId: Scalars['UUID']['input'];
}>;


export type ResourceConversationLookupQuery = { __typename: 'Query', resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: { __typename: 'ResourceConversation', id: any } | null };

export type SendResourceMessageMutationVariables = Exact<{
  input: SendResourceMessageInput;
}>;


export type SendResourceMessageMutation = { __typename: 'Mutation', sendResourceMessage: { __typename: 'SendResourceMessagePayload', resourceMessage: { __typename: 'ResourceMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any } | null } | null };

export type SendResourceMessageDirectMutationVariables = Exact<{
  input: SendResourceMessageDirectInput;
}>;


export type SendResourceMessageDirectMutation = { __typename: 'Mutation', sendResourceMessageDirect: { __typename: 'SendResourceMessageDirectPayload', resourceMessage: { __typename: 'ResourceMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any } | null } | null };

export type SendNeedMessageMutationVariables = Exact<{
  input: SendNeedMessageInput;
}>;


export type SendNeedMessageMutation = { __typename: 'Mutation', sendNeedMessage: { __typename: 'SendNeedMessagePayload', claimMessage: { __typename: 'ClaimMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any } | null } | null };

export type ChatClaimConversationQueryVariables = Exact<{
  conversationId: Scalars['UUID']['input'];
}>;


export type ChatClaimConversationQuery = { __typename: 'Query', claimConversationById: { __typename: 'ClaimConversation', id: any, needClaimId: any | null, needId: any, creatorAccountId: any, claimerAccountId: any, createdAt: any, needByNeedId: { __typename: 'Need', id: any, title: string } | null, claimMessagesByConversationId: { __typename: 'ClaimMessagesConnection', nodes: Array<{ __typename: 'ClaimMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any, readAt: any | null, claimMessageImagesByMessageId: { __typename: 'ClaimMessageImagesConnection', nodes: Array<{ __typename: 'ClaimMessageImage', id: any, imageUrl: string, sortOrder: number }> } }> } } | null };

export type ChatSendClaimMessageMutationVariables = Exact<{
  input: SendClaimMessageInput;
}>;


export type ChatSendClaimMessageMutation = { __typename: 'Mutation', sendClaimMessage: { __typename: 'SendClaimMessagePayload', claimMessage: { __typename: 'ClaimMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any } | null } | null };

export type MarkResourceMessagesReadMutationVariables = Exact<{
  input: MarkResourceMessagesReadInput;
}>;


export type MarkResourceMessagesReadMutation = { __typename: 'Mutation', markResourceMessagesRead: { __typename: 'MarkResourceMessagesReadPayload', integer: number | null } | null };

export type MarkClaimMessagesReadMutationVariables = Exact<{
  input: MarkClaimMessagesReadInput;
}>;


export type MarkClaimMessagesReadMutation = { __typename: 'Mutation', markClaimMessagesRead: { __typename: 'MarkClaimMessagesReadPayload', integer: number | null } | null };

export type UpsertChatTypingPresenceMutationVariables = Exact<{
  input: UpsertChatTypingPresenceInput;
}>;


export type UpsertChatTypingPresenceMutation = { __typename: 'Mutation', upsertChatTypingPresence: { __typename: 'UpsertChatTypingPresencePayload', clientMutationId: string | null } | null };

export type TokenBalanceQueryVariables = Exact<{ [key: string]: never; }>;


export type TokenBalanceQuery = { __typename: 'Query', currentTokenBalance: number | null };

export type ContributionOverviewQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type ContributionOverviewQuery = { __typename: 'Query', currentTokenBalance: number | null, allTokenMovements: { __typename: 'TokenMovementsConnection', totalCount: number, edges: Array<{ __typename: 'TokenMovementsEdge', cursor: any | null, node: { __typename: 'TokenMovement', id: any, eventType: string, amountDelta: number, referenceType: string | null, referenceId: any | null, payload: any, createdAt: any } }>, pageInfo: { __typename: 'PageInfo', endCursor: any | null, hasNextPage: boolean } } | null };

export type GiftTokensMutationVariables = Exact<{
  input: GiftTokensInput;
}>;


export type GiftTokensMutation = { __typename: 'Mutation', giftTokens: { __typename: 'GiftTokensPayload', tokenMovement: { __typename: 'TokenMovement', id: any, eventType: string, amountDelta: number, referenceType: string | null, referenceId: any | null, createdAt: any } | null } | null };

export type GetGrantForClaimQueryVariables = Exact<{
  grantId: Scalars['UUID']['input'];
}>;


export type GetGrantForClaimQuery = { __typename: 'Query', getGrantForClaim: { __typename: 'GetGrantForClaimConnection', nodes: Array<{ __typename: 'GetGrantForClaimRecord', id: any | null, title: string | null, description: string | null, awardedTokenAmount: number | null, maxSuccessfulClaimCount: number | null, expiresAt: any | null }> } | null };

export type ClaimGrantMutationVariables = Exact<{
  grantId: Scalars['UUID']['input'];
}>;


export type ClaimGrantMutation = { __typename: 'Mutation', claimGrant: { __typename: 'ClaimGrantPayload', grantClaimResult: { __typename: 'GrantClaimResult', outcomeCode: string | null, claimedAmount: number | null, grantClaimId: any | null } | null } | null };

export type WriteOperationalLogMutationVariables = Exact<{
  level: Scalars['String']['input'];
  component: Scalars['String']['input'];
  message: Scalars['String']['input'];
  context?: InputMaybe<Scalars['String']['input']>;
  accountId?: InputMaybe<Scalars['UUID']['input']>;
  metadata?: InputMaybe<Scalars['JSON']['input']>;
}>;


export type WriteOperationalLogMutation = { __typename: 'Mutation', writeOperationalLog: { __typename: 'WriteOperationalLogPayload', uuid: any | null } | null };

export type NeedClaimDetailQueryVariables = Exact<{
  claimId: Scalars['UUID']['input'];
}>;


export type NeedClaimDetailQuery = { __typename: 'Query', needClaimById: { __typename: 'NeedClaim', id: any, needId: any, claimerAccountId: any, message: string | null, status: NeedClaimStatus, createdAt: any, updatedAt: any, settledAt: any | null, needClaimSettlementEventByNeedClaimId: { __typename: 'NeedClaimSettlementEvent', id: any, topesAmount: number, createdAt: any, settledByAccountId: any } | null, needByNeedId: { __typename: 'Need', id: any, title: string, creatorAccountId: any } | null, accountByClaimerAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null } | null };

export type ClaimConversationByPartiesQueryVariables = Exact<{
  needId: Scalars['UUID']['input'];
  creatorAccountId: Scalars['UUID']['input'];
  claimerAccountId: Scalars['UUID']['input'];
}>;


export type ClaimConversationByPartiesQuery = { __typename: 'Query', claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: { __typename: 'ClaimConversation', id: any, claimMessagesByConversationId: { __typename: 'ClaimMessagesConnection', nodes: Array<{ __typename: 'ClaimMessage', id: any, senderAccountId: any, body: string, createdAt: any, readAt: any | null, claimMessageImagesByMessageId: { __typename: 'ClaimMessageImagesConnection', nodes: Array<{ __typename: 'ClaimMessageImage', id: any, imageUrl: string, sortOrder: number }> } }> } } | null };

export type SendClaimMessageMutationVariables = Exact<{
  input: SendClaimMessageInput;
}>;


export type SendClaimMessageMutation = { __typename: 'Mutation', sendClaimMessage: { __typename: 'SendClaimMessagePayload', claimMessage: { __typename: 'ClaimMessage', id: any, conversationId: any, senderAccountId: any, body: string, createdAt: any, readAt: any | null, claimMessageImagesByMessageId: { __typename: 'ClaimMessageImagesConnection', nodes: Array<{ __typename: 'ClaimMessageImage', id: any, imageUrl: string, sortOrder: number }> } } | null } | null };

export type ClaimNeedMutationVariables = Exact<{
  input: ClaimNeedInput;
}>;


export type ClaimNeedMutation = { __typename: 'Mutation', claimNeed: { __typename: 'ClaimNeedPayload', needClaim: { __typename: 'NeedClaim', id: any, needId: any, claimerAccountId: any, message: string | null, status: NeedClaimStatus, createdAt: any, updatedAt: any, settledAt: any | null } | null } | null };

export type ViewerClaimOverviewQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewerClaimOverviewQuery = { __typename: 'Query', allNeedClaims: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: any, needId: any, claimerAccountId: any, message: string | null, status: NeedClaimStatus, createdAt: any, updatedAt: any, settledAt: any | null, settledByAccountId: any | null, needByNeedId: { __typename: 'Need', id: any, title: string, creatorAccountId: any, proposedTopesAmount: number | null } | null, accountByClaimerAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, claimConversationsByNeedClaimId: { __typename: 'ClaimConversationsConnection', nodes: Array<{ __typename: 'ClaimConversation', id: any }> }, needClaimSettlementEventByNeedClaimId: { __typename: 'NeedClaimSettlementEvent', id: any, topesAmount: number, createdAt: any, settledByAccountId: any } | null }> } | null, allNeedClaimNotifications: { __typename: 'NeedClaimNotificationsConnection', nodes: Array<{ __typename: 'NeedClaimNotification', id: any, needClaimId: any, eventType: string, payload: any, createdAt: any, readAt: any | null }> } | null };

export type NeedClaimManagementQueryVariables = Exact<{
  claimId: Scalars['UUID']['input'];
}>;


export type NeedClaimManagementQuery = { __typename: 'Query', needClaimById: { __typename: 'NeedClaim', id: any, needId: any, claimerAccountId: any, message: string | null, status: NeedClaimStatus, createdAt: any, updatedAt: any, settledAt: any | null, settledByAccountId: any | null, needByNeedId: { __typename: 'Need', id: any, title: string, creatorAccountId: any, proposedTopesAmount: number | null } | null, accountByClaimerAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, needClaimSettlementEventByNeedClaimId: { __typename: 'NeedClaimSettlementEvent', id: any, needClaimId: any, needId: any, settledByAccountId: any, claimerAccountId: any, topesAmount: number, createdAt: any } | null } | null };

export type SettleNeedClaimMutationVariables = Exact<{
  input: SettleNeedClaimInput;
}>;


export type SettleNeedClaimMutation = { __typename: 'Mutation', settleNeedClaim: { __typename: 'SettleNeedClaimPayload', needClaim: { __typename: 'NeedClaim', id: any, status: NeedClaimStatus, settledAt: any | null, settledByAccountId: any | null, needClaimSettlementEventByNeedClaimId: { __typename: 'NeedClaimSettlementEvent', id: any, topesAmount: number, createdAt: any, settledByAccountId: any } | null } | null } | null };

export type CancelNeedClaimMutationVariables = Exact<{
  input: CancelNeedClaimInput;
}>;


export type CancelNeedClaimMutation = { __typename: 'Mutation', cancelNeedClaim: { __typename: 'CancelNeedClaimPayload', needClaim: { __typename: 'NeedClaim', id: any, status: NeedClaimStatus, updatedAt: any } | null } | null };

export type DeclineNeedClaimMutationVariables = Exact<{
  input: DeclineNeedClaimInput;
}>;


export type DeclineNeedClaimMutation = { __typename: 'Mutation', declineNeedClaim: { __typename: 'DeclineNeedClaimPayload', needClaim: { __typename: 'NeedClaim', id: any, status: NeedClaimStatus, updatedAt: any } | null } | null };

export type CreateNeedMutationVariables = Exact<{
  title: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  location: Scalars['String']['input'];
  intensity: NeedIntensity;
  proposedTopesAmount?: InputMaybe<Scalars['Int']['input']>;
  objectRequired?: InputMaybe<Scalars['Boolean']['input']>;
  competenceRequired?: InputMaybe<Scalars['Boolean']['input']>;
  toolingRequired?: InputMaybe<Scalars['Boolean']['input']>;
  multiplePeopleRequired?: InputMaybe<Scalars['Boolean']['input']>;
  requiredCompetenceText?: InputMaybe<Scalars['String']['input']>;
  requiredToolingText?: InputMaybe<Scalars['String']['input']>;
  requiredPeopleCount?: InputMaybe<Scalars['Int']['input']>;
  campaignId?: InputMaybe<Scalars['UUID']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
}>;


export type CreateNeedMutation = { __typename: 'Mutation', createNeed: { __typename: 'CreateNeedPayload', need: { __typename: 'Need', id: any, title: string, intensity: NeedIntensity, proposedTopesAmount: number | null } | null } | null };

export type UpdateNeedMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
  title: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  location: Scalars['String']['input'];
  intensity: NeedIntensity;
  proposedTopesAmount?: InputMaybe<Scalars['Int']['input']>;
  objectRequired?: InputMaybe<Scalars['Boolean']['input']>;
  competenceRequired?: InputMaybe<Scalars['Boolean']['input']>;
  toolingRequired?: InputMaybe<Scalars['Boolean']['input']>;
  multiplePeopleRequired?: InputMaybe<Scalars['Boolean']['input']>;
  requiredCompetenceText?: InputMaybe<Scalars['String']['input']>;
  requiredToolingText?: InputMaybe<Scalars['String']['input']>;
  requiredPeopleCount?: InputMaybe<Scalars['Int']['input']>;
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
}>;


export type UpdateNeedMutation = { __typename: 'Mutation', updateNeedById: { __typename: 'UpdateNeedPayload', need: { __typename: 'Need', id: any, title: string, intensity: NeedIntensity, proposedTopesAmount: number | null } | null } | null };

export type NeedEditDetailQueryVariables = Exact<{
  needId: Scalars['UUID']['input'];
}>;


export type NeedEditDetailQuery = { __typename: 'Query', needById: { __typename: 'Need', id: any, title: string, description: string | null, location: string, intensity: NeedIntensity, proposedTopesAmount: number | null, objectRequired: boolean, competenceRequired: boolean, toolingRequired: boolean, multiplePeopleRequired: boolean, requiredCompetenceText: string | null, requiredToolingText: string | null, requiredPeopleCount: number | null, expiresAt: any | null, campaignNeedsByNeedId: { __typename: 'CampaignNeedsConnection', nodes: Array<{ __typename: 'CampaignNeed', campaignId: any }> } } | null };

export type LinkableCampaignOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type LinkableCampaignOptionsQuery = { __typename: 'Query', allCampaigns: { __typename: 'CampaignsConnection', nodes: Array<{ __typename: 'Campaign', id: any, title: string, startAt: any, endAt: any }> } | null };

export type PublicNeedsQueryVariables = Exact<{
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLatitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLongitude?: InputMaybe<Scalars['BigFloat']['input']>;
  searchText?: InputMaybe<Scalars['String']['input']>;
  multiplePeopleRequired?: InputMaybe<TriStateFilter>;
  toolingRequired?: InputMaybe<TriStateFilter>;
  competenceRequired?: InputMaybe<TriStateFilter>;
  objectRequired?: InputMaybe<TriStateFilter>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PublicNeedsQuery = { __typename: 'Query', searchNeeds: { __typename: 'SearchNeedsConnection', nodes: Array<{ __typename: 'SearchNeedsRecord', id: any | null, creatorAccountId: any | null, creatorDisplayName: string | null, title: string | null, description: string | null, location: string | null, latitude: any | null, longitude: any | null, intensity: NeedIntensity | null, proposedTopesAmount: number | null, objectRequired: boolean | null, competenceRequired: boolean | null, toolingRequired: boolean | null, multiplePeopleRequired: boolean | null, requiredCompetenceText: string | null, requiredToolingText: string | null, requiredPeopleCount: number | null, expiresAt: any | null, createdAt: any | null, closenessScore: any | null, easeOfSetupScore: any | null, expirationScore: any | null, weightedScore: any | null, queryLatitude: any | null, queryLongitude: any | null }> } | null };

export type MyNeedsConnectionQueryVariables = Exact<{
  creatorAccountId: Scalars['UUID']['input'];
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyNeedsConnectionQuery = { __typename: 'Query', allNeeds: { __typename: 'NeedsConnection', nodes: Array<{ __typename: 'Need', id: any, creatorAccountId: any, title: string, description: string | null, location: string, intensity: NeedIntensity, proposedTopesAmount: number | null, objectRequired: boolean, competenceRequired: boolean, toolingRequired: boolean, multiplePeopleRequired: boolean, requiredPeopleCount: number | null, expiresAt: any | null, createdAt: any, updatedAt: any, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: any | null } } | null };

export type SoftDeleteNeedMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type SoftDeleteNeedMutation = { __typename: 'Mutation', updateNeedById: { __typename: 'UpdateNeedPayload', need: { __typename: 'Need', id: any, isActive: boolean, updatedAt: any } | null } | null };

export type NotificationsOverviewQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NotificationsOverviewQuery = { __typename: 'Query', allNeedClaimNotifications: { __typename: 'NeedClaimNotificationsConnection', nodes: Array<{ __typename: 'NeedClaimNotification', id: any, needClaimId: any, eventType: string, payload: any, createdAt: any, readAt: any | null }> } | null, allResourceBidNotifications: { __typename: 'ResourceBidNotificationsConnection', nodes: Array<{ __typename: 'ResourceBidNotification', id: any, resourceBidId: any, eventType: string, payload: any, createdAt: any, readAt: any | null }> } | null, allAccountNotifications: { __typename: 'AccountNotificationsConnection', nodes: Array<{ __typename: 'AccountNotification', id: any, eventType: string, payload: any, createdAt: any, readAt: any | null }> } | null, allNeedClaims: { __typename: 'NeedClaimsConnection', nodes: Array<{ __typename: 'NeedClaim', id: any, needId: any, needByNeedId: { __typename: 'Need', id: any, title: string } | null }> } | null, allResourceBids: { __typename: 'ResourceBidsConnection', nodes: Array<{ __typename: 'ResourceBid', id: any, resourceId: any, resourceByResourceId: { __typename: 'Resource', id: any, title: string } | null }> } | null };

export type MarkNeedClaimNotificationReadMutationVariables = Exact<{
  input: MarkNeedClaimNotificationReadInput;
}>;


export type MarkNeedClaimNotificationReadMutation = { __typename: 'Mutation', markNeedClaimNotificationRead: { __typename: 'MarkNeedClaimNotificationReadPayload', needClaimNotification: { __typename: 'NeedClaimNotification', id: any, readAt: any | null } | null } | null };

export type MarkResourceBidNotificationReadMutationVariables = Exact<{
  input: MarkResourceBidNotificationReadInput;
}>;


export type MarkResourceBidNotificationReadMutation = { __typename: 'Mutation', markResourceBidNotificationRead: { __typename: 'MarkResourceBidNotificationReadPayload', resourceBidNotification: { __typename: 'ResourceBidNotification', id: any, readAt: any | null } | null } | null };

export type MarkAccountNotificationReadMutationVariables = Exact<{
  input: MarkAccountNotificationReadInput;
}>;


export type MarkAccountNotificationReadMutation = { __typename: 'Mutation', markAccountNotificationRead: { __typename: 'MarkAccountNotificationReadPayload', accountNotification: { __typename: 'AccountNotification', id: any, readAt: any | null } | null } | null };

export type MarkAllNotificationsReadMutationVariables = Exact<{
  input: MarkAllNotificationsReadInput;
}>;


export type MarkAllNotificationsReadMutation = { __typename: 'Mutation', markAllNotificationsRead: { __typename: 'MarkAllNotificationsReadPayload', integer: number | null } | null };

export type GetDeliveryPreferencesMutationVariables = Exact<{ [key: string]: never; }>;


export type GetDeliveryPreferencesMutation = { __typename: 'Mutation', getAccountDeliveryPreferences: { __typename: 'GetAccountDeliveryPreferencesPayload', results: Array<{ __typename: 'GetAccountDeliveryPreferencesRecord', eventCategory: string | null, deliveryStrategy: string | null, summaryFrequencyDays: number | null } | null> | null } | null };

export type SetDeliveryPreferenceMutationVariables = Exact<{
  eventCategory: Scalars['String']['input'];
  deliveryStrategy: Scalars['String']['input'];
  summaryFrequencyDays?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SetDeliveryPreferenceMutation = { __typename: 'Mutation', setAccountDeliveryPreference: { __typename: 'SetAccountDeliveryPreferencePayload', accountDeliveryPreference: { __typename: 'AccountDeliveryPreference', eventCategory: string, deliveryStrategy: string, summaryFrequencyDays: number } | null } | null };

export type AccountProfileQueryVariables = Exact<{
  accountId: Scalars['UUID']['input'];
}>;


export type AccountProfileQuery = { __typename: 'Query', accountById: { __typename: 'Account', id: any, displayName: string | null, bio: string | null, location: string | null, latitude: any | null, longitude: any | null, avatarUrl: string | null, preferredLanguage: string, profileLinks: any } | null };

export type UpdateAccountProfileMutationVariables = Exact<{
  accountId: Scalars['UUID']['input'];
  patch: AccountPatch;
}>;


export type UpdateAccountProfileMutation = { __typename: 'Mutation', updateAccountById: { __typename: 'UpdateAccountPayload', account: { __typename: 'Account', id: any, displayName: string | null, bio: string | null, location: string | null, latitude: any | null, longitude: any | null, avatarUrl: string | null, preferredLanguage: string, profileLinks: any } | null } | null };

export type PublishResourceMutationVariables = Exact<{
  resourceId?: InputMaybe<Scalars['UUID']['input']>;
  title: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  location: Scalars['String']['input'];
  latitude: Scalars['BigFloat']['input'];
  longitude: Scalars['BigFloat']['input'];
  intensity: NeedIntensity;
  defaultTokenAmount?: InputMaybe<Scalars['Int']['input']>;
  categoryCodes?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  imageUrls?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  isProduct: Scalars['Boolean']['input'];
  isService: Scalars['Boolean']['input'];
  canBeGiven: Scalars['Boolean']['input'];
  canBeExchanged: Scalars['Boolean']['input'];
  canBeTakenAway: Scalars['Boolean']['input'];
  canBeDelivered: Scalars['Boolean']['input'];
  expiresAt?: InputMaybe<Scalars['Datetime']['input']>;
}>;


export type PublishResourceMutation = { __typename: 'Mutation', publishResource: { __typename: 'PublishResourcePayload', resource: { __typename: 'Resource', id: any, title: string, intensity: NeedIntensity, defaultTokenAmount: number | null, categoryLabels: Array<string | null> | null, expiresAt: any | null, isActive: boolean } | null } | null };

export type ResourceCategoryOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type ResourceCategoryOptionsQuery = { __typename: 'Query', allResourceCategories: { __typename: 'ResourceCategoriesConnection', nodes: Array<{ __typename: 'ResourceCategory', code: number, slug: string, label: string, labelFr: string, sortOrder: number }> } | null };

export type PublicResourcesQueryVariables = Exact<{
  latitude?: InputMaybe<Scalars['BigFloat']['input']>;
  longitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLatitude?: InputMaybe<Scalars['BigFloat']['input']>;
  browserLongitude?: InputMaybe<Scalars['BigFloat']['input']>;
  searchText?: InputMaybe<Scalars['String']['input']>;
  categoryCodes?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  isProduct?: InputMaybe<TriStateFilter>;
  isService?: InputMaybe<TriStateFilter>;
  canBeGiven?: InputMaybe<TriStateFilter>;
  canBeExchanged?: InputMaybe<TriStateFilter>;
  canBeTakenAway?: InputMaybe<TriStateFilter>;
  canBeDelivered?: InputMaybe<TriStateFilter>;
  limitCount?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PublicResourcesQuery = { __typename: 'Query', searchResources: { __typename: 'SearchResourcesConnection', nodes: Array<{ __typename: 'SearchResourcesRecord', id: any | null, creatorAccountId: any | null, creatorDisplayName: string | null, title: string | null, description: string | null, location: string | null, latitude: any | null, longitude: any | null, intensity: NeedIntensity | null, defaultTokenAmount: number | null, categoryLabels: Array<string | null> | null, isProduct: boolean | null, isService: boolean | null, canBeGiven: boolean | null, canBeExchanged: boolean | null, canBeTakenAway: boolean | null, canBeDelivered: boolean | null, expiresAt: any | null, createdAt: any | null, imageUrls: Array<string | null> | null, distanceKm: any | null, queryLatitude: any | null, queryLongitude: any | null }> } | null };

export type ResourceDetailQueryVariables = Exact<{
  resourceId: Scalars['UUID']['input'];
}>;


export type ResourceDetailQuery = { __typename: 'Query', resourceById: { __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, latitude: any, longitude: any, intensity: NeedIntensity, defaultTokenAmount: number | null, imageUrls: Array<string | null>, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeGiven: boolean, canBeExchanged: boolean, canBeTakenAway: boolean, canBeDelivered: boolean, expiresAt: any | null, isActive: boolean, createdAt: any, updatedAt: any, resourceCategoryAssignmentsByResourceId: { __typename: 'ResourceCategoryAssignmentsConnection', nodes: Array<{ __typename: 'ResourceCategoryAssignment', categoryCode: number }> }, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, resourceBidsByResourceId: { __typename: 'ResourceBidsConnection', nodes: Array<{ __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, createdAt: any, respondedAt: any | null, respondedByAccountId: any | null, accountByBidderAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null }> } } | null };

export type SoftDeleteResourceMutationVariables = Exact<{
  id: Scalars['UUID']['input'];
}>;


export type SoftDeleteResourceMutation = { __typename: 'Mutation', updateResourceById: { __typename: 'UpdateResourcePayload', resource: { __typename: 'Resource', id: any, isActive: boolean, updatedAt: any } | null } | null };

export type ResourceOpenBidCountQueryVariables = Exact<{
  resourceId: Scalars['UUID']['input'];
}>;


export type ResourceOpenBidCountQuery = { __typename: 'Query', allResourceBids: { __typename: 'ResourceBidsConnection', totalCount: number } | null };

export type ResourceBidsOverviewQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ResourceBidsOverviewQuery = { __typename: 'Query', allResourceBids: { __typename: 'ResourceBidsConnection', nodes: Array<{ __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, createdAt: any, respondedAt: any | null, respondedByAccountId: any | null, accountByBidderAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, resourceByResourceId: { __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, defaultTokenAmount: number | null, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeExchanged: boolean, expiresAt: any | null, createdAt: any, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null } | null }> } | null };

export type MyResourcesConnectionQueryVariables = Exact<{
  creatorAccountId: Scalars['UUID']['input'];
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type MyResourcesConnectionQuery = { __typename: 'Query', allResources: { __typename: 'ResourcesConnection', nodes: Array<{ __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, defaultTokenAmount: number | null, imageUrls: Array<string | null>, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeGiven: boolean, canBeExchanged: boolean, canBeTakenAway: boolean, canBeDelivered: boolean, expiresAt: any | null, createdAt: any, updatedAt: any, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: any | null } } | null };

export type SubmitResourceBidMutationVariables = Exact<{
  input: SubmitResourceBidInput;
}>;


export type SubmitResourceBidMutation = { __typename: 'Mutation', submitResourceBid: { __typename: 'SubmitResourceBidPayload', resourceBid: { __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, createdAt: any, respondedAt: any | null, respondedByAccountId: any | null } | null } | null };

export type RespondToResourceBidMutationVariables = Exact<{
  input: RespondToResourceBidInput;
}>;


export type RespondToResourceBidMutation = { __typename: 'Mutation', respondToResourceBid: { __typename: 'RespondToResourceBidPayload', resourceBid: { __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, createdAt: any, respondedAt: any | null, respondedByAccountId: any | null } | null } | null };

export type BidWorkspaceFieldsFragment = { __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, isActive: boolean | null, validUntil: any, createdAt: any, updatedAt: any, respondedAt: any | null, respondedByAccountId: any | null, accountByBidderAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, resourceConversationsByResourceBidId: { __typename: 'ResourceConversationsConnection', nodes: Array<{ __typename: 'ResourceConversation', id: any }> }, resourceByResourceId: { __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, defaultTokenAmount: number | null, imageUrls: Array<string | null>, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeExchanged: boolean, isActive: boolean, expiresAt: any | null, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null } | null };

export type SentBidsQueryVariables = Exact<{
  activeOnly: Scalars['Boolean']['input'];
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type SentBidsQuery = { __typename: 'Query', sentResourceBids: { __typename: 'ResourceBidsConnection', totalCount: number, nodes: Array<{ __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, isActive: boolean | null, validUntil: any, createdAt: any, updatedAt: any, respondedAt: any | null, respondedByAccountId: any | null, accountByBidderAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, resourceConversationsByResourceBidId: { __typename: 'ResourceConversationsConnection', nodes: Array<{ __typename: 'ResourceConversation', id: any }> }, resourceByResourceId: { __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, defaultTokenAmount: number | null, imageUrls: Array<string | null>, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeExchanged: boolean, isActive: boolean, expiresAt: any | null, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: any | null } } | null };

export type ReceivedBidsQueryVariables = Exact<{
  activeOnly: Scalars['Boolean']['input'];
  first: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['Cursor']['input']>;
}>;


export type ReceivedBidsQuery = { __typename: 'Query', receivedResourceBids: { __typename: 'ResourceBidsConnection', totalCount: number, nodes: Array<{ __typename: 'ResourceBid', id: any, resourceId: any, bidderAccountId: any, message: string | null, proposedTokenAmount: number | null, status: ResourceBidStatus, isActive: boolean | null, validUntil: any, createdAt: any, updatedAt: any, respondedAt: any | null, respondedByAccountId: any | null, accountByBidderAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null, resourceConversationsByResourceBidId: { __typename: 'ResourceConversationsConnection', nodes: Array<{ __typename: 'ResourceConversation', id: any }> }, resourceByResourceId: { __typename: 'Resource', id: any, creatorAccountId: any, title: string, description: string | null, location: string, defaultTokenAmount: number | null, imageUrls: Array<string | null>, categoryLabels: Array<string | null> | null, isProduct: boolean, isService: boolean, canBeExchanged: boolean, isActive: boolean, expiresAt: any | null, accountByCreatorAccountId: { __typename: 'Account', id: any, displayName: string | null, externalSubject: string } | null } | null }>, pageInfo: { __typename: 'PageInfo', hasNextPage: boolean, endCursor: any | null } } | null };

export type CancelResourceBidMutationVariables = Exact<{
  input: CancelResourceBidInput;
}>;


export type CancelResourceBidMutation = { __typename: 'Mutation', cancelResourceBid: { __typename: 'CancelResourceBidPayload', resourceBid: { __typename: 'ResourceBid', id: any, status: ResourceBidStatus, updatedAt: any } | null } | null };

export type AccountEventsSubscriptionVariables = Exact<{
  topic: Scalars['String']['input'];
}>;


export type AccountEventsSubscription = { __typename: 'Subscription', listen: { __typename: 'ListenPayload', relatedNodeId: string | null } };

export const BidWorkspaceFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BidWorkspaceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceBid"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceConversationsByResourceBidId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]} as unknown as DocumentNode<BidWorkspaceFieldsFragment, unknown>;
export const AdminListAccountsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListAccounts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListAccounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"tokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"address"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListAccountsQuery, AdminListAccountsQueryVariables>;
export const AdminListBidsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListBids"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"bidderName"}},{"kind":"Field","name":{"kind":"Name","value":"receiverName"}},{"kind":"Field","name":{"kind":"Name","value":"resourceTitle"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"tokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expirationDatetime"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListBidsQuery, AdminListBidsQueryVariables>;
export const AdminListResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"creatorName"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"tokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageCount"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"expirationDatetime"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListResourcesQuery, AdminListResourcesQueryVariables>;
export const AdminListNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"accountName"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListNotificationsQuery, AdminListNotificationsQueryVariables>;
export const AdminListMailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListMails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListMails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"recipientAccountName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListMailsQuery, AdminListMailsQueryVariables>;
export const AdminListCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListCampaigns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"CampaignModerationStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorName"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"airdropDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"airdropTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"beginDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"endDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"resourceRewardsMultiplier"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListCampaignsQuery, AdminListCampaignsQueryVariables>;
export const AdminListGrantsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListGrants"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListGrants"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"expirationDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"amountGranted"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListGrantsQuery, AdminListGrantsQueryVariables>;
export const AdminListLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminListLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminListLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pSearch"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLimit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pOffset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"component"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"context"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]}}]} as unknown as DocumentNode<AdminListLogsQuery, AdminListLogsQueryVariables>;
export const AdminGetMailContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminGetMailContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pMailId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminGetMailContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pMailId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pMailId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"string"}}]}}]}}]} as unknown as DocumentNode<AdminGetMailContentMutation, AdminGetMailContentMutationVariables>;
export const AdminResendMailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminResendMail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pMailId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminResendMail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pMailId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pMailId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientMutationId"}}]}}]}}]} as unknown as DocumentNode<AdminResendMailMutation, AdminResendMailMutationVariables>;
export const AdminCreateGrantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminCreateGrant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pTitle"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pDescription"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pAwardedTokenAmount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pMaxSuccessfulClaimCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pExpiresAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pLinkedCampaignId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pTargetEmails"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertGrant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pTitle"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pTitle"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pDescription"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pDescription"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pAwardedTokenAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pAwardedTokenAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pMaxSuccessfulClaimCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pMaxSuccessfulClaimCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pExpiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pExpiresAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pLinkedCampaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pLinkedCampaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pTargetEmails"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pTargetEmails"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"grantDefinition"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AdminCreateGrantMutation, AdminCreateGrantMutationVariables>;
export const AuthSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AuthSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authenticated"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}}]}}]}}]}}]} as unknown as DocumentNode<AuthSessionQuery, AuthSessionQueryVariables>;
export const AuthLoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthLogin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authLogin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identifier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authenticated"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuthLoginMutation, AuthLoginMutationVariables>;
export const AuthLogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthLogout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authLogout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authenticated"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuthLogoutMutation, AuthLogoutMutationVariables>;
export const AuthChangePasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AuthChangePassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authChangePassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"currentPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"currentPassword"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"newPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newPassword"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authSession"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"authenticated"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AuthChangePasswordMutation, AuthChangePasswordMutationVariables>;
export const RegisterLocalAccountWithPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RegisterLocalAccountWithPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"password"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"verificationTtlMs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"preferredLanguage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"registerLocalAccountWithPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identifier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"displayName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"displayName"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"password"},"value":{"kind":"Variable","name":{"kind":"Name","value":"password"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"verificationTtlMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"verificationTtlMs"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"preferredLanguage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"preferredLanguage"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<RegisterLocalAccountWithPasswordMutation, RegisterLocalAccountWithPasswordMutationVariables>;
export const RequestEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"verificationTtlMs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"throttleMs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identifier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"verificationTtlMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"verificationTtlMs"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"throttleMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"throttleMs"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<RequestEmailVerificationMutation, RequestEmailVerificationMutationVariables>;
export const ConfirmEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<ConfirmEmailVerificationMutation, ConfirmEmailVerificationMutationVariables>;
export const RequestPasswordResetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestPasswordReset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resetTtlMs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"throttleMs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigInt"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPasswordReset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"identifier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"identifier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"resetTtlMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resetTtlMs"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"throttleMs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"throttleMs"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>;
export const ConfirmPasswordResetWithPasswordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ConfirmPasswordResetWithPassword"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"token"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"nextPassword"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"confirmPasswordResetWithPassword"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"token"},"value":{"kind":"Variable","name":{"kind":"Name","value":"token"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"nextPassword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"nextPassword"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"boolean"}}]}}]}}]} as unknown as DocumentNode<ConfirmPasswordResetWithPasswordMutation, ConfirmPasswordResetWithPasswordMutationVariables>;
export const AddCampaignModerationNoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCampaignModerationNote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"body"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCampaignModerationNote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"body"},"value":{"kind":"Variable","name":{"kind":"Name","value":"body"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignModerationNote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"managerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<AddCampaignModerationNoteMutation, AddCampaignModerationNoteMutationVariables>;
export const CampaignModerationHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CampaignModerationHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignModerationEvents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pCampaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"actorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<CampaignModerationHistoryQuery, CampaignModerationHistoryQueryVariables>;
export const UpdateCampaignForModerationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCampaignForModeration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pCampaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pTitle"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pTheme"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pManagerNoteFromCreator"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pRewardsMultiplier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pAirdropAmount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pStartAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pAirdropAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pEndAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCampaignForModeration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pCampaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pCampaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pTitle"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pTitle"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pTheme"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pTheme"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pManagerNoteFromCreator"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pManagerNoteFromCreator"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pRewardsMultiplier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pRewardsMultiplier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pAirdropAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pAirdropAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pStartAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pStartAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pAirdropAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pAirdropAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pEndAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pEndAt"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaign"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"managerNoteFromCreator"}},{"kind":"Field","name":{"kind":"Name","value":"rewardsMultiplier"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAmount"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCampaignForModerationMutation, UpdateCampaignForModerationMutationVariables>;
export const CampaignModerationDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CampaignModerationDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"managerNoteFromCreator"}},{"kind":"Field","name":{"kind":"Name","value":"rewardsMultiplier"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAmount"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<CampaignModerationDetailsQuery, CampaignModerationDetailsQueryVariables>;
export const CampaignNeedTriageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CampaignNeedTriage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaignNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"ListValue","values":[{"kind":"EnumValue","value":"CREATED_AT_DESC"}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"actedAt"}},{"kind":"Field","name":{"kind":"Name","value":"actedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"campaignByCampaignId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CampaignNeedTriageQuery, CampaignNeedTriageQueryVariables>;
export const AcceptCampaignNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcceptCampaignNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptCampaignNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignNeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"actedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"actedAt"}}]}}]}}]}}]} as unknown as DocumentNode<AcceptCampaignNeedMutation, AcceptCampaignNeedMutationVariables>;
export const RejectCampaignNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RejectCampaignNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectCampaignNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignNeed"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"actedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"actedAt"}}]}}]}}]}}]} as unknown as DocumentNode<RejectCampaignNeedMutation, RejectCampaignNeedMutationVariables>;
export const CreateCampaignDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCampaign"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"theme"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"managerNoteFromCreator"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rewardsMultiplier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"airdropAmount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"airdropAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCampaign"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"theme"},"value":{"kind":"Variable","name":{"kind":"Name","value":"theme"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"managerNoteFromCreator"},"value":{"kind":"Variable","name":{"kind":"Name","value":"managerNoteFromCreator"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"rewardsMultiplier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rewardsMultiplier"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"airdropAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"airdropAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"airdropAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"airdropAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endAt"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaign"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCampaignMutation, CreateCampaignMutationVariables>;
export const MyCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCampaigns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]}}]} as unknown as DocumentNode<MyCampaignsQuery, MyCampaignsQueryVariables>;
export const PublicCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicCampaigns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"moderationStatus"},"value":{"kind":"EnumValue","value":"APPROVED"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"START_AT_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]}}]} as unknown as DocumentNode<PublicCampaignsQuery, PublicCampaignsQueryVariables>;
export const ApproveCampaignDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveCampaign"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveCampaign"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaign"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}}]}}]}}]}}]} as unknown as DocumentNode<ApproveCampaignMutation, ApproveCampaignMutationVariables>;
export const MyCampaignsConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyCampaignsConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyCampaignsConnectionQuery, MyCampaignsConnectionQueryVariables>;
export const InspirationCampaignsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"InspirationCampaigns"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"moderationStatus"},"value":{"kind":"EnumValue","value":"APPROVED"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"theme"}},{"kind":"Field","name":{"kind":"Name","value":"moderationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"airdropAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<InspirationCampaignsQuery, InspirationCampaignsQueryVariables>;
export const ListChatConversationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListChatConversations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listChatConversations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"pLimit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"pOffset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"conversationKind"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"contextId"}},{"kind":"Field","name":{"kind":"Name","value":"contextTitle"}},{"kind":"Field","name":{"kind":"Name","value":"otherAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"otherAccountDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessagePreview"}},{"kind":"Field","name":{"kind":"Name","value":"unreadCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastActivityAt"}}]}}]}}]}}]} as unknown as DocumentNode<ListChatConversationsQuery, ListChatConversationsQueryVariables>;
export const CountChatConversationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CountChatConversations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"countChatConversations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pSearch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}]}]}}]} as unknown as DocumentNode<CountChatConversationsQuery, CountChatConversationsQueryVariables>;
export const ChatResourceConversationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatResourceConversation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceConversationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceBidId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"ownerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceMessagesByConversationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"resourceMessageImagesByMessageId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatResourceConversationQuery, ChatResourceConversationQueryVariables>;
export const ResourceConversationLookupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceConversationLookup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ownerAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"bidderAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"Argument","name":{"kind":"Name","value":"ownerAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ownerAccountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"bidderAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"bidderAccountId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ResourceConversationLookupQuery, ResourceConversationLookupQueryVariables>;
export const SendResourceMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendResourceMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendResourceMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendResourceMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SendResourceMessageMutation, SendResourceMessageMutationVariables>;
export const SendResourceMessageDirectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendResourceMessageDirect"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendResourceMessageDirectInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendResourceMessageDirect"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SendResourceMessageDirectMutation, SendResourceMessageDirectMutationVariables>;
export const SendNeedMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendNeedMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendNeedMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendNeedMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SendNeedMessageMutation, SendNeedMessageMutationVariables>;
export const ChatClaimConversationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ChatClaimConversation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimConversationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"conversationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claimMessagesByConversationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"claimMessageImagesByMessageId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ChatClaimConversationQuery, ChatClaimConversationQueryVariables>;
export const ChatSendClaimMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChatSendClaimMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendClaimMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendClaimMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<ChatSendClaimMessageMutation, ChatSendClaimMessageMutationVariables>;
export const MarkResourceMessagesReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkResourceMessagesRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkResourceMessagesReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markResourceMessagesRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integer"}}]}}]}}]} as unknown as DocumentNode<MarkResourceMessagesReadMutation, MarkResourceMessagesReadMutationVariables>;
export const MarkClaimMessagesReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkClaimMessagesRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkClaimMessagesReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markClaimMessagesRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integer"}}]}}]}}]} as unknown as DocumentNode<MarkClaimMessagesReadMutation, MarkClaimMessagesReadMutationVariables>;
export const UpsertChatTypingPresenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertChatTypingPresence"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertChatTypingPresenceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertChatTypingPresence"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientMutationId"}}]}}]}}]} as unknown as DocumentNode<UpsertChatTypingPresenceMutation, UpsertChatTypingPresenceMutationVariables>;
export const TokenBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TokenBalance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentTokenBalance"}}]}}]} as unknown as DocumentNode<TokenBalanceQuery, TokenBalanceQueryVariables>;
export const ContributionOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ContributionOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"10"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentTokenBalance"}},{"kind":"Field","name":{"kind":"Name","value":"allTokenMovements"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"amountDelta"}},{"kind":"Field","name":{"kind":"Name","value":"referenceType"}},{"kind":"Field","name":{"kind":"Name","value":"referenceId"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endCursor"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ContributionOverviewQuery, ContributionOverviewQueryVariables>;
export const GiftTokensDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GiftTokens"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GiftTokensInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"giftTokens"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tokenMovement"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"amountDelta"}},{"kind":"Field","name":{"kind":"Name","value":"referenceType"}},{"kind":"Field","name":{"kind":"Name","value":"referenceId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GiftTokensMutation, GiftTokensMutationVariables>;
export const GetGrantForClaimDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGrantForClaim"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"grantId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getGrantForClaim"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pGrantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"grantId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"awardedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"maxSuccessfulClaimCount"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetGrantForClaimQuery, GetGrantForClaimQueryVariables>;
export const ClaimGrantDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClaimGrant"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"grantId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimGrant"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pGrantId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"grantId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"grantClaimResult"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"outcomeCode"}},{"kind":"Field","name":{"kind":"Name","value":"claimedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"grantClaimId"}}]}}]}}]}}]} as unknown as DocumentNode<ClaimGrantMutation, ClaimGrantMutationVariables>;
export const WriteOperationalLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"WriteOperationalLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"level"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"component"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"message"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"context"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"metadata"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"JSON"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"writeOperationalLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pLevel"},"value":{"kind":"Variable","name":{"kind":"Name","value":"level"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pComponent"},"value":{"kind":"Variable","name":{"kind":"Name","value":"component"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pMessage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"message"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pContext"},"value":{"kind":"Variable","name":{"kind":"Name","value":"context"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pMetadata"},"value":{"kind":"Variable","name":{"kind":"Name","value":"metadata"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uuid"}}]}}]}}]} as unknown as DocumentNode<WriteOperationalLogMutation, WriteOperationalLogMutationVariables>;
export const NeedClaimDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NeedClaimDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"claimId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaimById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"claimId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledAt"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimSettlementEventByNeedClaimId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"topesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByClaimerAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]} as unknown as DocumentNode<NeedClaimDetailQuery, NeedClaimDetailQueryVariables>;
export const ClaimConversationByPartiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClaimConversationByParties"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"claimerAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"needId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}},{"kind":"Argument","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}},{"kind":"Argument","name":{"kind":"Name","value":"claimerAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"claimerAccountId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"claimMessagesByConversationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"claimMessageImagesByMessageId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"PRIMARY_KEY_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ClaimConversationByPartiesQuery, ClaimConversationByPartiesQueryVariables>;
export const SendClaimMessageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendClaimMessage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SendClaimMessageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendClaimMessage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimMessage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"conversationId"}},{"kind":"Field","name":{"kind":"Name","value":"senderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}},{"kind":"Field","name":{"kind":"Name","value":"claimMessageImagesByMessageId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<SendClaimMessageMutation, SendClaimMessageMutationVariables>;
export const ClaimNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClaimNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClaimNeedInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"claimNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaim"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledAt"}}]}}]}}]}}]} as unknown as DocumentNode<ClaimNeedMutation, ClaimNeedMutationVariables>;
export const ViewerClaimOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewerClaimOverview"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeedClaims"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByClaimerAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"claimConversationsByNeedClaimId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"needClaimSettlementEventByNeedClaimId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"topesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"allNeedClaimNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"30"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimId"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<ViewerClaimOverviewQuery, ViewerClaimOverviewQueryVariables>;
export const NeedClaimManagementDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NeedClaimManagement"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"claimId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaimById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"claimId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"accountByClaimerAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"needClaimSettlementEventByNeedClaimId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimId"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"claimerAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"topesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<NeedClaimManagementQuery, NeedClaimManagementQueryVariables>;
export const SettleNeedClaimDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SettleNeedClaim"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SettleNeedClaimInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settleNeedClaim"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaim"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"settledAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimSettlementEventByNeedClaimId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"topesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"settledByAccountId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SettleNeedClaimMutation, SettleNeedClaimMutationVariables>;
export const CancelNeedClaimDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelNeedClaim"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CancelNeedClaimInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelNeedClaim"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaim"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CancelNeedClaimMutation, CancelNeedClaimMutationVariables>;
export const DeclineNeedClaimDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineNeedClaim"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeclineNeedClaimInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineNeedClaim"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaim"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<DeclineNeedClaimMutation, DeclineNeedClaimMutationVariables>;
export const CreateNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"location"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NeedIntensity"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proposedTopesAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredCompetenceText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredToolingText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredPeopleCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNeed"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"location"},"value":{"kind":"Variable","name":{"kind":"Name","value":"location"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"intensity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"proposedTopesAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proposedTopesAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"objectRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"competenceRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"toolingRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"multiplePeopleRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredCompetenceText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredCompetenceText"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredToolingText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredToolingText"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredPeopleCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredPeopleCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"campaignId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"campaignId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"need"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}}]}}]}}]}}]} as unknown as DocumentNode<CreateNeedMutation, CreateNeedMutationVariables>;
export const UpdateNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"location"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NeedIntensity"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"proposedTopesAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredCompetenceText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredToolingText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredPeopleCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNeedById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needPatch"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"location"},"value":{"kind":"Variable","name":{"kind":"Name","value":"location"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"intensity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"proposedTopesAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"proposedTopesAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"objectRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"competenceRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"toolingRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"multiplePeopleRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredCompetenceText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredCompetenceText"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredToolingText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredToolingText"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredPeopleCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredPeopleCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"need"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateNeedMutation, UpdateNeedMutationVariables>;
export const NeedEditDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NeedEditDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"needId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"needId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"objectRequired"}},{"kind":"Field","name":{"kind":"Name","value":"competenceRequired"}},{"kind":"Field","name":{"kind":"Name","value":"toolingRequired"}},{"kind":"Field","name":{"kind":"Name","value":"multiplePeopleRequired"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCompetenceText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredToolingText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPeopleCount"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"campaignNeedsByNeedId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CREATED_AT_DESC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"campaignId"}}]}}]}}]}}]}}]} as unknown as DocumentNode<NeedEditDetailQuery, NeedEditDetailQueryVariables>;
export const LinkableCampaignOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"LinkableCampaignOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allCampaigns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"moderationStatus"},"value":{"kind":"EnumValue","value":"APPROVED"}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"START_AT_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"startAt"}},{"kind":"Field","name":{"kind":"Name","value":"endAt"}}]}}]}}]}}]} as unknown as DocumentNode<LinkableCampaignOptionsQuery, LinkableCampaignOptionsQueryVariables>;
export const PublicNeedsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicNeeds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"browserLatitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"browserLongitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"latitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"longitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"browserLatitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"browserLatitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"browserLongitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"browserLongitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}}},{"kind":"Argument","name":{"kind":"Name","value":"multiplePeopleRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"multiplePeopleRequired"}}},{"kind":"Argument","name":{"kind":"Name","value":"toolingRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"toolingRequired"}}},{"kind":"Argument","name":{"kind":"Name","value":"competenceRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"competenceRequired"}}},{"kind":"Argument","name":{"kind":"Name","value":"objectRequired"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectRequired"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"creatorDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"objectRequired"}},{"kind":"Field","name":{"kind":"Name","value":"competenceRequired"}},{"kind":"Field","name":{"kind":"Name","value":"toolingRequired"}},{"kind":"Field","name":{"kind":"Name","value":"multiplePeopleRequired"}},{"kind":"Field","name":{"kind":"Name","value":"requiredCompetenceText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredToolingText"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPeopleCount"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"closenessScore"}},{"kind":"Field","name":{"kind":"Name","value":"easeOfSetupScore"}},{"kind":"Field","name":{"kind":"Name","value":"expirationScore"}},{"kind":"Field","name":{"kind":"Name","value":"weightedScore"}},{"kind":"Field","name":{"kind":"Name","value":"queryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"queryLongitude"}}]}}]}}]}}]} as unknown as DocumentNode<PublicNeedsQuery, PublicNeedsQueryVariables>;
export const MyNeedsConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNeedsConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeeds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"ID_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTopesAmount"}},{"kind":"Field","name":{"kind":"Name","value":"objectRequired"}},{"kind":"Field","name":{"kind":"Name","value":"competenceRequired"}},{"kind":"Field","name":{"kind":"Name","value":"toolingRequired"}},{"kind":"Field","name":{"kind":"Name","value":"multiplePeopleRequired"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPeopleCount"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyNeedsConnectionQuery, MyNeedsConnectionQueryVariables>;
export const SoftDeleteNeedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SoftDeleteNeed"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNeedById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"needPatch"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"need"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<SoftDeleteNeedMutation, SoftDeleteNeedMutationVariables>;
export const NotificationsOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationsOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"200"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNeedClaimNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needClaimId"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"allResourceBidNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceBidId"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"allAccountNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"eventType"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"allNeedClaims"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"needId"}},{"kind":"Field","name":{"kind":"Name","value":"needByNeedId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"allResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]}}]} as unknown as DocumentNode<NotificationsOverviewQuery, NotificationsOverviewQueryVariables>;
export const MarkNeedClaimNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNeedClaimNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkNeedClaimNotificationReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNeedClaimNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"needClaimNotification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<MarkNeedClaimNotificationReadMutation, MarkNeedClaimNotificationReadMutationVariables>;
export const MarkResourceBidNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkResourceBidNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkResourceBidNotificationReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markResourceBidNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceBidNotification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<MarkResourceBidNotificationReadMutation, MarkResourceBidNotificationReadMutationVariables>;
export const MarkAccountNotificationReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAccountNotificationRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkAccountNotificationReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAccountNotificationRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountNotification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"readAt"}}]}}]}}]}}]} as unknown as DocumentNode<MarkAccountNotificationReadMutation, MarkAccountNotificationReadMutationVariables>;
export const MarkAllNotificationsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MarkAllNotificationsReadInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integer"}}]}}]}}]} as unknown as DocumentNode<MarkAllNotificationsReadMutation, MarkAllNotificationsReadMutationVariables>;
export const GetDeliveryPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"GetDeliveryPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAccountDeliveryPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"results"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventCategory"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"summaryFrequencyDays"}}]}}]}}]}}]} as unknown as DocumentNode<GetDeliveryPreferencesMutation, GetDeliveryPreferencesMutationVariables>;
export const SetDeliveryPreferenceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetDeliveryPreference"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eventCategory"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"deliveryStrategy"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"summaryFrequencyDays"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setAccountDeliveryPreference"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pEventCategory"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eventCategory"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pDeliveryStrategy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"deliveryStrategy"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pSummaryFrequencyDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"summaryFrequencyDays"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountDeliveryPreference"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eventCategory"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"summaryFrequencyDays"}}]}}]}}]}}]} as unknown as DocumentNode<SetDeliveryPreferenceMutation, SetDeliveryPreferenceMutationVariables>;
export const AccountProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AccountProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"profileLinks"}}]}}]}}]} as unknown as DocumentNode<AccountProfileQuery, AccountProfileQueryVariables>;
export const UpdateAccountProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAccountProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"patch"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountPatch"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAccountById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"accountPatch"},"value":{"kind":"Variable","name":{"kind":"Name","value":"patch"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"account"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"bio"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"preferredLanguage"}},{"kind":"Field","name":{"kind":"Name","value":"profileLinks"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateAccountProfileMutation, UpdateAccountProfileMutationVariables>;
export const PublishResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PublishResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"location"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NeedIntensity"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"defaultTokenAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryCodes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imageUrls"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isService"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Datetime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishResource"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"location"},"value":{"kind":"Variable","name":{"kind":"Name","value":"location"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"latitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"longitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"intensity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"intensity"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"defaultTokenAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"defaultTokenAmount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"categoryCodes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryCodes"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"imageUrls"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imageUrls"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isProduct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isService"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isService"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"canBeGiven"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"canBeExchanged"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"canBeTakenAway"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"canBeDelivered"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"expiresAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expiresAt"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]}}]} as unknown as DocumentNode<PublishResourceMutation, PublishResourceMutationVariables>;
export const ResourceCategoryOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceCategoryOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResourceCategories"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CODE_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelFr"}},{"kind":"Field","name":{"kind":"Name","value":"sortOrder"}}]}}]}}]}}]} as unknown as DocumentNode<ResourceCategoryOptionsQuery, ResourceCategoryOptionsQueryVariables>;
export const PublicResourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PublicResources"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"browserLatitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"browserLongitude"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BigFloat"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"categoryCodes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isService"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TriStateFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"latitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"latitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"longitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"longitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"browserLatitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"browserLatitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"browserLongitude"},"value":{"kind":"Variable","name":{"kind":"Name","value":"browserLongitude"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchText"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchText"}}},{"kind":"Argument","name":{"kind":"Name","value":"categoryCodes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"categoryCodes"}}},{"kind":"Argument","name":{"kind":"Name","value":"isProduct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isProduct"}}},{"kind":"Argument","name":{"kind":"Name","value":"isService"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isService"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeGiven"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeGiven"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeExchanged"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeExchanged"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeTakenAway"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeTakenAway"}}},{"kind":"Argument","name":{"kind":"Name","value":"canBeDelivered"},"value":{"kind":"Variable","name":{"kind":"Name","value":"canBeDelivered"}}},{"kind":"Argument","name":{"kind":"Name","value":"limitCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limitCount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"creatorDisplayName"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"queryLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"queryLongitude"}}]}}]}}]}}]} as unknown as DocumentNode<PublicResourcesQuery, PublicResourcesQueryVariables>;
export const ResourceDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"intensity"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"resourceCategoryAssignmentsByResourceId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"CATEGORY_CODE_ASC"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categoryCode"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceBidsByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ResourceDetailQuery, ResourceDetailQueryVariables>;
export const SoftDeleteResourceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SoftDeleteResource"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateResourceById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"resourcePatch"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":false}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<SoftDeleteResourceMutation, SoftDeleteResourceMutationVariables>;
export const ResourceOpenBidCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceOpenBidCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"resourceId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"resourceId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"EnumValue","value":"OPEN"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<ResourceOpenBidCountQuery, ResourceOpenBidCountQueryVariables>;
export const ResourceBidsOverviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResourceBidsOverview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ResourceBidsOverviewQuery, ResourceBidsOverviewQueryVariables>;
export const MyResourcesConnectionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyResourcesConnection"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allResources"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"condition"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"creatorAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"creatorAccountId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"BooleanValue","value":true}}]}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"EnumValue","value":"ID_DESC"}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeGiven"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"canBeTakenAway"}},{"kind":"Field","name":{"kind":"Name","value":"canBeDelivered"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<MyResourcesConnectionQuery, MyResourcesConnectionQueryVariables>;
export const SubmitResourceBidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitResourceBid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitResourceBidInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitResourceBid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceBid"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}}]}}]}}]}}]} as unknown as DocumentNode<SubmitResourceBidMutation, SubmitResourceBidMutationVariables>;
export const RespondToResourceBidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RespondToResourceBid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RespondToResourceBidInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondToResourceBid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceBid"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}}]}}]}}]}}]} as unknown as DocumentNode<RespondToResourceBidMutation, RespondToResourceBidMutationVariables>;
export const SentBidsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SentBids"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sentResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BidWorkspaceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BidWorkspaceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceBid"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceConversationsByResourceBidId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]} as unknown as DocumentNode<SentBidsQuery, SentBidsQueryVariables>;
export const ReceivedBidsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReceivedBids"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Cursor"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receivedResourceBids"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"activeOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activeOnly"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BidWorkspaceFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BidWorkspaceFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ResourceBid"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"resourceId"}},{"kind":"Field","name":{"kind":"Name","value":"bidderAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"proposedTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"validUntil"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedByAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"accountByBidderAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceConversationsByResourceBidId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resourceByResourceId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"creatorAccountId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"defaultTokenAmount"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrls"}},{"kind":"Field","name":{"kind":"Name","value":"categoryLabels"}},{"kind":"Field","name":{"kind":"Name","value":"isProduct"}},{"kind":"Field","name":{"kind":"Name","value":"isService"}},{"kind":"Field","name":{"kind":"Name","value":"canBeExchanged"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"accountByCreatorAccountId"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"externalSubject"}}]}}]}}]}}]} as unknown as DocumentNode<ReceivedBidsQuery, ReceivedBidsQueryVariables>;
export const CancelResourceBidDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelResourceBid"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CancelResourceBidInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelResourceBid"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resourceBid"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<CancelResourceBidMutation, CancelResourceBidMutationVariables>;
export const AccountEventsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"AccountEvents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"topic"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listen"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"topic"},"value":{"kind":"Variable","name":{"kind":"Name","value":"topic"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"relatedNodeId"}}]}}]}}]} as unknown as DocumentNode<AccountEventsSubscription, AccountEventsSubscriptionVariables>;